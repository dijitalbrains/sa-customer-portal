"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import TabBar, { type SupportTab } from "./tab-bar";
import OpenTicketsPanel from "./open-tickets-panel";
import ResolvedTicketsPanel from "./resolved-tickets-panel";
import SubmitTicketForm from "./submit-ticket-form";
import type { SupportData } from "@/lib/types/ticket";

interface SupportTabsProps {
  data: SupportData;
}

export default function SupportTabs({ data }: SupportTabsProps) {
  const router = useRouter();
  const [tab, setTab] = useState<SupportTab>("open");

  function handleSubmitted() {
    setTab("open");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-5">
      <TabBar value={tab} onChange={setTab} />

      {tab === "open" && (
        <OpenTicketsPanel
          tickets={data.openTickets}
          onSubmitClick={() => setTab("submit")}
        />
      )}

      {tab === "resolved" && (
        <ResolvedTicketsPanel tickets={data.resolvedTickets} />
      )}

      {tab === "submit" && (
        <SubmitTicketForm
          user={data.user}
          categories={data.categories}
          customers={data.customers}
          onSubmitted={handleSubmitted}
        />
      )}
    </div>
  );
}
