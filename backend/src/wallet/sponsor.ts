import { ethers } from "ethers";
import { getProvider } from "../contracts/index";

/**
 * Gas sponsor wallet — funded with ETH on Base.
 * Sends just enough ETH to user wallets to cover gas costs.
 */
function getSponsorWallet(): ethers.Wallet {
  const key = process.env.GAS_SPONSOR_PRIVATE_KEY;
  if (!key) throw new Error("GAS_SPONSOR_PRIVATE_KEY not configured");
  return new ethers.Wallet(key, getProvider());
}

export async function estimateAndFundGas(
  userAddress: string,
  txData: ethers.TransactionRequest
): Promise<void> {
  const provider = getProvider();
  const sponsor = getSponsorWallet();

  const [gasEstimate, feeData, currentBalance] = await Promise.all([
    provider.estimateGas({ ...txData, from: userAddress }),
    provider.getFeeData(),
    provider.getBalance(userAddress),
  ]);

  const maxFeePerGas = feeData.maxFeePerGas ?? feeData.gasPrice ?? ethers.parseUnits("1", "gwei");
  const needed = gasEstimate * maxFeePerGas * 120n / 100n; // 20% buffer

  if (currentBalance >= needed) return;

  const deficit = needed - currentBalance;
  const tx = await sponsor.sendTransaction({ to: userAddress, value: deficit });
  await tx.wait();
}
