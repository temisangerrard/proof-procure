import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { d1 } from "@/lib/db";
import { env } from "@/lib/env";

const TOOLS: OpenAITool[] = [
  {
    type: "function",
    function: {
      name: "update_agreement_status",
      description: "Update the status of an agreement",
      parameters: {
        type: "object",
        properties: {
          agreement_id: { type: "string", description: "The agreement ID" },
          status: { type: "string", enum: ["draft", "ratified", "funded", "delivered", "confirmed", "payment_released", "rejected", "expired"] },
        },
        required: ["agreement_id", "status"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "toggle_admin",
      description: "Toggle admin role for a user",
      parameters: {
        type: "object",
        properties: {
          user_id: { type: "string" },
          role: { type: "string", enum: ["admin", "user"] },
        },
        required: ["user_id", "role"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "view_agreement_details",
      description: "View full details of a specific agreement",
      parameters: {
        type: "object",
        properties: { agreement_id: { type: "string" } },
        required: ["agreement_id"],
      },
    },
  },
];

interface OpenAITool {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

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

  const { messages } = ((await req.json()) as any);
  const context = await buildContext();

  const systemPrompt = `You are the ProofProcure ops assistant. You help admins monitor and manage the procurement agreement system.

${context}

You can propose actions using the available tools. When proposing an action, explain what you're about to do and why.
Keep responses concise and operational. No marketing language. Reference specific agreement IDs and user emails when relevant.`;

  // Convert messages to OpenAI format (they come as Anthropic-style from frontend)
  const openaiMessages: Array<{ role: string; content: string }> = [
    { role: "system", content: systemPrompt },
    ...messages.map((m: { role: string; content: string }) => ({
      role: m.role === "human" ? "user" : m.role,
      content: typeof m.content === "string" ? m.content : JSON.stringify(m.content),
    })),
  ];

  const res = await fetch("https://api.z.ai/api/paas/v4/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.GLM_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "glm-4-plus",
      messages: openaiMessages,
      tools: TOOLS,
      max_tokens: 1024,
    }),
  });

  const data = ((((await res.json()) as any)) as any);
  const choice = data.choices?.[0];

  if (!choice) {
    return NextResponse.json({ content: "No response from AI." });
  }

  // Check for tool calls
  const toolCall = choice.message?.tool_calls?.[0];
  if (toolCall) {
    const textContent = choice.message?.content || "";
    return NextResponse.json({
      content: textContent,
      action: {
        type: toolCall.function.name,
        params: JSON.parse(toolCall.function.arguments),
        label: `${toolCall.function.name}(${toolCall.function.arguments})`,
      },
    });
  }

  const text = choice.message?.content || "No response.";
  return NextResponse.json({ content: text });
}
