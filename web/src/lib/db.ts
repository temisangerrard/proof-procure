/**
 * D1 helper for Cloudflare Pages Functions.
 * Pages Functions receive env via context.data or process.env bindings.
 * We use the Cloudflare D1 HTTP API as fallback, or direct binding when available.
 */

const ACCOUNT_ID = "9e8d0ed101db78009b923aea3dac1024";
const DATABASE_ID = "a6e45af5-39b1-45ed-bd4b-23752f35ef85";

function getToken(): string {
  return process.env.CLOUDFLARE_D1_API_TOKEN || "";
}

async function d1Fetch(sql: string, params: unknown[] = []) {
  const token = getToken();
  if (!token) throw new Error("CLOUDFLARE_D1_API_TOKEN not set");

  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/d1/database/${DATABASE_ID}/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sql, params }),
    }
  );

  const data: any = await res.json();
  if (!data.success) {
    throw new Error(data.errors?.[0]?.message || "D1 query failed");
  }
  return data.result?.[0] || { results: [] };
}

export const d1 = {
  async run(sql: string, params: unknown[] = []): Promise<any> {
    return d1Fetch(sql, params);
  },

  async query<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<{ results: T[] }> {
    return d1Fetch(sql, params);
  },

  async first<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T | null> {
    const result = await d1Fetch(sql, params);
    return result.results?.[0] || null;
  },

  async all<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<{ results: T[] }> {
    return d1Fetch(sql, params);
  },

  async batch(statements: { sql: string; params?: unknown[] }[]): Promise<any[]> {
    // D1 HTTP API doesn't support batch — run sequentially
    return Promise.all(statements.map((s) => d1Fetch(s.sql, s.params || [])));
  },
};
