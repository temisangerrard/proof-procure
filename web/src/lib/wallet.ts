import { ethers } from "ethers";
import { env } from "./env";

export function deriveWallet(email: string): ethers.HDNodeWallet {
  const seed = env.WALLET_SEED;
  if (!seed) throw new Error("WALLET_SEED env var is not set");
  const entropy = ethers.id(`${seed}:${email}`);
  const mnemonic = ethers.Mnemonic.fromEntropy(entropy);
  return ethers.HDNodeWallet.fromMnemonic(mnemonic, "m/44'/60'/0'/0/0");
}

export function deriveAddress(email: string): string {
  return deriveWallet(email).address;
}

export async function signAndSend(
  email: string,
  provider: ethers.Provider,
  txRequest: ethers.TransactionRequest,
): Promise<ethers.TransactionReceipt> {
  const sponsorKey = env.GAS_SPONSOR_PRIVATE_KEY;
  if (!sponsorKey)
    throw new Error("GAS_SPONSOR_PRIVATE_KEY env var is not set");

  const wallet = deriveWallet(email).connect(provider);

  // Estimate gas cost
  const feeData = await provider.getFeeData();
  const gasLimit = await provider.estimateGas({
    ...txRequest,
    from: wallet.address,
  });
  const gasPrice = feeData.maxFeePerGas ?? feeData.gasPrice ?? BigInt(0);
  const estimatedCost = gasLimit * gasPrice;

  // Check wallet ETH balance
  const balance = await provider.getBalance(wallet.address);

  if (balance < estimatedCost) {
    // Fund from gas sponsor
    const sponsor = new ethers.Wallet(sponsorKey, provider);
    const fundTx = await sponsor.sendTransaction({
      to: wallet.address,
      value: estimatedCost * BigInt(2),
    });
    await fundTx.wait();
  }

  const tx = await wallet.sendTransaction(txRequest);
  const receipt = await tx.wait();
  if (!receipt) throw new Error("Transaction receipt is null");
  return receipt;
}
