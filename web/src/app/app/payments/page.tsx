import { getSessionUser } from "@/lib/auth";
import { listBills } from "@/lib/procure-store";
import { PaymentsClient } from "./payments-client";

export default async function PaymentsPage() {
  const user = await getSessionUser();
  const bills = user ? await listBills(user) : [];

  return <PaymentsClient initialBills={bills} />;
}
