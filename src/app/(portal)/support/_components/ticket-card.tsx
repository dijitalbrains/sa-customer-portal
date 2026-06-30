import Link from "next/link";
import type { TicketListItem } from "@/lib/types/ticket";

interface TicketCardProps {
  ticket: TicketListItem;
}

export default function TicketCard({ ticket }: TicketCardProps) {
  const resolved = ticket.status === "RESOLVED";

  return (
    <div className="flex items-center justify-between gap-4 h-20 px-5 rounded-[12px] bg-white shadow-[0px_0px_0px_1px_rgba(193,198,215,0.2),0px_4px_24px_0px_rgba(128,149,170,0.1)]">
      <div className="flex items-start gap-3 min-w-0">
        {resolved ? (
          <span className="mt-3 flex size-4 shrink-0 items-center justify-center rounded-full bg-[#22BB62]">
            <img src="/assets/icons/check.svg" alt="" className="w-2.5 h-2.5" />
          </span>
        ) : (
          <span className="mt-4 size-2 shrink-0 rounded-full bg-[#F59E0B]" />
        )}

        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-text-heading truncate">
            {ticket.title}
          </p>
          <div className="mt-2 flex items-center gap-3">
            {ticket.categoryTitle && (
              <span
                className={`inline-flex h-[22px] items-center rounded-full px-2.5 text-[10px] font-medium ${
                  resolved
                    ? "bg-[#F3F4F6] text-[#6B7280]"
                    : "bg-[#FEF3C7] text-[#92400E]"
                }`}
              >
                {ticket.categoryTitle}
              </span>
            )}
            <span className="text-[11px] text-[#9BA3AF]">{ticket.date}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-end gap-1 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-[#9BA3AF]">{ticket.reference}</span>
          {resolved && (
            <span className="inline-flex h-[22px] items-center rounded-full bg-[#EAF3DE] px-2.5 text-[10px] font-semibold text-[#22BB62]">
              Resolved
            </span>
          )}
        </div>
        <Link
          href={`/support/${ticket.id}`}
          className="inline-flex items-center gap-1 text-[12px] font-medium text-brand-primary cursor-pointer hover:underline"
        >
          View details
          <img src="/assets/icons/chevron-right.svg" alt="" className="w-2 h-2" />
        </Link>
      </div>
    </div>
  );
}
