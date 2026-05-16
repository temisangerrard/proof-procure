import { ethers } from "ethers";
import { env } from "./env";
import { signAndSend } from "./wallet";

// ---- ABIs (inlined) --------------------------------------------------------

const AGREEMENT_ABI = [
  {
    type: "function",
    name: "approve",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "checkTimeout",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "claimRefund",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "deliveredAt",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "expire",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "fund",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getSpec",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "tuple",
        internalType: "struct AgreementContract.AgreementSpec",
        components: [
          { name: "buyer", type: "address", internalType: "address" },
          { name: "supplier", type: "address", internalType: "address" },
          { name: "item", type: "string", internalType: "string" },
          { name: "quantity", type: "uint256", internalType: "uint256" },
          { name: "pricePerUnit", type: "uint256", internalType: "uint256" },
          { name: "totalAmount", type: "uint256", internalType: "uint256" },
          {
            name: "deliveryDeadline",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "confirmationWindow",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "confirmationType",
            type: "uint8",
            internalType: "enum AgreementContract.ConfirmationType",
          },
          {
            name: "agreementHash",
            type: "bytes32",
            internalType: "bytes32",
          },
          {
            name: "expiryTimestamp",
            type: "uint256",
            internalType: "uint256",
          },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "initialize",
    inputs: [
      {
        name: "_spec",
        type: "tuple",
        internalType: "struct AgreementContract.AgreementSpec",
        components: [
          { name: "buyer", type: "address", internalType: "address" },
          { name: "supplier", type: "address", internalType: "address" },
          { name: "item", type: "string", internalType: "string" },
          { name: "quantity", type: "uint256", internalType: "uint256" },
          { name: "pricePerUnit", type: "uint256", internalType: "uint256" },
          { name: "totalAmount", type: "uint256", internalType: "uint256" },
          {
            name: "deliveryDeadline",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "confirmationWindow",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "confirmationType",
            type: "uint8",
            internalType: "enum AgreementContract.ConfirmationType",
          },
          {
            name: "agreementHash",
            type: "bytes32",
            internalType: "bytes32",
          },
          {
            name: "expiryTimestamp",
            type: "uint256",
            internalType: "uint256",
          },
        ],
      },
      { name: "_usdc", type: "address", internalType: "address" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "initialized",
    inputs: [],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "markDelivered",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "reject",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "state",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint8",
        internalType: "enum AgreementContract.State",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "timeoutReached",
    inputs: [],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "usdc",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "contract IERC20" }],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "AgreementFunded",
    inputs: [
      { name: "agreementHash", type: "bytes32", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "AgreementCreated",
    inputs: [
      { name: "agreementHash", type: "bytes32", indexed: true },
      { name: "agreementAddr", type: "address", indexed: true },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "DeliveryMarked",
    inputs: [
      { name: "agreementHash", type: "bytes32", indexed: true },
      { name: "timestamp", type: "uint256", indexed: false },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "PaymentReleased",
    inputs: [
      { name: "agreementHash", type: "bytes32", indexed: true },
      { name: "to", type: "address", indexed: false },
      { name: "amount", type: "uint256", indexed: false },
      { name: "reason", type: "string", indexed: false },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "PaymentRejected",
    inputs: [{ name: "agreementHash", type: "bytes32", indexed: true }],
    anonymous: false,
  },
  {
    type: "event",
    name: "RefundIssued",
    inputs: [
      { name: "agreementHash", type: "bytes32", indexed: true },
      { name: "to", type: "address", indexed: false },
      { name: "amount", type: "uint256", indexed: false },
    ],
    anonymous: false,
  },
];

const FACTORY_ABI = [
  {
    type: "function",
    name: "createAgreement",
    inputs: [
      {
        name: "spec",
        type: "tuple",
        components: [
          { name: "buyer", type: "address" },
          { name: "supplier", type: "address" },
          { name: "item", type: "string" },
          { name: "quantity", type: "uint256" },
          { name: "pricePerUnit", type: "uint256" },
          { name: "totalAmount", type: "uint256" },
          { name: "deliveryDeadline", type: "uint256" },
          { name: "confirmationWindow", type: "uint256" },
          { name: "confirmationType", type: "uint8" },
          { name: "agreementHash", type: "bytes32" },
          { name: "expiryTimestamp", type: "uint256" },
        ],
      },
    ],
    outputs: [{ name: "", type: "address" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getAgreement",
    inputs: [{ name: "agreementHash", type: "bytes32" }],
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "AgreementCreated",
    inputs: [
      { name: "agreementHash", type: "bytes32", indexed: true },
      { name: "agreementAddr", type: "address", indexed: true },
    ],
    anonymous: false,
  },
];

const ERC20_ABI = [
  {
    type: "function",
    name: "approve",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "balanceOf",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
];

// ---- Provider --------------------------------------------------------------

export function getProvider(): ethers.JsonRpcProvider {
  return new ethers.JsonRpcProvider(env.ARC_RPC_URL);
}

// ---- On-chain functions ----------------------------------------------------

export async function deployAgreementOnChain(params: {
  buyerEmail: string;
  supplierEmail: string;
  item: string;
  quantity: number;
  pricePerUnit: bigint;
  totalAmount: bigint;
  deliveryDeadline: number;
  confirmationWindow: number;
  confirmationType: 0 | 1 | 2;
  agreementHash: string;
  expiryTimestamp: number;
}): Promise<{ contractAddress: string; txHash: string }> {
  const provider = getProvider();
  const { deriveAddress } = await import("./wallet");

  const buyerAddress = deriveAddress(params.buyerEmail);
  const supplierAddress = deriveAddress(params.supplierEmail);

  const factoryAddress = env.FACTORY_CONTRACT_ADDRESS;
  const factory = new ethers.Interface(FACTORY_ABI);

  const spec = [
    buyerAddress,
    supplierAddress,
    params.item,
    BigInt(params.quantity),
    params.pricePerUnit,
    params.totalAmount,
    BigInt(params.deliveryDeadline),
    BigInt(params.confirmationWindow),
    params.confirmationType,
    params.agreementHash as `0x${string}`,
    BigInt(params.expiryTimestamp),
  ];

  const data = factory.encodeFunctionData("createAgreement", [spec]);

  const receipt = await signAndSend(params.buyerEmail, provider, {
    to: factoryAddress,
    data,
  });

  // Parse the AgreementCreated event from the receipt to get contract address
  const factoryIface = new ethers.Interface(FACTORY_ABI);
  let contractAddress = "";
  for (const log of receipt.logs) {
    try {
      const parsed = factoryIface.parseLog(log);
      if (parsed && parsed.name === "AgreementCreated") {
        contractAddress = parsed.args.agreementAddr as string;
        break;
      }
    } catch {
      // ignore unparseable logs
    }
  }

  if (!contractAddress) {
    throw new Error("AgreementCreated event not found in receipt");
  }

  return { contractAddress, txHash: receipt.hash };
}

export async function fundAgreementOnChain(params: {
  buyerEmail: string;
  contractAddress: string;
  totalAmount: bigint;
}): Promise<{ txHash: string }> {
  const provider = getProvider();
  const usdcAddress = env.USDC_CONTRACT_ADDRESS;

  // 1. Approve USDC spend
  const erc20 = new ethers.Interface(ERC20_ABI);
  const approveData = erc20.encodeFunctionData("approve", [
    params.contractAddress,
    params.totalAmount,
  ]);

  await signAndSend(params.buyerEmail, provider, {
    to: usdcAddress,
    data: approveData,
  });

  // 2. Call fund() on the agreement contract
  const agreementIface = new ethers.Interface(AGREEMENT_ABI);
  const fundData = agreementIface.encodeFunctionData("fund", []);

  const receipt = await signAndSend(params.buyerEmail, provider, {
    to: params.contractAddress,
    data: fundData,
  });

  return { txHash: receipt.hash };
}

export async function markDeliveredOnChain(params: {
  supplierEmail: string;
  contractAddress: string;
}): Promise<{ txHash: string }> {
  const provider = getProvider();
  const agreementIface = new ethers.Interface(AGREEMENT_ABI);
  const data = agreementIface.encodeFunctionData("markDelivered", []);

  const receipt = await signAndSend(params.supplierEmail, provider, {
    to: params.contractAddress,
    data,
  });

  return { txHash: receipt.hash };
}

export async function approveDeliveryOnChain(params: {
  buyerEmail: string;
  contractAddress: string;
}): Promise<{ txHash: string }> {
  const provider = getProvider();
  const agreementIface = new ethers.Interface(AGREEMENT_ABI);
  const data = agreementIface.encodeFunctionData("approve", []);

  const receipt = await signAndSend(params.buyerEmail, provider, {
    to: params.contractAddress,
    data,
  });

  return { txHash: receipt.hash };
}

export async function rejectDeliveryOnChain(params: {
  buyerEmail: string;
  contractAddress: string;
}): Promise<{ txHash: string }> {
  const provider = getProvider();
  const agreementIface = new ethers.Interface(AGREEMENT_ABI);
  const data = agreementIface.encodeFunctionData("reject", []);

  const receipt = await signAndSend(params.buyerEmail, provider, {
    to: params.contractAddress,
    data,
  });

  return { txHash: receipt.hash };
}

export async function checkTimeoutOnChain(params: {
  contractAddress: string;
  keeperPrivateKey: string;
}): Promise<{ txHash: string }> {
  const provider = getProvider();
  const keeper = new ethers.Wallet(params.keeperPrivateKey, provider);
  const agreementIface = new ethers.Interface(AGREEMENT_ABI);
  const data = agreementIface.encodeFunctionData("checkTimeout", []);

  const tx = await keeper.sendTransaction({
    to: params.contractAddress,
    data,
  });
  const receipt = await tx.wait();
  if (!receipt) throw new Error("Transaction receipt is null");

  return { txHash: receipt.hash };
}

export async function isTimeoutReached(
  contractAddress: string,
): Promise<boolean> {
  const provider = getProvider();
  const agreement = new ethers.Contract(
    contractAddress,
    AGREEMENT_ABI,
    provider,
  );
  return (await agreement.timeoutReached()) as boolean;
}
