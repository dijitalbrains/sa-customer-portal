"use client";

import { useEffect } from "react";
import Link from "next/link";
import { markTicketRead } from "@/lib/actions/ticket.actions";
import type { TicketDetail } from "@/lib/types/ticket";
import { Card, StatusBadge } from "./card";
import MessageBubble from "./message-bubble";
import ReplyBox from "./reply-box";
import TicketDetailsCard from "./ticket-details-card";
import TicketActionsCard from "./ticket-actions-card";

interface TicketDetailViewProps {
  detail: TicketDetail;
}

export default function TicketDetailView({ detail }: TicketDetailViewProps) {
  const isOpen = detail.status === "OPENED";

  useEffect(() => {
    markTicketRead({ ticketId: detail.id }).catch(() => {});
  }, [detail.id]);

  return (
    <div className="flex flex-col gap-4">
      <nav className="flex items-center gap-2 text-[11px] text-[#9BA3AF]">
        <Link href="/support" className="cursor-pointer hover:text-brand-primary">
          Support
        </Link>
        <span>/</span>
        <span>{isOpen ? "Open Tickets" : "Resolved Tickets"}</span>
        <span>/</span>
        <span>Ticket {detail.reference}</span>
      </nav>

      <div className="flex flex-col gap-5 xl:flex-row">
        <div className="min-w-0 flex-1">
          <Card>
            <div className="flex items-start justify-between gap-4 bg-surface-overlay px-5 py-3.5">
              <div>
                <p className="text-[16px] font-semibold text-text-heading">
                  {detail.title}
                </p>
                <div className="mt-1.5 flex items-center gap-2">
                  <StatusBadge status={detail.status} />
                  {detail.categoryTitle && (
                    <span className="inline-flex h-[22px] items-center rounded-full bg-[#EAF3FF] px-3 text-[10px] font-semibold text-brand-primary">
                      {detail.categoryTitle}
                    </span>
                  )}
                </div>
              </div>
              <span className="text-[11px] text-[#9BA3AF]">{detail.reference}</span>
            </div>

            <div className="flex flex-col gap-5 px-5 py-5">
              {detail.messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
            </div>

            {isOpen && (
              <ReplyBox ticketId={detail.id} notifications={detail.notifications} />
            )}
          </Card>
        </div>

        <div className="flex w-full flex-col gap-5 xl:w-[360px] xl:shrink-0">
          <TicketDetailsCard detail={detail} />
          {isOpen && <TicketActionsCard ticketId={detail.id} />}
        </div>
      </div>
    </div>
  );
}
