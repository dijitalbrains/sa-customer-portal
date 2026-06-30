import type { TicketStatus } from "@/lib/types/ticket";

export function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-[16px] bg-white shadow-[0px_0px_0px_1px_rgba(193,198,215,0.18),0px_4px_24px_0px_rgba(128,149,170,0.12)]">
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  right,
}: {
  title: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex h-12 items-center justify-between bg-surface-overlay px-5">
      <span className="text-[13px] font-semibold text-text-heading">{title}</span>
      {right}
    </div>
  );
}

export function StatusBadge({ status }: { status: TicketStatus }) {
  if (status === "RESOLVED") {
    return (
      <span className="inline-flex h-6 items-center rounded-full bg-[#EAF3DE] px-2.5 text-[11px] font-semibold text-[#22BB62]">
        Resolved
      </span>
    );
  }

  return (
    <span className="inline-flex h-6 items-center gap-1.5 rounded-full bg-[#FEF3C7] px-2.5 text-[11px] font-semibold text-[#92400E]">
      <span className="size-1.5 rounded-full bg-[#F59E0B]" />
      Open
    </span>
  );
}
