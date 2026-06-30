import { notFound } from "next/navigation";
import { getAuth } from "@/lib/auth";
import { getTicketDetail } from "@/lib/services/ticket-service";
import TicketDetailView from "../_components/ticket-detail-view";

interface TicketDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function TicketDetailPage({ params }: TicketDetailPageProps) {
  const { id } = await params;
  const ticketId = Number(id);
  if (!Number.isInteger(ticketId) || ticketId <= 0) notFound();

  const { userId } = await getAuth();
  const detail = await getTicketDetail(userId, ticketId);
  if (!detail) notFound();

  return (
    <div className="max-w-[1534px]">
      <TicketDetailView detail={detail} />
    </div>
  );
}
