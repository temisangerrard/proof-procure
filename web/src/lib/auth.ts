import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { d1 } from "./db";
import { nanoid } from "nanoid";

const ADMIN_EMAILS = ["mirasettley@gmail.com", "tagbajoh@gmail.com"];

export interface SessionUser {
  id: string;
  email: string;
  role: string;
}

export function isAdminEmail(email: string): boolean {
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const h = await headers();
  const email = h.get("cf-access-authenticated-user-email");
  if (!email) return null;

  const lower = email.toLowerCase();
  const existing = await d1.query("SELECT id, role FROM users WHERE email = ?", [lower]);

  if (existing.results.length > 0) {
    return {
      id: existing.results[0].id as string,
      email: lower,
      role: existing.results[0].role as string,
    };
  }

  const id = nanoid();
  const role = isAdminEmail(lower) ? "admin" : "user";
  await d1.run("INSERT INTO users (id, email, role) VALUES (?, ?, ?)", [id, lower, role]);
  return { id, email: lower, role };
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
