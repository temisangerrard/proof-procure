import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { nanoid } from "nanoid";
import { d1 } from "./db";

const ADMIN_EMAILS = ["mirasettley@gmail.com", "tagbajoh@gmail.com"];
export const SESSION_COOKIE = "proof_procure_session";

export interface SessionUser {
  id: string;
  email: string;
  role: string;
}

export function isAdminEmail(email: string): boolean {
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

export async function ensureUser(email: string): Promise<SessionUser> {
  const lower = email.toLowerCase();
  const existing = await d1.query(
    "SELECT id, role FROM users WHERE email = ?",
    [lower],
  );

  if (existing.results.length > 0) {
    return {
      id: existing.results[0].id as string,
      email: lower,
      role: existing.results[0].role as string,
    };
  }

  const id = nanoid();
  const role = isAdminEmail(lower) ? "admin" : "user";
  await d1.run("INSERT INTO users (id, email, role) VALUES (?, ?, ?)", [
    id,
    lower,
    role,
  ]);
  return { id, email: lower, role };
}

export async function createAuthSession(userId: string) {
  const sessionId = nanoid(40);
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await d1.run(
    "INSERT INTO auth_sessions (id, user_id, expires_at) VALUES (?, ?, ?)",
    [sessionId, userId, expires.toISOString()],
  );

  return { sessionId, expires };
}

export async function setAuthSessionCookie(userId: string) {
  const { sessionId, expires } = await createAuthSession(userId);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires,
  });
}

export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const h = await headers();
    const accessEmail = h.get("cf-access-authenticated-user-email");
    if (accessEmail) return ensureUser(accessEmail);

    const cookieStore = await cookies();
    const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
    if (!sessionId) return null;

    const row = await d1.first<{ id: string; email: string; role: string }>(
      `SELECT users.id, users.email, users.role
       FROM auth_sessions
       JOIN users ON users.id = auth_sessions.user_id
       WHERE auth_sessions.id = ? AND auth_sessions.expires_at > datetime('now')
       LIMIT 1`,
      [sessionId],
    );

    return row ?? null;
  } catch {
    return null;
  }
}

export async function requireAuth(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireAuth();
  if (user.role !== "admin") redirect("/app");
  return user;
}
