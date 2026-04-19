import { AgreementStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<AgreementStatus, { label: string; className: string }> = {
  DRAFT: { label: "Draft extracted", className: "bg-gray-100 text-gray-600" },
  PROPOSED: { label: "Proposed", className: "bg-blue-50 text-blue-700" },
  RATIFIED: { label: "Awaiting funding", className: "bg-amber-50 text-amber-700" },
  DEPLOYED: { label: "Ready to fund", className: "bg-amber-50 text-amber-700" },
  FUNDED: { label: "Funded — awaiting delivery", className: "bg-indigo-50 text-indigo-700" },
  DELIVERED_PENDING_CONFIRMATION: { label: "Delivered — confirm receipt", className: "bg-orange-50 text-orange-700" },
  COMPLETED: { label: "Payment released", className: "bg-emerald-50 text-emerald-700" },
  EXPIRED: { label: "Expired", className: "bg-red-50 text-red-600" },
};

export function StatusBadge({ status }: { status: AgreementStatus }) {
  const config = STATUS_CONFIG[status] || { label: status, className: "bg-gray-100 text-gray-600" };
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", config.className)}>
      {config.label}
    </span>
  );
}
