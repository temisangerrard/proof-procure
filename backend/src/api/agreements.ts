import { Router, Request, Response } from "express";
import { ethers } from "ethers";
import { db } from "../db/client";
import { extractAgreement } from "../extraction/pipeline";
import { AgreementDataSchema } from "../extraction/schema";
import { nanoid } from "nanoid";
import {
  deployAgreement,
  fundAgreement,
  markDelivered,
  approveDelivery,
  rejectDelivery,
  listenToAgreementEvents,
  syncOnchainState,
} from "../contracts/index";
import { deriveAddress } from "../wallet/derive";

export const agreementsRouter = Router();

// TASK-10/11: POST /api/agreements/extract — submit raw input, get extraction
agreementsRouter.post("/extract", async (req: Request, res: Response) => {
  const { raw_input } = req.body;
  if (!raw_input || typeof raw_input !== "string" || !raw_input.trim()) {
    res.status(400).json({ error: "raw_input is required" });
    return;
  }

  try {
    const result = await extractAgreement(raw_input.trim());

    if (result.state === "DRAFT") {
      const shareToken = nanoid(21);
      await db.query(
        `UPDATE agreements SET share_token = $1 WHERE id = $2`,
        [shareToken, result.id]
      );

      await db.query(
        `INSERT INTO audit_events (id, agreement_id, event_type, actor, metadata, created_at)
         VALUES (gen_random_uuid(), $1, 'EXTRACTION_COMPLETED', 'system', $2, now())`,
        [result.id, JSON.stringify({ confidence: result.extraction.confidence })]
      );

      res.status(201).json({
        id: result.id,
        state: result.state,
        extraction: result.extraction,
        share_url: `/agreement/${shareToken}`,
      });
    } else {
      res.status(422).json({
        id: result.id,
        state: result.state,
        extraction: result.extraction,
        message: "Extraction confidence too low. Please provide more details.",
      });
    }
  } catch (err) {
    console.error("Extraction failed:", err);
    res.status(500).json({ error: "Extraction failed" });
  }
});

