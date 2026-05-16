import { ethers } from "ethers";

export interface Env {
  DB: D1Database;
  ARC_RPC_URL: string;
  KEEPER_PRIVATE_KEY: string;
}

const AGREEMENT_ABI = [
  {
    type: "function",
    name: "timeoutReached",
    inputs: [],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "checkTimeout",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
];

interface AgreementRow {
  id: string;
  contract_address: string;
}

export default {
  async scheduled(
    _event: ScheduledEvent,
    env: Env,
    _ctx: ExecutionContext,
  ): Promise<void> {
    const provider = new ethers.JsonRpcProvider(env.ARC_RPC_URL);
    const keeper = new ethers.Wallet(env.KEEPER_PRIVATE_KEY, provider);

    // Query delivered agreements with a contract address
    const { results } = await env.DB.prepare(
      "SELECT id, contract_address FROM agreements WHERE status = 'delivered' AND contract_address IS NOT NULL",
    ).all<AgreementRow>();

    console.log(`Keeper: checking ${results.length} delivered agreements`);

    for (const row of results) {
      const { id, contract_address } = row;

      try {
        // Check if timeout is reached via view call
        const agreement = new ethers.Contract(
          contract_address,
          AGREEMENT_ABI,
          provider,
        );

        const reached = (await agreement.timeoutReached()) as boolean;
        if (!reached) {
          console.log(`Agreement ${id}: timeout not reached, skipping`);
          continue;
        }

        console.log(`Agreement ${id}: timeout reached, calling checkTimeout`);

        // Call checkTimeout with keeper wallet
        const iface = new ethers.Interface(AGREEMENT_ABI);
        const data = iface.encodeFunctionData("checkTimeout", []);
        const tx = await keeper.sendTransaction({
          to: contract_address,
          data,
        });
        const receipt = await tx.wait();
        if (!receipt) throw new Error("No receipt");

        // Update D1
        await env.DB.prepare(
          "UPDATE agreements SET status = 'timed_out', updated_at = datetime('now') WHERE id = ?",
        )
          .bind(id)
          .run();

        await env.DB.prepare(
          "INSERT INTO audit_events (agreement_id, event_type, actor_email, detail, tx_hash) VALUES (?, 'timed_out', 'keeper', 'Keeper triggered checkTimeout', ?)",
        )
          .bind(id, receipt.hash)
          .run();

        console.log(`Agreement ${id}: timed_out, tx ${receipt.hash}`);
      } catch (err) {
        console.error(`Agreement ${id}: keeper error:`, err);
      }
    }
  },
};
