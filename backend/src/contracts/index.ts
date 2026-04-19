import { ethers } from "ethers";
import { deriveWallet, deriveAddress } from "../wallet/derive";
import { signAndSend } from "../wallet/signer";
import { db } from "../db/client";
import path from "path";
import fs from "fs";

// ── ABI Loading ──────────────────────────────────────────────────────────

const CONTRACTS_OUT = path.resolve(__dirname, "../../../contracts/out");

function loadAbi(contractPath: string): ethers.InterfaceAbi {
  const raw = JSON.parse(fs.readFileSync(path.join(CONTRACTS_OUT, contractPath), "utf-8"));
  return raw.abi;
}

const AGREEMENT_ABI = loadAbi("AgreementContract.sol/AgreementContract.json");
const FACTORY_ABI = loadAbi("ProofProcureFactory.sol/ProofProcureFactory.json");
const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function balanceOf(address account) external view returns (uint256)",
];

// ── Config ───────────────────────────────────────────────────────────────

function getFactoryAddress(): string {
  const addr = process.env.FACTORY_CONTRACT_ADDRESS;
  if (!addr) throw new Error("FACTORY_CONTRACT_ADDRESS not configured");
  return addr;
}

function getUsdcAddress(): string {
  const addr = process.env.USDC_CONTRACT_ADDRESS;
  if (!addr) throw new Error("USDC_CONTRACT_ADDRESS not configured");
  return addr;
}

export function getProvider(): ethers.JsonRpcProvider {
  const rpc = process.env.BASE_RPC_URL || "https://mainnet.base.org";
  return new ethers.JsonRpcProvider(rpc);
}

// ── Confirmation type mapping ────────────────────────────────────────────

const CONFIRMATION_TYPE_MAP: Record<string, number> = {
  BUYER_CONFIRMATION: 0,
  SHIPPING_CONFIRMATION: 1,
  RECEIPT_UPLOAD: 2,
};

// ── Contract State enum mapping ──────────────────────────────────────────

const CONTRACT_STATE_MAP: Record<number, string> = {
  0: "DRAFT",
  1: "PROPOSED",
  2: "RATIFIED",
  3: "DEPLOYED",
  4: "FUNDED",
  5: "DELIVERED_PENDING_CONFIRMATION",
  6: "COMPLETED",
  7: "EXPIRED",
  8: "REFUNDED",
};

// ── Deploy Agreement ─────────────────────────────────────────────────────

export interface DeployParams {
  agreementId: string;
  buyerEmail: string;
  supplierEmail: string;
  item: string;
  quantity: number;
  pricePerUnit: bigint;
  totalAmount: bigint;
  deliveryDeadline: number;
  confirmationWindow: number;
  confirmationType: string;
  agreementHash: string;
  expiryTimestamp: number;
}

export async function deployAgreement(params: DeployParams): Promise<string> {
  const buyerAddress = deriveAddress(params.buyerEmail);
  const supplierAddress = deriveAddress(params.supplierEmail);

  const factory = new ethers.Contract(getFactoryAddress(), FACTORY_ABI, getProvider());
  const spec = {
    buyer: buyerAddress,
    supplier: supplierAddress,
    item: params.item,
    quantity: params.quantity,
    pricePerUnit: params.pricePerUnit,
    totalAmount: params.totalAmount,
    deliveryDeadline: params.deliveryDeadline,
    confirmationWindow: params.confirmationWindow,
    confirmationType: CONFIRMATION_TYPE_MAP[params.confirmationType] ?? 0,
    agreementHash: params.agreementHash,
    expiryTimestamp: params.expiryTimestamp,
  };

  const txData = await factory.createAgreement.populateTransaction(spec);
  const receipt = await signAndSend(params.buyerEmail, { ...txData, to: getFactoryAddress() });

  const iface = new ethers.Interface(FACTORY_ABI);
  let contractAddress: string | null = null;
  for (const log of receipt.logs) {
    try {
      const parsed = iface.parseLog({ topics: log.topics as string[], data: log.data });
      if (parsed?.name === "AgreementCreated") {
        contractAddress = parsed.args.agreementAddr;
        break;
      }
    } catch {
      continue;
    }
  }

  if (!contractAddress) throw new Error("AgreementCreated event not found in receipt");

  await db.query(
    `UPDATE agreements SET contract_address = $1, state = 'DEPLOYED', updated_at = now() WHERE id = $2`,
    [contractAddress, params.agreementId]
  );

  await logAuditEvent(params.agreementId, "CONTRACT_DEPLOYED", "system", receipt.hash, {
    contract_address: contractAddress,
  });

  return contractAddress;
}

// ── Fund Agreement ───────────────────────────────────────────────────────

export async function fundAgreement(
  agreementId: string,
  buyerEmail: string,
  contractAddress: string,
  totalAmount: bigint
): Promise<string> {
  const usdc = new ethers.Contract(getUsdcAddress(), ERC20_ABI, getProvider());

  // Approve USDC spend
  const approveTx = await usdc.approve.populateTransaction(contractAddress, totalAmount);
  await signAndSend(buyerEmail, { ...approveTx, to: getUsdcAddress() });

  // Call fund() on agreement contract
  const agreement = new ethers.Contract(contractAddress, AGREEMENT_ABI, getProvider());
  const fundTx = await agreement.fund.populateTransaction();
  const receipt = await signAndSend(buyerEmail, { ...fundTx, to: contractAddress });

  await db.query(
    `UPDATE agreements SET state = 'FUNDED', updated_at = now() WHERE id = $1`,
    [agreementId]
  );

  await logAuditEvent(agreementId, "AGREEMENT_FUNDED", buyerEmail, receipt.hash, {
    amount: totalAmount.toString(),
  });

  return receipt.hash;
}

