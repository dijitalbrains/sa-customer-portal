import { getAuth } from "@/lib/auth";
import { getRenewalTimeline } from "@/lib/services/renewal-timeline-service";
import RenewalTimelineTabs from "./_components/renewal-timeline-tabs";

export default async function RenewalTimelinePage() {
  const { userId } = await getAuth();
  const timeline = await getRenewalTimeline(userId);

  return (
    <div className="flex flex-col gap-6 w-full">
      <div>
        <h1 className="text-[24px] font-semibold text-text-heading">Future renewals</h1>
        <p className="mt-1 text-[13px] text-[#6B7280]">
          Your projected renewals over the next 5 years.
        </p>
      </div>

      <RenewalTimelineTabs timeline={timeline} />
    </div>
  );
}
