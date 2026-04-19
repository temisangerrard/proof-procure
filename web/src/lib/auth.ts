import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { env } from "./env";
import crypto from "crypto";

const COOKIE_NAME = "pp_session";
const ADMIN_EMAIL = "mirasettley@gmail.com";

interface SessionUser {
  id: string;
  email: string;
  role: string;
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", env.SESSION_SECRET).update(payload).digest("hex");
}

export function createSessionCookie(user: { id: string; email: string; role: string }) {
  const payload = JSON.stringify({ id: user.id, email: user.email, role: user.role });
  const sig = sign(payload);
  return `${Buffer.from(payload).toString("base64")}.${sig}`;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const raw = jar.get(COOKIE_NAME)?.value;
  if (!raw) return null;
  const [b64, sig] = raw.split(".");
  if (!b64 || !sig) return null;
  try {
    const payload = Buffer.from(b64, "base64").toString("utf-8");
    if (sign(payload) !== sig) return null;
    return JSON.parse(payload) as SessionUser;
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

export function isAdminEmail(email: string): boolean {
  return email.toLowerCase() === ADMIN_EMAIL;
}

export { COOKIE_NAME };
