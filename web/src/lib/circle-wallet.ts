import { nanoid } from "nanoid";
import { env } from "./env";

export interface EmbeddedWalletRecord {
  provider: "circle";
  providerUserId?: string;
  providerWalletId?: string;
  address?: string;
  chain: string;
  status: "pending" | "ready" | "blocked";
}

export async function getOrCreateEmbeddedWallet(): Promise<EmbeddedWalletRecord> {
  if (env.WALLET_PROVIDER !== "circle") {
    throw new Error("Unsupported wallet provider");
  }

  // Signup should never fail because wallet activation is still waiting on the
  // Circle user-controlled challenge. The Settings flow replaces this pending
  // record with the real Circle wallet ID and address once the user approves.
  return {
    provider: "circle",
    providerUserId: `circle_pending_${nanoid(8)}`,
    providerWalletId: `circle_pending_${nanoid(8)}`,
    chain: env.CIRCLE_BLOCKCHAIN.toLowerCase(),
    status: "pending",
  };
}