// TASK-11: GET /api/agreements/:id — get agreement by ID or share token
agreementsRouter.get("/:id", async (req: Request, res: Response) => {
  try {
    const result = await db.query(
      `SELECT id, state, extracted_data, confidence_score, share_token,
              buyer_ratified_at, supplier_ratified_at,
              buyer_ratification_sig, supplier_ratification_sig,
              contract_address, agreement_hash, confirmation_window,
              delivery_deadline, expiry_timestamp, delivered_at,
              created_at, updated_at
       FROM agreements
       WHERE id::text = $1 OR share_token = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: "Agreement not found" });
      return;
    }

    const row = result.rows[0];
    res.json({
      ...row,
      share_url: row.share_token ? `/agreement/${row.share_token}` : null,
    });
  } catch (err) {
    console.error("Fetch agreement failed:", err);
    res.status(500).json({ error: "Failed to fetch agreement" });
  }
});

// TASK-11: PATCH /api/agreements/:id — edit proposal fields before ratification
agreementsRouter.patch("/:id", async (req: Request, res: Response) => {
  const { fields } = req.body;
  if (!fields || typeof fields !== "object") {
    res.status(400).json({ error: "fields object is required" });
    return;
  }

  try {
    const existing = await db.query(
      `SELECT id, state, extracted_data FROM agreements WHERE id::text = $1 OR share_token = $1`,
      [req.params.id]
    );

    if (existing.rows.length === 0) {
      res.status(404).json({ error: "Agreement not found" });
      return;
    }

    const agreement = existing.rows[0];
    if (agreement.state !== "DRAFT" && agreement.state !== "PROPOSED") {
      res.status(409).json({
        error: "Agreement can only be edited in DRAFT or PROPOSED state",
      });
      return;
    }

    const merged = { ...agreement.extracted_data, ...fields };
    const validation = AgreementDataSchema.safeParse(merged);

    await db.query(
      `UPDATE agreements
       SET extracted_data = $1, state = 'PROPOSED', updated_at = now()
       WHERE id = $2`,
      [JSON.stringify(merged), agreement.id]
    );

    await db.query(
      `INSERT INTO audit_events (id, agreement_id, event_type, actor, metadata, created_at)
       VALUES (gen_random_uuid(), $1, 'PROPOSAL_EDITED', 'buyer', $2, now())`,
      [agreement.id, JSON.stringify({ edited_fields: Object.keys(fields) })]
    );

    res.json({
      id: agreement.id,
      state: "PROPOSED",
      extracted_data: merged,
      valid: validation.success,
      validation_errors: validation.success
        ? []
        : validation.error.issues.map((i) => ({
            path: i.path.join("."),
            message: i.message,
          })),
    });
  } catch (err) {
    console.error("Patch agreement failed:", err);
    res.status(500).json({ error: "Failed to update agreement" });
  }
});

// ── TASK-13: Ratification ────────────────────────────────────────────────

function computeAgreementHash(data: Record<string, unknown>): string {
  const canonical = JSON.stringify(data, Object.keys(data).sort());
  return ethers.keccak256(ethers.toUtf8Bytes(canonical));
}

agreementsRouter.post("/:id/ratify", async (req: Request, res: Response) => {
  const { role, signature } = req.body;
  if (!role || !signature || !["buyer", "supplier"].includes(role)) {
    res.status(400).json({ error: "role (buyer|supplier) and signature are required" });
    return;
  }

  try {
    const result = await db.query(
      `SELECT id, state, extracted_data, buyer_ratified_at, supplier_ratified_at,
              buyer_ratification_sig, supplier_ratification_sig, agreement_hash
       FROM agreements WHERE id::text = $1 OR share_token = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: "Agreement not found" });
      return;
    }

    const agreement = result.rows[0];
    if (!["DRAFT", "PROPOSED", "RATIFIED"].includes(agreement.state)) {
      res.status(409).json({ error: `Cannot ratify in ${agreement.state} state` });
      return;
    }

    const validation = AgreementDataSchema.safeParse(agreement.extracted_data);
    if (!validation.success) {
      res.status(422).json({ error: "Agreement data is incomplete", issues: validation.error.issues });
      return;
    }

    const currentHash = computeAgreementHash(agreement.extracted_data);

    // If other party already ratified, verify spec hasn't changed
    const otherRole = role === "buyer" ? "supplier" : "buyer";
    const otherRatifiedAt = agreement[`${otherRole}_ratified_at`];
    if (otherRatifiedAt && agreement.agreement_hash && agreement.agreement_hash !== currentHash) {
      res.status(409).json({ error: "Agreement spec changed since other party ratified. Both must re-ratify." });
      return;
    }

    const now = new Date().toISOString();
    const sigCol = role === "buyer" ? "buyer_ratification_sig" : "supplier_ratification_sig";
    const tsCol = role === "buyer" ? "buyer_ratified_at" : "supplier_ratified_at";

    await db.query(
      `UPDATE agreements SET ${sigCol} = $1, ${tsCol} = $2, agreement_hash = $3, updated_at = now() WHERE id = $4`,
      [signature, now, currentHash, agreement.id]
    );

    await db.query(
      `INSERT INTO audit_events (id, agreement_id, event_type, actor, metadata, created_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, now())`,
      [agreement.id, `${role.toUpperCase()}_RATIFIED`, role, JSON.stringify({ signature })]
    );

    // Check if both parties have now ratified
    const bothRatified =
      (role === "buyer" && agreement.supplier_ratified_at) ||
      (role === "supplier" && agreement.buyer_ratified_at);

    if (bothRatified) {
      await db.query(
        `UPDATE agreements SET state = 'RATIFIED', updated_at = now() WHERE id = $1`,
        [agreement.id]
      );

      await db.query(
        `INSERT INTO audit_events (id, agreement_id, event_type, actor, metadata, created_at)
         VALUES (gen_random_uuid(), $1, 'DUAL_RATIFICATION_COMPLETE', 'system', '{}', now())`,
        [agreement.id]
      );

      // Trigger deployment
      triggerDeployment(agreement.id, agreement.extracted_data, currentHash).catch((err) =>
        console.error(`Deployment failed for ${agreement.id}:`, err)
      );

      res.json({ id: agreement.id, state: "RATIFIED", dual_ratified: true, deploying: true });
      return;
    }

    res.json({ id: agreement.id, state: agreement.state, dual_ratified: false, [`${role}_ratified`]: true });
  } catch (err) {
    console.error("Ratification failed:", err);
    res.status(500).json({ error: "Ratification failed" });
  }
});

async function triggerDeployment(
  agreementId: string,
  data: Record<string, unknown>,
  agreementHash: string
): Promise<void> {
  const buyer = data.buyer as { email?: string };
  const supplier = data.supplier as { email?: string };
  if (!buyer?.email || !supplier?.email) throw new Error("Buyer and supplier emails required for deployment");

  const totalUsdc = BigInt(Math.round((data.total as number) * 1e6));
  const priceUsdc = BigInt(Math.round((data.price as number) * 1e6));
  const deliveryEnd = data.delivery_window as { end: string };
  const expiryStr = data.expiry as string;

  const contractAddress = await deployAgreement({
    agreementId,
    buyerEmail: buyer.email,
    supplierEmail: supplier.email,
    item: data.item as string,
    quantity: data.quantity as number,
    pricePerUnit: priceUsdc,
    totalAmount: totalUsdc,
    deliveryDeadline: Math.floor(new Date(deliveryEnd.end).getTime() / 1000),
    confirmationWindow: data.confirmation_window as number,
    confirmationType: data.confirmation_type as string,
    agreementHash,
    expiryTimestamp: Math.floor(new Date(expiryStr).getTime() / 1000),
  });

  listenToAgreementEvents(contractAddress, agreementId);
}

