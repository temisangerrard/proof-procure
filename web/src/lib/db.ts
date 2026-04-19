import { getRequestContext } from "@cloudflare/next-on-pages";

/**
 * D1 helper using native Cloudflare bindings.
 * No API token, no HTTP fetch — direct access via getRequestContext().
 */
interface D1Result<T = Record<string, unknown>> {
  results: T[];
  success: boolean;
  meta?: Record<string, unknown>;
}

function getDB(): D1Database {
  const ctx = getRequestContext();
  const db = ctx.env.DB as D1Database;
  if (!db) throw new Error("D1 binding not available — check wrangler.toml");
  return db;
}

export const d1 = {
  async query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<D1Result<T>> {
    const db = getDB();
    const stmt = db.prepare(sql);
    if (params && params.length > 0) {
      stmt.bind(...params);
    }
    return stmt.all<T>() as Promise<D1Result<T>>;
  },

  async run(sql: string, params?: unknown[]): Promise<D1Result> {
    const db = getDB();
    const stmt = db.prepare(sql);
    if (params && params.length > 0) {
      stmt.bind(...params);
    }
    return stmt.run() as Promise<D1Result>;
  },

  async batch(statements: { sql: string; params?: unknown[] }[]): Promise<D1Result[]> {
    const db = getDB();
    const stmts = statements.map((s) => {
      const stmt = db.prepare(s.sql);
      if (s.params && s.params.length > 0) {
        stmt.bind(...s.params);
      }
      return stmt;
    });
    return db.batch(stmts) as Promise<D1Result[]>;
  },
};
