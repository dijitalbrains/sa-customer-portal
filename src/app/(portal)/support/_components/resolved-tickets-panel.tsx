import type { TicketListItem } from "@/lib/types/ticket";
import TicketCard from "./ticket-card";

interface ResolvedTicketsPanelProps {
  tickets: TicketListItem[];
}

export default function ResolvedTicketsPanel({
  tickets,
}: ResolvedTicketsPanelProps) {
  if (tickets.length === 0) {
    return (
      <p className="text-[12px] text-[#6B7280]">No resolved tickets yet.</p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[12px] text-[#6B7280]">
        {tickets.length} resolved {tickets.length === 1 ? "ticket" : "tickets"}
      </p>

      {tickets.map((ticket) => (
        <TicketCard key={ticket.id} ticket={ticket} />
      ))}
    </div>
  );
}