// ── Mark Delivered ───────────────────────────────────────────────────────

export async function markDelivered(
  agreementId: string,
  supplierEmail: string,
  contractAddress: string
): Promise<string> {
  const agreement = new ethers.Contract(contractAddress, AGREEMENT_ABI, getProvider());
  const txData = await agreement.markDelivered.populateTransaction();
  const receipt = await signAndSend(supplierEmail, { ...txData, to: contractAddress });

  await db.query(
    `UPDATE agreements SET state = 'DELIVERED_PENDING_CONFIRMATION', delivered_at = now(), updated_at = now() WHERE id = $1`,
    [agreementId]
  );

  await logAuditEvent(agreementId, "DELIVERY_MARKED", supplierEmail, receipt.hash, {});

  return receipt.hash;
}

// ── Approve Delivery ─────────────────────────────────────────────────────

export async function approveDelivery(
  agreementId: string,
  buyerEmail: string,
  contractAddress: string
): Promise<string> {
  const agreement = new ethers.Contract(contractAddress, AGREEMENT_ABI, getProvider());
  const txData = await agreement.approve.populateTransaction();
  const receipt = await signAndSend(buyerEmail, { ...txData, to: contractAddress });

  await db.query(
    `UPDATE agreements SET state = 'COMPLETED', updated_at = now() WHERE id = $1`,
    [agreementId]
  );

  await logAuditEvent(agreementId, "PAYMENT_RELEASED", buyerEmail, receipt.hash, {
    reason: "buyer_approved",
  });

  return receipt.hash;
}

// ── Reject Delivery ──────────────────────────────────────────────────────

export async function rejectDelivery(
  agreementId: string,
  buyerEmail: string,
  contractAddress: string
): Promise<string> {
  const agreement = new ethers.Contract(contractAddress, AGREEMENT_ABI, getProvider());
  const txData = await agreement.reject.populateTransaction();
  const receipt = await signAndSend(buyerEmail, { ...txData, to: contractAddress });

  await db.query(
    `UPDATE agreements SET state = 'EXPIRED', updated_at = now() WHERE id = $1`,
    [agreementId]
  );

  await logAuditEvent(agreementId, "PAYMENT_REJECTED", buyerEmail, receipt.hash, {});

  return receipt.hash;
}

// ── Check Timeout ────────────────────────────────────────────────────────

export async function checkTimeout(
  agreementId: string,
  contractAddress: string,
  callerEmail: string
): Promise<string> {
  const agreement = new ethers.Contract(contractAddress, AGREEMENT_ABI, getProvider());
  const txData = await agreement.checkTimeout.populateTransaction();
  const receipt = await signAndSend(callerEmail, { ...txData, to: contractAddress });

  await db.query(
    `UPDATE agreements SET state = 'COMPLETED', updated_at = now() WHERE id = $1`,
    [agreementId]
  );

  await logAuditEvent(agreementId, "PAYMENT_RELEASED", "keeper", receipt.hash, {
    reason: "timeout",
  });

  return receipt.hash;
}

// ── Sync Onchain State ───────────────────────────────────────────────────

export async function syncOnchainState(contractAddress: string): Promise<string> {
  const agreement = new ethers.Contract(contractAddress, AGREEMENT_ABI, getProvider());
  const stateNum = await agreement.state();
  return CONTRACT_STATE_MAP[Number(stateNum)] ?? "UNKNOWN";
}

// ── Event Listener ───────────────────────────────────────────────────────

export function listenToAgreementEvents(contractAddress: string, agreementId: string): void {
  const provider = getProvider();
  const agreement = new ethers.Contract(contractAddress, AGREEMENT_ABI, provider);

  const eventHandlers: Record<string, { state: string; eventType: string }> = {
    AgreementFunded: { state: "FUNDED", eventType: "AGREEMENT_FUNDED" },
    DeliveryMarked: { state: "DELIVERED_PENDING_CONFIRMATION", eventType: "DELIVERY_MARKED" },
    PaymentReleased: { state: "COMPLETED", eventType: "PAYMENT_RELEASED" },
    PaymentRejected: { state: "EXPIRED", eventType: "PAYMENT_REJECTED" },
    AgreementExpired: { state: "EXPIRED", eventType: "AGREEMENT_EXPIRED" },
    RefundIssued: { state: "REFUNDED", eventType: "REFUND_ISSUED" },
  };

  for (const [eventName, { state, eventType }] of Object.entries(eventHandlers)) {
    agreement.on(eventName, async (...args: unknown[]) => {
      const event = args[args.length - 1] as ethers.ContractEventPayload;
      try {
        await db.query(
          `UPDATE agreements SET state = $1, updated_at = now() WHERE id = $2`,
          [state, agreementId]
        );
        await logAuditEvent(
          agreementId,
          eventType,
          "onchain_event",
          event.log?.transactionHash ?? null,
          {}
        );
      } catch (err) {
        console.error(`Event sync failed for ${eventName} on ${agreementId}:`, err);
      }
    });
  }
}

// ── Audit Helper ─────────────────────────────────────────────────────────

async function logAuditEvent(
  agreementId: string,
  eventType: string,
  actor: string,
  txHash: string | null,
  metadata: Record<string, unknown>
): Promise<void> {
  await db.query(
    `INSERT INTO audit_events (id, agreement_id, event_type, actor, onchain_tx_hash, metadata, created_at)
     VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, now())`,
    [agreementId, eventType, actor, txHash, JSON.stringify(metadata)]
  );
}
