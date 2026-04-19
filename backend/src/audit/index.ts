import { Router, Request, Response } from "express";
import { db } from "../db/client";

/** Record an audit event. Called from anywhere in the backend. */
export async function recordAuditEvent(
  agreementId: string,
  eventType: string,
  actor: string,
  txHash?: string | null,
  metadata?: Record<string, unknown>
): Promise<void> {
  await db.query(
    `INSERT INTO audit_events (id, agreement_id, event_type, actor, onchain_tx_hash, metadata, created_at)
     VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, now())`,
    [agreementId, eventType, actor, txHash ?? null, JSON.stringify(metadata ?? {})]
  );
}

/** GET /api/agreements/:id/audit — export audit trail as JSON */
export const auditRouter = Router();

auditRouter.get("/:id/audit", async (req: Request, res: Response) => {
  try {
    const result = await db.query(
      `SELECT ae.id, ae.event_type, ae.actor, ae.onchain_tx_hash, ae.metadata, ae.created_at
       FROM audit_events ae
       JOIN agreements a ON ae.agreement_id = a.id
       WHERE a.id::text = $1 OR a.share_token = $1
       ORDER BY ae.created_at ASC`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      // Check if agreement exists at all
      const agreement = await db.query(
        `SELECT id FROM agreements WHERE id::text = $1 OR share_token = $1`,
        [req.params.id]
      );
      if (agreement.rows.length === 0) {
        res.status(404).json({ error: "Agreement not found" });
        return;
      }
    }

    res.json({ agreement_id: req.params.id, events: result.rows });
  } catch (err) {
    console.error("Audit fetch failed:", err);
    res.status(500).json({ error: "Failed to fetch audit trail" });
  }
});
