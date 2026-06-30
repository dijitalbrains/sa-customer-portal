"use client";

import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { useConfirmation } from "@/components/providers/confirmation-provider";
import { resolveTicket } from "@/lib/actions/ticket.actions";
import { Card, CardHeader } from "./card";

interface TicketActionsCardProps {
  ticketId: number;
}

export default function TicketActionsCard({ ticketId }: TicketActionsCardProps) {
  const router = useRouter();
  const { confirm } = useConfirmation();

  function handleResolve() {
    confirm({
      title: "Mark as resolved?",
      description: "Are you sure you want to resolve this support ticket now?",
      confirmText: "Yes, resolve",
      onConfirm: async () => {
        await resolveTicket({ ticketId });
        toast.success("Ticket marked as resolved");
        router.refresh();
      },
    });
  }

  return (
    <Card>
      <CardHeader title="Actions" />
      <div className="flex flex-col gap-3 px-5 py-4">
        <button
          type="button"
          onClick={handleResolve}
          className="flex h-11 items-center justify-center gap-2 rounded-pill bg-[#EAF3DE] text-[13px] font-semibold text-[#22BB62] shadow-[0px_0px_0px_1px_rgba(34,187,98,0.2)] cursor-pointer"
        >
          <span className="text-[14px] font-bold">✓</span>
          Mark as Resolved
        </button>
        <button
          type="button"
          onClick={() => router.push("/support")}
          className="flex h-11 items-center justify-center rounded-pill border border-[rgba(193,198,215,0.6)] bg-white text-[13px] font-medium text-[#6B7280] cursor-pointer hover:bg-surface-overlay"
        >
          Close Ticket
        </button>
      </div>
    </Card>
  );
}
