"use client";

import { useState } from "react";
import Breadcrumb from "@/components/ui/breadcrumb";
import EmptyState from "@/components/ui/empty-state";
import type { PaymentMethods } from "@/lib/actions/payment.actions";
import Tabs, { type PaymentTab } from "./tabs";
import CardList from "./card/card-list";
import CardDialog from "./card/add/card-dialog";
import BankList from "./bank/bank-list";
import LinkBankButton from "./bank/add/link-bank-button";

interface PaymentsPageProps {
  methods: PaymentMethods;
}

export default function PaymentsPage({ methods }: PaymentsPageProps) {
  const [tab, setTab] = useState<PaymentTab>("card");
  const [addCardOpen, setAddCardOpen] = useState(false);

  const isCardTab = tab === "card";
  const subtitle = isCardTab
    ? "Manage your saved cards and payment methods"
    : "Manage your saved bank accounts for filter renewals";
  const savedCount = isCardTab ? methods.cards.length : methods.banks.length;
  const bottomBanner = isCardTab
    ? "The Default payment method is charged for all new filter renewals. Update expired cards to avoid service interruptions."
    : "The Default bank account is used for all filter renewals. ACH transfers have no processing fee.";

  return (
    <div className="flex flex-col gap-5">
      <Breadcrumb page="manage-payments" current="Manage Payments" />

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-text-heading">Manage Payments</h1>
          </div>
          <p className="text-[13px] text-text-muted">
            {subtitle}{" "}
            {savedCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-[#eef6fc] text-[10px] font-semibold text-brand-primary">
                {savedCount} saved
              </span>
            )}
          </p>
        </div>

        <Tabs value={tab} onChange={setTab} />

        {isCardTab ? (
          <button
            type="button"
            onClick={() => setAddCardOpen(true)}
            className="h-10 px-5 rounded-pill bg-brand-gradient text-white text-sm font-semibold shadow-[0px_6px_18px_0px_rgba(55,146,222,0.35)] hover:opacity-95 cursor-pointer flex items-center gap-2"
          >
            <span className="text-base leading-none">+</span>
            Add Payment Method
          </button>
        ) : (
          <LinkBankButton />
        )}
      </div>

      {isCardTab ? (
        methods.cards.length === 0 ? (
          <EmptyState
            title="No cards saved yet"
            message="Add a card to receive renewal charges."
          />
        ) : (
          <CardList cards={methods.cards} />
        )
      ) : methods.banks.length === 0 ? (
        <EmptyState
          title="No bank accounts saved yet"
          message="Link a bank account to enable ACH transfers (US only)."
        />
      ) : (
        <BankList banks={methods.banks} cards={methods.cards} />
      )}

      <div className="rounded-2xl bg-[#eef6fc] px-5 py-3 text-[12px] text-text-muted">
        {bottomBanner}
      </div>

      <CardDialog open={addCardOpen} onClose={() => setAddCardOpen(false)} />
    </div>
  );
}
