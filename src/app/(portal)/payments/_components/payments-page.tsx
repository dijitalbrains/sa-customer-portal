"use client";

import { useState } from "react";
import Breadcrumb from "@/components/ui/breadcrumb";
import EmptyState from "@/components/ui/empty-state";
import type { PaymentMethods } from "@/lib/actions/payment.actions";
import Tabs, { type PaymentTab } from "./tabs";
import CardList from "./card/card-list";
import CardDialog from "./card/add/card-dialog";

interface PaymentsPageProps {
  methods: PaymentMethods;
}

export default function PaymentsPage({ methods }: PaymentsPageProps) {
  const [tab, setTab] = useState<PaymentTab>("card");
  const [addCardOpen, setAddCardOpen] = useState(false);

  const handleAddPaymentMethod = () => {
    if (tab === "card") setAddCardOpen(true);
  };

  return (
    <div className="flex flex-col gap-5">
      <Breadcrumb page="manage-payments" current="Manage Payments" />

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-text-heading">Manage Payments</h1>
          </div>
          <p className="text-[13px] text-text-muted">
            Manage your saved cards and payment methods {methods.cards.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-[#eef6fc] text-[10px] font-semibold text-brand-primary">
                {methods.cards.length} saved
              </span>
            )}
          </p>
        </div>

        <Tabs value={tab} onChange={setTab} />

        <button
          type="button"
          onClick={handleAddPaymentMethod}
          className="h-10 px-5 rounded-pill bg-brand-gradient text-white text-sm font-semibold shadow-[0px_6px_18px_0px_rgba(55,146,222,0.35)] hover:opacity-95 cursor-pointer flex items-center gap-2"
        >
          <span className="text-base leading-none">+</span>
          Add Payment Method
        </button>
      </div>

      {tab === "card" ? (
        methods.cards.length === 0 ? (
          <EmptyState
            title="No cards saved yet"
            message="Add a card to receive renewal charges."
          />
        ) : (
          <CardList cards={methods.cards} />
        )
      ) : (
        <EmptyState
          title="ACH coming soon"
          message="Bank Transfer (ACH) management is not available yet."
        />
      )}

      <div className="rounded-2xl bg-[#eef6fc] px-5 py-3 text-[12px] text-text-muted">
        The Default payment method is charged for all new filter renewals. Update expired cards
        to avoid service interruptions.
      </div>

      <CardDialog open={addCardOpen} onClose={() => setAddCardOpen(false)} />
    </div>
  );
}
