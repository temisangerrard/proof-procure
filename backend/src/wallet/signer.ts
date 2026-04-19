import { ethers } from "ethers";
import { deriveWallet } from "./derive";
import { estimateAndFundGas } from "./sponsor";
import { getProvider } from "../contracts/index";

/**
 * Construct, gas-sponsor, sign, and send a transaction on behalf of a user.
 * User is identified by email — wallet derived server-side.
 */
export async function signAndSend(
  email: string,
  txRequest: ethers.TransactionRequest
): Promise<ethers.TransactionReceipt> {
  const provider = getProvider();
  const wallet = deriveWallet(email).connect(provider);

  const populated = await wallet.populateTransaction(txRequest);
  await estimateAndFundGas(wallet.address, populated);

  const tx = await wallet.sendTransaction(populated);
  const receipt = await tx.wait();
  if (!receipt) throw new Error("Transaction failed — no receipt");
  return receipt;
}
