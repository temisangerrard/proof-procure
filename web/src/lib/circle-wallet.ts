import { nanoid } from "nanoid";
import {
  initiateDeveloperControlledWalletsClient,
  type AccountType,
  type Blockchain,
  type WalletsDataWalletsInner,
} from "@circle-fin/developer-controlled-wallets";
import { env } from "./env";

export interface EmbeddedWalletRecord {
  provider: "circle";
  providerUserId?: string;
  providerWalletId?: string;
  address?: string;
  chain: string;
  status: "pending" | "ready" | "blocked";
}

function hasManagedCircleConfig() {
  return Boolean(
    env.CIRCLE_API_KEY && env.CIRCLE_ENTITY_SECRET && env.CIRCLE_WALLET_SET_ID,
  );
}

function pendingPaymentAccount(): EmbeddedWalletRecord {
  return {
    provider: "circle",
    providerUserId: `managed_pending_${nanoid(8)}`,
    providerWalletId: `managed_pending_${nanoid(8)}`,
    chain: env.CIRCLE_BLOCKCHAIN.toLowerCase(),
    status: "pending",
  };
}

export async function getOrCreateEmbeddedWallet(input?: {
  userId?: string;
  email?: string;
}): Promise<EmbeddedWalletRecord> {
  if (env.WALLET_PROVIDER !== "circle") {
    throw new Error("Unsupported wallet provider");
  }

  if (!hasManagedCircleConfig()) {
    return pendingPaymentAccount();
  }

  const client = initiateDeveloperControlledWalletsClient({
    apiKey: env.CIRCLE_API_KEY,
    entitySecret: env.CIRCLE_ENTITY_SECRET,
  });

  const response = await client.createWallets({
    walletSetId: env.CIRCLE_WALLET_SET_ID,
    blockchains: [env.CIRCLE_BLOCKCHAIN as Blockchain],
    count: 1,
    accountType: env.CIRCLE_ACCOUNT_TYPE as AccountType,
    metadata: [
      {
        name: input?.email ? `Proof Procure ${input.email}` : "Proof Procure",
        refId: input?.userId || input?.email || nanoid(),
      },
    ],
  });

  const wallet = response.data?.wallets?.[0] as
    | WalletsDataWalletsInner
    | undefined;
  if (!wallet?.id || !wallet.address) {
    throw new Error("Circle did not return a managed payment account");
  }

  return {
    provider: "circle",
    providerUserId: input?.userId,
    providerWalletId: wallet.id,
    address: wallet.address,
    chain: wallet.blockchain.toLowerCase(),
    status: "ready",
  };
}
