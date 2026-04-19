import { ethers } from "ethers";

/**
 * Derive a deterministic wallet from platform SEED + user email.
 * Same email always produces the same wallet address.
 * Private keys exist only in server memory during signing.
 */
export function deriveWallet(email: string): ethers.HDNodeWallet {
  const seed = process.env.WALLET_SEED;
  if (!seed) throw new Error("WALLET_SEED not configured");

  const entropy = ethers.id(`${seed}:${email}`);
  const mnemonic = ethers.Mnemonic.fromEntropy(entropy);
  return ethers.HDNodeWallet.fromMnemonic(mnemonic, "m/44'/60'/0'/0/0");
}

export function deriveAddress(email: string): string {
  return deriveWallet(email).address;
}
