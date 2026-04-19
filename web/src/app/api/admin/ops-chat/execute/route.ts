import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { d1 } from "@/lib/db";

const HANDLERS: Record<string, (params: Record<string, unknown>, actorId: string, actorEmail: string) => Promise<string>> = {
  async update_agreement_status(params, actorId, actorEmail) {
    const { agreement_id, status } = params as { agreement_id: string; status: string };
    await d1.run("UPDATE agreements SET status = ?, updated_at = datetime('now') WHERE id = ?", [status, agreement_id]);
    await d1.run(
      "INSERT INTO audit_events (agreement_id, event_type, actor_id, actor_email, detail) VALUES (?, ?, ?, ?, ?)",
      [agreement_id, `admin_status_${status}`, actorId, actorEmail, `Admin changed status to ${status}`]
    );
    return `Agreement ${agreement_id} status updated to ${status}`;
  },

  async toggle_admin(params) {
    const { user_id, role } = params as { user_id: string; role: string };
    await d1.run("UPDATE users SET role = ?, updated_at = datetime('now') WHERE id = ?", [role, user_id]);
    return `User ${user_id} role set to ${role}`;
  },

  async view_agreement_details(params) {
    const { agreement_id } = params as { agreement_id: string };
    const result = await d1.query("SELECT * FROM agreements WHERE id = ?", [agreement_id]);
    if (!result.results.length) return "Agreement not found";
    return JSON.stringify(result.results[0], null, 2);
  },
};

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { type, params } = ((await req.json()) as any);
  const handler = HANDLERS[type];
  if (!handler) return NextResponse.json({ error: "Unknown action" }, { status: 400 });

  const message = await handler(params, user.id, user.email);
  return NextResponse.json({ message });
}
