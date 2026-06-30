import type { TicketListItem } from "@/lib/types/ticket";
import TicketCard from "./ticket-card";

interface OpenTicketsPanelProps {
  tickets: TicketListItem[];
  onSubmitClick: () => void;
}

export default function OpenTicketsPanel({
  tickets,
  onSubmitClick,
}: OpenTicketsPanelProps) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-[12px] text-[#6B7280]">
        {tickets.length} {tickets.length === 1 ? "open ticket" : "open tickets"}
      </p>

      {tickets.map((ticket) => (
        <TicketCard key={ticket.id} ticket={ticket} />
      ))}

      <div className="flex flex-col justify-center gap-1 h-16 px-5 rounded-[12px] bg-surface-overlay shadow-[0px_0px_0px_1px_rgba(55,146,222,0.08)]">
        <p className="text-[12px] text-text-muted">
          Need more help? Submit a new ticket and our team will get back to you within
          24 hours.
        </p>
        <button
          type="button"
          onClick={onSubmitClick}
          className="self-start text-[12px] font-semibold text-brand-primary cursor-pointer"
        >
          Submit a ticket →
        </button>
      </div>
    </div>
  );
}
