import { ethers } from "ethers";
import { env } from "./env";

export function deriveWalletFromEmail(email: string): { address: string } {
  const seed = env.DEPLOYER_PRIVATE_KEY;
  const mnemonic = ethers.Mnemonic.entropyToPhrase(ethers.id(seed).slice(0, 34));
  const path = `m/44'/60'/0'/0/${emailToIndex(email)}`;
  const wallet = ethers.HDNodeWallet.fromPhrase(mnemonic, undefined, path);
  return { address: wallet.address };
}

function emailToIndex(email: string): number {
  const hash = ethers.id(email.toLowerCase());
  return parseInt(hash.slice(2, 10), 16) % 2147483647;
}
