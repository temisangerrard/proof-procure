// Server-only: fetches live USDC yield rates from Morpho and Aave on Base.
// No DeFi terminology exposed to callers — rates are plain decimal APY values.

const MORPHO_API = "https://blue-api.morpho.org/graphql";
const BASE_RPC = "https://mainnet.base.org";
const AAVE_POOL_BASE = "0xA238Dd80C259a72e81d7e4664a9801593F98d1c5";
const USDC_BASE = "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913";
const SECONDS_PER_YEAR = 31_536_000;

export interface YieldRate {
  source: "morpho" | "aave";
  vaultName?: string;
  vaultAddress?: string;
  netApy: number;
  tvlUsd?: number;
}

export interface YieldRates {
  bestApy: number | null;
  rates: YieldRate[];
  fetchedAt: number;
}

async function fetchMorphoRates(): Promise<YieldRate[]> {
  const query = `{
    vaults(
      where: { chainId_in: [8453], assetSymbol_in: ["USDC"], listed: true }
      first: 5
      orderBy: NetApy
      orderDirection: Desc
    ) {
      items {
        name
        address
        state { netApy totalAssetsUsd }
      }
    }
  }`;

  const res = await fetch(MORPHO_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
    next: { revalidate: 300 },
  });

  if (!res.ok) throw new Error(`Morpho API ${res.status}`);

  const data = (await res.json()) as {
    data: {
      vaults: {
        items: Array<{
          name: string;
          address: string;
          state: { netApy: number; totalAssetsUsd: number };
        }>;
      };
    };
  };

  return data.data.vaults.items
    .filter((v) => v.state.netApy > 0 && v.state.netApy < 10)
    .map((v) => ({
      source: "morpho" as const,
      vaultName: v.name,
      vaultAddress: v.address,
      netApy: v.state.netApy,
      tvlUsd: v.state.totalAssetsUsd,
    }));
}

async function fetchAaveRate(): Promise<YieldRate | null> {
  const paddedUsdc = USDC_BASE.replace("0x", "").padStart(64, "0");
  const calldata = `0x35ea6a75${paddedUsdc}`;

  const res = await fetch(BASE_RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "eth_call",
      params: [{ to: AAVE_POOL_BASE, data: calldata }, "latest"],
    }),
    next: { revalidate: 300 },
  });

  if (!res.ok) return null;

  const json = (await res.json()) as { result?: string };
  const hex = json.result?.replace("0x", "");
  if (!hex || hex.length < 192) return null;

  // currentLiquidityRate is at slot index 2 (chars 128–191 in the hex)
  const liquidityRateHex = hex.slice(128, 192);
  const liquidityRate = BigInt(`0x${liquidityRateHex}`);
  const RAY = BigInt("1000000000000000000000000000");

  if (liquidityRate === 0n) return null;

  const ratePerSecond = Number(liquidityRate) / Number(RAY) / SECONDS_PER_YEAR;
  const apy = Math.pow(1 + ratePerSecond, SECONDS_PER_YEAR) - 1;

  if (apy <= 0 || apy > 5) return null;

  return { source: "aave", netApy: apy };
}

export async function fetchYieldRates(): Promise<YieldRates> {
  const [morpho, aave] = await Promise.allSettled([
    fetchMorphoRates(),
    fetchAaveRate(),
  ]);

  const rates: YieldRate[] = [];

  if (morpho.status === "fulfilled") rates.push(...morpho.value);
  if (aave.status === "fulfilled" && aave.value) rates.push(aave.value);

  const validApys = rates.map((r) => r.netApy).filter((n) => n > 0);
  const bestApy = validApys.length > 0 ? Math.max(...validApys) : null;

  return { bestApy, rates, fetchedAt: Date.now() };
}
