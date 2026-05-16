import { d1 } from "@/lib/db";
import { ProposalView, type PublicAgreement } from "./proposal-view";

export default async function AgreementPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const agreement = await d1.first<PublicAgreement>(
    `SELECT id, supplier_email, item, quantity, price, total, currency,
            delivery_window, payment_condition, status, confidence,
            buyer_ratified_at, supplier_ratified_at, created_at, updated_at
     FROM agreements
     WHERE share_token = ?
     LIMIT 1`,
    [token],
  );

  if (!agreement) {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-rose-600">
            Agreement not found
          </h1>
          <p className="mt-2 text-slate-500">
            This link may be invalid or expired.
          </p>
        </div>
      </main>
    );
  }

  return <ProposalView agreement={agreement} token={token} />;
}
