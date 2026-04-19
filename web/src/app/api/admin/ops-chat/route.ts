import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { d1 } from "@/lib/db";
import { env } from "@/lib/env";

const TOOLS = [
  {
    name: "update_agreement_status",
    description: "Update the status of an agreement",
    input_schema: {
      type: "object" as const,
      properties: {
        agreement_id: { type: "string", description: "The agreement ID" },
        status: { type: "string", enum: ["draft", "ratified", "funded", "delivered", "confirmed", "payment_released", "rejected", "expired"] },
      },
      required: ["agreement_id", "status"],
    },
  },
  {
    name: "toggle_admin",
    description: "Toggle admin role for a user",
    input_schema: {
      type: "object" as const,
      properties: {
        user_id: { type: "string" },
        role: { type: "string", enum: ["admin", "user"] },
      },
      required: ["user_id", "role"],
    },
  },
  {
    name: "view_agreement_details",
    description: "View full details of a specific agreement",
    input_schema: {
      type: "object" as const,
      properties: { agreement_id: { type: "string" } },
      required: ["agreement_id"],
    },
  },
];

async function buildContext() {
  const [counts, recent, users, events] = await d1.batch([
    { sql: "SELECT status, COUNT(*) as count FROM agreements GROUP BY status" },
    { sql: "SELECT id, item, status, total, supplier_email, created_at FROM agreements ORDER BY created_at DESC LIMIT 10" },
    { sql: "SELECT id, email, role, created_at FROM users ORDER BY created_at DESC LIMIT 10" },
    { sql: "SELECT * FROM audit_events ORDER BY created_at DESC LIMIT 10" },
  ]);

  return `TELEMETRY CONTEXT BUNDLE (live from D1):
Agreement counts: ${JSON.stringify(counts.results)}
Recent agreements: ${JSON.stringify(recent.results)}
Recent users: ${JSON.stringify(users.results)}
Recent audit events: ${JSON.stringify(events.results)}`;
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { messages } = await req.json();
  const context = await buildContext();

  const systemPrompt = `You are the ProofProcure ops assistant. You help admins monitor and manage the procurement agreement system.

${context}

You can propose actions using the available tools. When proposing an action, explain what you're about to do and why.
Keep responses concise and operational. No marketing language. Reference specific agreement IDs and user emails when relevant.`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: systemPrompt,
      tools: TOOLS,
      messages,
    }),
  });

  const data = await res.json();

  // Check for tool use
  const toolUse = data.content?.find((b: { type: string }) => b.type === "tool_use");
  if (toolUse) {
    const textBlock = data.content?.find((b: { type: string }) => b.type === "text");
    return NextResponse.json({
      content: textBlock?.text || "",
      action: {
        type: toolUse.name,
        params: toolUse.input,
        label: `${toolUse.name}(${JSON.stringify(toolUse.input)})`,
      },
    });
  }

  const text = data.content?.map((b: { type: string; text?: string }) => b.text || "").join("") || "No response.";
  return NextResponse.json({ content: text });
}
