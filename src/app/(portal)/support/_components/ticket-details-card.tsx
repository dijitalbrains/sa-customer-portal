import type { TicketDetail } from "@/lib/types/ticket";
import { Card, CardHeader, StatusBadge } from "./card";

interface TicketDetailsCardProps {
  detail: TicketDetail;
}

export default function TicketDetailsCard({ detail }: TicketDetailsCardProps) {
  const rows: { label: string; value: string; accent?: boolean }[] = [
    { label: "Ticket ID:", value: detail.reference, accent: true },
    { label: "Submitted:", value: detail.submittedAt },
    { label: "Category:", value: detail.categoryTitle },
    { label: "Ticket For:", value: detail.submittedForName },
    { label: "Last Updated:", value: detail.lastUpdatedAt },
    { label: "Replies:", value: detail.repliesLabel },
    { label: "Assigned to:", value: detail.assignedTo, accent: true },
  ];

  return (
    <Card>
      <CardHeader title="Ticket Details" right={<StatusBadge status={detail.status} />} />
      <div className="px-5 py-1">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between gap-4 border-b border-[rgba(193,198,215,0.15)] py-2.5 last:border-b-0"
          >
            <span className="text-[11px] text-[#9BA3AF]">{row.label}</span>
            <span
              className={`text-right text-[12px] font-semibold ${
                row.accent ? "text-brand-primary" : "text-text-heading"
              }`}
            >
              {row.value || "—"}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
