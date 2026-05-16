import { nanoid } from "nanoid";
import { env } from "./env";

export interface EmbeddedWalletRecord {
  provider: "circle" | "coinbase";
  providerUserId?: string;
  providerWalletId?: string;
  address?: string;
  chain: string;
  status: "pending" | "ready" | "blocked";
}

export async function getOrCreateEmbeddedWallet(
  email: string,
): Promise<EmbeddedWalletRecord> {
  if (env.WALLET_PROVIDER === "coinbase" || env.COINBASE_CDP_PROJECT_ID) {
    return {
      provider: "coinbase",
      providerUserId: email.toLowerCase(),
      providerWalletId: `coinbase:${email.toLowerCase()}`,
      chain: "base",
      status: "pending",
    };
  }

  if (!env.CIRCLE_API_KEY || !env.CIRCLE_WALLET_SET_ID) {
    throw new Error("Circle wallet provider is not configured");
  }

  // Circle user-controlled wallet creation is intentionally isolated here.
  // Once wallet-set credentials are present, replace this guarded branch with
  // the exact Circle Web SDK/API calls without changing app routes.
  return {
    provider: "circle",
    providerUserId: `circle_pending_${nanoid(8)}`,
    providerWalletId: `circle_pending_${nanoid(8)}`,
    chain: env.CIRCLE_BLOCKCHAIN.toLowerCase(),
    status: "pending",
  };
}
