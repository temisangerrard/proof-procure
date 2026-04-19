"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Message {
  role: "user" | "assistant";
  content: string;
  action?: ActionProposal;
}

interface ActionProposal {
  type: string;
  params: Record<string, unknown>;
  label: string;
  status?: "pending" | "executed" | "rejected";
}

export default function OpsChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/ops-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMsg].map((m) => ({ role: m.role, content: m.content })) }),
      });
      const data = ((await res.json()) as any);

      const d = data as any;
      const assistantMsg: Message = {
        role: "assistant",
        content: d.content || "",
        action: d.action || undefined,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Something went wrong. Try again." }]);
    } finally {
      setLoading(false);
    }
  };

  const executeAction = async (msgIndex: number, confirm: boolean) => {
    const msg = messages[msgIndex];
    if (!msg.action) return;

    if (!confirm) {
      setMessages((prev) =>
        prev.map((m, i) => (i === msgIndex ? { ...m, action: { ...m.action!, status: "rejected" } } : m))
      );
      return;
    }

    try {
      const res = await fetch("/api/admin/ops-chat/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(msg.action),
      });
      const data = ((await res.json()) as any);
      setMessages((prev) =>
        prev.map((m, i) =>
          i === msgIndex ? { ...m, action: { ...m.action!, status: "executed" }, content: m.content + `\n\n✓ ${(data as any).message || "Done."}` } : m
        )
      );
    } catch {
      setMessages((prev) =>
        prev.map((m, i) => (i === msgIndex ? { ...m, action: { ...m.action!, status: "rejected" } } : m))
      );
    }
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <h1 className="text-xl font-semibold tracking-tight mb-4">Ops Chat</h1>

      {/* Messages */}
      <div className="flex-1 overflow-auto rounded-xl border border-gray-200 bg-white p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center text-sm text-gray-400">
            Ask about agreements, users, system status, or request actions.
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
                msg.role === "user" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"
              }`}
            >
              {msg.content}

              {/* Action confirmation card */}
              {msg.action && msg.action.status === undefined && (
                <div className="mt-3 rounded-lg border border-gray-200 bg-white p-3">
                  <p className="text-xs font-medium text-gray-700">Proposed action</p>
                  <p className="mt-1 text-sm font-medium">{msg.action.label}</p>
                  <p className="mt-0.5 text-xs text-gray-400 font-mono">
                    {msg.action.type}({JSON.stringify(msg.action.params)})
                  </p>
                  <div className="mt-2 flex gap-2">
                    <Button size="xs" onClick={() => executeAction(i, true)} className="gap-1">
                      <CheckCircle2 className="size-3" /> Confirm
                    </Button>
                    <Button size="xs" variant="ghost" onClick={() => executeAction(i, false)} className="gap-1">
                      <XCircle className="size-3" /> Reject
                    </Button>
                  </div>
                </div>
              )}
              {msg.action?.status === "executed" && (
                <div className="mt-2 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs text-emerald-700">
                  ✓ Action executed
                </div>
              )}
              {msg.action?.status === "rejected" && (
                <div className="mt-2 rounded-lg bg-gray-50 px-3 py-1.5 text-xs text-gray-500">
                  Action rejected
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-xl bg-gray-100 px-4 py-2.5">
              <Loader2 className="size-4 animate-spin text-gray-400" />
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="mt-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())}
          placeholder="Ask about system status, agreements, or request an action…"
          className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-gray-300 focus:ring-2 focus:ring-gray-900/5"
        />
        <Button onClick={send} disabled={loading || !input.trim()} className="gap-1.5">
          <Send className="size-4" />
        </Button>
      </div>
    </div>
  );
}