// ── TASK-14: Contract action endpoints ───────────────────────────────────

agreementsRouter.post("/:id/fund", async (req: Request, res: Response) => {
  const { buyer_email } = req.body;
  if (!buyer_email) { res.status(400).json({ error: "buyer_email required" }); return; }

  try {
    const row = await getAgreementRow(req.params.id);
    if (!row) { res.status(404).json({ error: "Agreement not found" }); return; }
    if (row.state !== "DEPLOYED") { res.status(409).json({ error: `Cannot fund in ${row.state} state` }); return; }

    const totalUsdc = BigInt(Math.round((row.extracted_data.total as number) * 1e6));
    const txHash = await fundAgreement(row.id, buyer_email, row.contract_address, totalUsdc);
    res.json({ id: row.id, state: "FUNDED", tx_hash: txHash });
  } catch (err) {
    console.error("Fund failed:", err);
    res.status(500).json({ error: "Funding failed" });
  }
});

agreementsRouter.post("/:id/deliver", async (req: Request, res: Response) => {
  const { supplier_email } = req.body;
  if (!supplier_email) { res.status(400).json({ error: "supplier_email required" }); return; }

  try {
    const row = await getAgreementRow(req.params.id);
    if (!row) { res.status(404).json({ error: "Agreement not found" }); return; }
    if (row.state !== "FUNDED") { res.status(409).json({ error: `Cannot mark delivered in ${row.state} state` }); return; }

    const txHash = await markDelivered(row.id, supplier_email, row.contract_address);
    res.json({ id: row.id, state: "DELIVERED_PENDING_CONFIRMATION", tx_hash: txHash });
  } catch (err) {
    console.error("Deliver failed:", err);
    res.status(500).json({ error: "Mark delivered failed" });
  }
});

agreementsRouter.post("/:id/approve", async (req: Request, res: Response) => {
  const { buyer_email } = req.body;
  if (!buyer_email) { res.status(400).json({ error: "buyer_email required" }); return; }

  try {
    const row = await getAgreementRow(req.params.id);
    if (!row) { res.status(404).json({ error: "Agreement not found" }); return; }
    if (row.state !== "DELIVERED_PENDING_CONFIRMATION") { res.status(409).json({ error: `Cannot approve in ${row.state} state` }); return; }

    const txHash = await approveDelivery(row.id, buyer_email, row.contract_address);
    res.json({ id: row.id, state: "COMPLETED", tx_hash: txHash });
  } catch (err) {
    console.error("Approve failed:", err);
    res.status(500).json({ error: "Approval failed" });
  }
});

agreementsRouter.post("/:id/reject", async (req: Request, res: Response) => {
  const { buyer_email } = req.body;
  if (!buyer_email) { res.status(400).json({ error: "buyer_email required" }); return; }

  try {
    const row = await getAgreementRow(req.params.id);
    if (!row) { res.status(404).json({ error: "Agreement not found" }); return; }
    if (row.state !== "DELIVERED_PENDING_CONFIRMATION") { res.status(409).json({ error: `Cannot reject in ${row.state} state` }); return; }

    const txHash = await rejectDelivery(row.id, buyer_email, row.contract_address);
    res.json({ id: row.id, state: "EXPIRED", tx_hash: txHash });
  } catch (err) {
    console.error("Reject failed:", err);
    res.status(500).json({ error: "Rejection failed" });
  }
});

agreementsRouter.get("/:id/status", async (req: Request, res: Response) => {
  try {
    const row = await getAgreementRow(req.params.id);
    if (!row) { res.status(404).json({ error: "Agreement not found" }); return; }

    let onchainState: string | null = null;
    if (row.contract_address) {
      onchainState = await syncOnchainState(row.contract_address);
    }

    res.json({
      id: row.id,
      db_state: row.state,
      onchain_state: onchainState,
      contract_address: row.contract_address,
      buyer_ratified_at: row.buyer_ratified_at,
      supplier_ratified_at: row.supplier_ratified_at,
    });
  } catch (err) {
    console.error("Status check failed:", err);
    res.status(500).json({ error: "Status check failed" });
  }
});

async function getAgreementRow(idOrToken: string | string[]) {
  const id = Array.isArray(idOrToken) ? idOrToken[0] : idOrToken;
  const result = await db.query(
    `SELECT id, state, extracted_data, contract_address, agreement_hash,
            buyer_ratified_at, supplier_ratified_at, confirmation_window,
            delivered_at
     FROM agreements WHERE id::text = $1 OR share_token = $1`,
    [id]
  );
  return result.rows[0] ?? null;
}
