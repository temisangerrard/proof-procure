import { getCloudflareContext } from "@opennextjs/cloudflare";

async function getDB(): Promise<D1Database> {
  const { env } = await getCloudflareContext({ async: true });
  const db = (env as any).DB as D1Database | undefined;
  if (!db) throw new Error("D1 binding 'DB' not found in Cloudflare env");
  return db;
}

export const d1 = {
  async run(sql: string, params: unknown[] = []): Promise<any> {
    const db = await getDB();
    return db.prepare(sql).bind(...params).run();
  },

  async query<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<{ results: T[] }> {
    const db = await getDB();
    return db.prepare(sql).bind(...params).all<T>();
  },

  async first<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T | null> {
    const db = await getDB();
    return db.prepare(sql).bind(...params).first<T>();
  },

  async all<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<{ results: T[] }> {
    const db = await getDB();
    return db.prepare(sql).bind(...params).all<T>();
  },

  async batch(statements: { sql: string; params?: unknown[] }[]): Promise<any[]> {
    const db = await getDB();
    return db.batch(statements.map((s) => db.prepare(s.sql).bind(...(s.params || []))));
  },
};
