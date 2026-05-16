import { initiateUserControlledWalletsClient } from "@circle-fin/user-controlled-wallets";
import { env } from "./env";

const ARC_TESTNET = "ARC-TESTNET";

function circleClient() {
  if (!env.CIRCLE_API_KEY) {
    throw new Error("Circle API key is not set");
  }

  return initiateUserControlledWalletsClient({
    apiKey: env.CIRCLE_API_KEY,
  });
}

export function getCircleBrowserConfig() {
  return {
    appId: env.NEXT_PUBLIC_CIRCLE_APP_ID,
    configured: Boolean(env.CIRCLE_API_KEY && env.NEXT_PUBLIC_CIRCLE_APP_ID),
    blockchain: ARC_TESTNET,
  };
}

export async function requestCircleEmailOtp(input: {
  deviceId: string;
  email: string;
}) {
  const response = await circleClient().createDeviceTokenForEmailLogin({
    deviceId: input.deviceId,
    email: input.email,
  });

  return response.data;
}

export async function createCircleWalletChallenge(userToken: string) {
  const response = await circleClient().createUserPinWithWallets({
    userToken,
    blockchains: [ARC_TESTNET],
    accountType: "SCA",
  });

  return response.data;
}

export async function listCircleWallets(userToken: string) {
  const response = await circleClient().listWallets({ userToken });
  return response.data?.wallets || [];
}

export async function getCircleWalletBalances(input: {
  userToken: string;
  walletId: string;
}) {
  const response = await circleClient().getWalletTokenBalance({
    userToken: input.userToken,
    walletId: input.walletId,
  });

  return response.data?.tokenBalances || [];
}

export async function createCircleTransferChallenge(input: {
  userToken: string;
  walletId: string;
  destinationAddress: string;
  amount: string;
  tokenAddress?: string;
  billId?: string;
}) {
  const response = await circleClient().createTransaction({
    userToken: input.userToken,
    walletId: input.walletId,
    destinationAddress: input.destinationAddress,
    amounts: [input.amount],
    tokenAddress: input.tokenAddress || "",
    blockchain: ARC_TESTNET,
    fee: { type: "level", config: { feeLevel: "MEDIUM" } },
    refId: input.billId ? `proof-procure:${input.billId}` : "proof-procure",
  });

  return response.data;
}
