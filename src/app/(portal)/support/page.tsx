import { getAuth } from "@/lib/auth";
import { getSupportData } from "@/lib/services/ticket-service";
import SupportTabs from "./_components/support-tabs";

export default async function SupportPage() {
  const { userId } = await getAuth();
  const data = await getSupportData(userId);

  return (
    <div className="flex flex-col gap-6 w-full">
      <div>
        <h1 className="text-[24px] font-semibold text-text-heading">Support</h1>
        <p className="mt-1 text-[13px] text-[#6B7280]">
          Get help, track your tickets, and submit new requests.
        </p>
      </div>

      <SupportTabs data={data} />
    </div>
  );
}
