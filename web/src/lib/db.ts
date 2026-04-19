import { env } from "./env";

interface D1Result {
  results: Record<string, unknown>[];
  success: boolean;
  meta?: Record<string, unknown>;
}

interface D1Response {
  result: D1Result[];
  success: boolean;
  errors: { message: string }[];
}

async function execute(sql: string, params?: unknown[]): Promise<D1Result> {
  const url = `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/d1/database/${env.DATABASE_ID}/query`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.CLOUDFLARE_D1_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sql, params: params || [] }),
  });
  const data: D1Response = await res.json();
  if (!data.success) throw new Error(data.errors?.[0]?.message || "D1 query failed");
  return data.result[0];
}

export const d1 = {
  query: (sql: string, params?: unknown[]) => execute(sql, params),
  run: (sql: string, params?: unknown[]) => execute(sql, params),
  async batch(statements: { sql: string; params?: unknown[] }[]) {
    const results: D1Result[] = [];
    for (const s of statements) {
      results.push(await execute(s.sql, s.params));
    }
    return results;
  },
};
