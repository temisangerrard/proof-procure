import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("size-6", className)}
      aria-label="ProofProcure"
    >
      {/* Two overlapping rounded paths forming a handshake/agreement mark with a checkmark */}
      <path
        d="M6 16C6 10.477 10.477 6 16 6h2a8 8 0 0 1 0 16h-2"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M26 16c0 5.523-4.477 10-10 10h-2a8 8 0 0 1 0-16h2"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M12.5 16.5l2.5 2.5 5-5"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Logo({ className, size = "default" }: { className?: string; size?: "sm" | "default" | "lg" }) {
  const textSize = { sm: "text-sm", default: "text-lg", lg: "text-xl" }[size];
  const iconSize = { sm: "size-4", default: "size-5", lg: "size-6" }[size];
  return (
    <span className={cn("inline-flex items-center gap-1.5 font-semibold tracking-tight", textSize, className)}>
      <LogoMark className={iconSize} />
      ProofProcure
    </span>
  );
}
