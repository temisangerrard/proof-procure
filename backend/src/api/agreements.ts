import { Router, Request, Response } from "express";
import { db } from "../db/client";
import { extractAgreement } from "../extraction/pipeline";
import { AgreementDataSchema } from "../extraction/schema";
import { nanoid } from "nanoid";

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
              buyer_ratified_at, supplier_ratified_at, contract_address,
              agreement_hash, created_at, updated_at
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
