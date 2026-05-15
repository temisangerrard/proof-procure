import { nanoid } from "nanoid";
import { deriveWalletFromEmail } from "./wallet";
import { env } from "./env";

export interface EmbeddedWalletRecord {
  provider: "circle" | "demo";
  providerUserId?: string;
  providerWalletId?: string;
  address: string;
  chain: string;
  status: "pending" | "ready" | "blocked";
}

export async function getOrCreateEmbeddedWallet(email: string): Promise<EmbeddedWalletRecord> {
  if (!env.CIRCLE_API_KEY || !env.CIRCLE_WALLET_SET_ID) {
    const { address } = deriveWalletFromEmail(email);
    return {
      provider: "demo",
      providerUserId: `demo_user_${nanoid(8)}`,
      providerWalletId: `demo_wallet_${nanoid(8)}`,
      address,
      chain: "arc-testnet",
      status: "ready",
    };
  }

  // Circle user-controlled wallet creation is intentionally isolated here.
  // Once wallet-set credentials are present, replace this guarded branch with
  // the exact Circle Web SDK/API calls without changing app routes.
  const { address } = deriveWalletFromEmail(email);
  return {
    provider: "circle",
    providerUserId: `circle_pending_${nanoid(8)}`,
    providerWalletId: `circle_pending_${nanoid(8)}`,
    address,
    chain: env.CIRCLE_BLOCKCHAIN.toLowerCase(),
    status: "pending",
  };
}
