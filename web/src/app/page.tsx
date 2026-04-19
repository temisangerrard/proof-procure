import Link from "next/link";
import {
  MessageSquareText,
  FileSearch,
  Handshake,
  ShieldCheck,
  ArrowRight,
  Mail,
  Send,
  FileText,
  CheckCircle2,
  Clock,
  Users,
  Globe,
  Zap,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <span className="text-lg font-semibold tracking-tight">ProofProcure</span>
          <Link href="/login">
            <Button size="sm">Sign in</Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pt-24 pb-20 md:pt-32 md:pb-28">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-semibold leading-tight tracking-tight md:text-5xl lg:text-6xl">
            Your procurement already starts in chat.
            <br />
            <span className="text-gray-400">Now it can finish there too.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-gray-500 leading-relaxed">
            ProofProcure turns the conversations you already have — on Telegram, email, WhatsApp — into structured agreements both parties confirm, fund, and execute. No new software to learn. No process to change.
          </p>
          <div className="mt-8 flex gap-3">
            <Link href="/login">
              <Button size="lg" className="gap-2">
                Get started <ArrowRight className="size-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="border-t border-gray-100 bg-gray-50/60">
        <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
          <p className="text-sm font-medium uppercase tracking-widest text-gray-400">The problem</p>
          <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight md:text-4xl">
            Procurement happens in conversations. Enforcement happens nowhere.
          </h2>
          <p className="mt-4 max-w-xl text-gray-500 leading-relaxed">
            Buyers and suppliers negotiate over Telegram, forward specs by email, confirm quantities in voice notes. Then someone copies it into a spreadsheet, maybe. The result: unstructured agreements, delayed reconciliation, payment disputes, and zero auditability.
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: MessageSquareText, title: "Scattered conversations", desc: "Terms live across WhatsApp, Telegram, email threads, and forwarded PDFs" },
              { icon: FileText, title: "No structured record", desc: "Agreements exist as informal promises with no single source of truth" },
              { icon: Clock, title: "Delayed reconciliation", desc: "Weeks pass between delivery and payment because nobody tracks the handoff" },
              { icon: ShieldCheck, title: "Zero enforcement", desc: "When disputes happen, there's no audit trail and no automatic resolution" },
            ].map((item) => (
              <div key={item.title} className="rounded-xl border border-gray-100 bg-white p-5">
                <item.icon className="size-5 text-gray-400" />
                <h3 className="mt-3 font-medium">{item.title}</h3>
                <p className="mt-1 text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-gray-100">
        <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
          <p className="text-sm font-medium uppercase tracking-widest text-gray-400">How it works</p>
          <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight md:text-4xl">
            From conversation to confirmed agreement in minutes
          </h2>
          <div className="mt-14 grid gap-8 md:grid-cols-5">
            {[
              { step: "01", icon: Send, title: "Forward the conversation", desc: "Paste a chat, forward an email thread, or upload a document. Use the channels you already work in." },
              { step: "02", icon: FileSearch, title: "Terms are extracted", desc: "ProofProcure reads the conversation and pulls out item, quantity, price, delivery window, and payment terms." },
              { step: "03", icon: Handshake, title: "Both parties confirm", desc: "Buyer and supplier each review and ratify the structured agreement. No ambiguity, no back-and-forth." },
              { step: "04", icon: ShieldCheck, title: "Payment is controlled", desc: "Funds are held and released automatically based on the rules both parties agreed to. No manual chasing." },
              { step: "05", icon: Mail, title: "Updates flow back", desc: "Status changes, delivery confirmations, and payment releases are pushed back to the original conversation channel." },
            ].map((item) => (
              <div key={item.step} className="relative">
                <span className="text-xs font-semibold text-gray-300">{item.step}</span>
                <div className="mt-2 flex size-10 items-center justify-center rounded-lg bg-gray-900 text-white">
                  <item.icon className="size-5" />
                </div>
                <h3 className="mt-4 font-medium">{item.title}</h3>
                <p className="mt-1 text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Value */}
      <section className="border-t border-gray-100 bg-gray-50/60">
        <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
          <p className="text-sm font-medium uppercase tracking-widest text-gray-400">Why ProofProcure</p>
          <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight md:text-4xl">
            Less admin. Faster agreements. Automatic enforcement.
          </h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Zap, title: "Agreements in minutes, not days", desc: "Stop re-typing terms from chat into spreadsheets. ProofProcure extracts and structures them instantly." },
              { icon: Users, title: "Supplier trust, built in", desc: "Both parties see the same terms, confirm independently, and know payment rules are enforced — not promised." },
              { icon: CheckCircle2, title: "Payment tied to delivery", desc: "Funds are released when delivery is confirmed. No invoicing delays, no manual follow-up." },
              { icon: BarChart3, title: "Audit-ready from day one", desc: "Every conversation, confirmation, and payment event is recorded with timestamps and actor attribution." },
              { icon: Globe, title: "Works across borders", desc: "Built for global trade. Supports cross-border settlement without the friction of traditional banking rails." },
              { icon: MessageSquareText, title: "No new software to learn", desc: "Keep using Telegram, email, WhatsApp. ProofProcure works behind the scenes, not in front of your workflow." },
            ].map((item) => (
              <div key={item.title} className="rounded-xl border border-gray-100 bg-white p-6">
                <item.icon className="size-5 text-gray-900" />
                <h3 className="mt-3 font-medium">{item.title}</h3>
                <p className="mt-1 text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section className="border-t border-gray-100">
        <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
          <p className="text-sm font-medium uppercase tracking-widest text-gray-400">Built for</p>
          <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight md:text-4xl">
            Teams that buy and sell across borders, over chat
          </h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { title: "SME buyers", desc: "Procurement teams of 1–10 who negotiate over messaging and need structured records without enterprise software." },
              { title: "Global suppliers", desc: "Exporters and manufacturers who confirm orders via Telegram and need payment certainty before shipping." },
              { title: "Recurring replenishment", desc: "Repeat orders for raw materials, components, or inventory where terms are stable but execution is manual." },
            ].map((item) => (
              <div key={item.title} className="rounded-xl border border-gray-200 p-6">
                <h3 className="font-medium">{item.title}</h3>
                <p className="mt-2 text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="border-t border-gray-100 bg-gray-900 text-white">
        <div className="mx-auto max-w-6xl px-6 py-20 text-center md:py-28">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Stop losing agreements to chat history
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-gray-400">
            ProofProcure turns the procurement conversations you already have into agreements that execute themselves. Start in under a minute.
          </p>
          <Link href="/login" className="mt-8 inline-block">
            <Button size="lg" variant="secondary" className="gap-2">
              Get started <ArrowRight className="size-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 text-sm text-gray-400">
          <span>© 2026 ProofProcure</span>
          <span>Procurement execution, simplified.</span>
        </div>
      </footer>
    </div>
  );
}
