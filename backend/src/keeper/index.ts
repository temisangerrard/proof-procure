import { db } from "../db/client";
import { checkTimeout } from "../contracts/index";
import { notifyAgreementUpdate } from "../notifications/orchestrator";

const KEEPER_INTERVAL_MS = 60_000;
const KEEPER_EMAIL = process.env.KEEPER_EMAIL || "keeper@proofprocure.com";

async function runKeeperCycle(): Promise<void> {
  const result = await db.query(
    `SELECT id, contract_address, delivered_at, confirmation_window
     FROM agreements
     WHERE state = 'DELIVERED_PENDING_CONFIRMATION'
       AND delivered_at IS NOT NULL
       AND contract_address IS NOT NULL`
  );

  for (const row of result.rows) {
    const elapsed =
      (Date.now() - new Date(row.delivered_at).getTime()) / 1000;

    if (elapsed <= row.confirmation_window) continue;

    try {
      const txHash = await checkTimeout(row.id, row.contract_address, KEEPER_EMAIL);
      console.log(`[keeper] Timeout triggered for ${row.id} — tx: ${txHash}`);
      notifyAgreementUpdate(row.id, "KEEPER_TIMEOUT_TRIGGERED").catch(console.error);

      await db.query(
        `INSERT INTO audit_events (id, agreement_id, event_type, actor, onchain_tx_hash, metadata, created_at)
         VALUES (gen_random_uuid(), $1, 'KEEPER_TIMEOUT_TRIGGERED', 'keeper', $2, $3, now())`,
        [row.id, txHash, JSON.stringify({ elapsed_seconds: Math.floor(elapsed), confirmation_window: row.confirmation_window })]
      );
    } catch (err) {
      console.error(`[keeper] Failed timeout for ${row.id}:`, err);

      await db.query(
        `INSERT INTO audit_events (id, agreement_id, event_type, actor, metadata, created_at)
         VALUES (gen_random_uuid(), $1, 'KEEPER_TIMEOUT_FAILED', 'keeper', $2, now())`,
        [row.id, JSON.stringify({ error: String(err) })]
      );
    }
  }
}

let intervalHandle: ReturnType<typeof setInterval> | null = null;

export function startKeeper(): void {
  if (intervalHandle) return;
  console.log(`[keeper] Starting — polling every ${KEEPER_INTERVAL_MS / 1000}s`);
  runKeeperCycle().catch((err) => console.error("[keeper] Initial cycle error:", err));
  intervalHandle = setInterval(() => {
    runKeeperCycle().catch((err) => console.error("[keeper] Cycle error:", err));
  }, KEEPER_INTERVAL_MS);
}

export function stopKeeper(): void {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
    console.log("[keeper] Stopped");
  }
}
