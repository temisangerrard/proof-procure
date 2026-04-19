import { fetchAgreement } from "@/lib/api";
import { ProposalView } from "./proposal-view";

export default async function AgreementPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  let agreement;
  try {
    agreement = await fetchAgreement(token);
  } catch {
    return (
      <main className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-red-600">
            Agreement not found
          </h1>
          <p className="mt-2 text-gray-500">
            This link may be invalid or expired.
          </p>
        </div>
      </main>
    );
  }

  return <ProposalView agreement={agreement} token={token} />;
}
