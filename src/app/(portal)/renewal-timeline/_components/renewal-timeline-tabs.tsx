"use client";

import { useState } from "react";
import TimelineTabBar, { type TimelineTab } from "./timeline-tab-bar";
import RenewalCalendar from "./renewal-calendar";
import RenewalTimelineList from "./renewal-timeline-list";
import type { RenewalTimeline } from "@/lib/types/renewal-timeline";

interface RenewalTimelineTabsProps {
  timeline: RenewalTimeline;
}

export default function RenewalTimelineTabs({ timeline }: RenewalTimelineTabsProps) {
  const [tab, setTab] = useState<TimelineTab>("calendar");

  return (
    <div className="flex flex-col gap-5">
      <TimelineTabBar value={tab} onChange={setTab} />

      {tab === "calendar" ? (
        <RenewalCalendar timeline={timeline} />
      ) : (
        <RenewalTimelineList dates={timeline.byDate} />
      )}
    </div>
  );
}
