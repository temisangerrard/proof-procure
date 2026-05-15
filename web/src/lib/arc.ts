import { nanoid } from "nanoid";
import { env } from "./env";

export async function getArcChainId() {
  try {
    const response = await fetch(env.ARC_RPC_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "eth_chainId",
        params: [],
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      return { ok: false, chainId: null, error: `RPC returned ${response.status}` };
    }

    const data = await response.json() as { result?: string; error?: { message?: string } };
    if (!data.result) return { ok: false, chainId: null, error: data.error?.message || "No chain id" };
    return { ok: true, chainId: data.result, error: null };
  } catch (error) {
    return {
      ok: false,
      chainId: null,
      error: error instanceof Error ? error.message : "Arc RPC unavailable",
    };
  }
}

export async function createArcPaymentReference() {
  const chain = await getArcChainId();
  const txHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`;

  return {
    chainId: chain.chainId,
    chainOk: chain.ok,
    txHash,
    reference: `ARC-${nanoid(10).toUpperCase()}`,
  };
}
