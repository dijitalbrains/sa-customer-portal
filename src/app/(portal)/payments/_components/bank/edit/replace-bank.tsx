"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "react-toastify";
import Button from "@/components/ui/button";
import { replaceBankWithExistingPaymentMethodAction } from "@/lib/actions/payment.actions";
import type { BankPaymentMethod } from "@/lib/types/bank";
import type { CardPaymentMethod } from "@/lib/types/card";
import Tabs, { type PaymentTab } from "../../tabs";

interface ReplaceBankProps {
  oldBank: BankPaymentMethod;
  allBanks: BankPaymentMethod[];
  allCards: CardPaymentMethod[];
  onBack: () => void;
  onReplaced: () => void | Promise<void>;
}

export default function ReplaceBank({
  oldBank,
  allBanks,
  allCards,
  onBack,
  onReplaced,
}: ReplaceBankProps) {
  const usableCards = useMemo(
    () => allCards.filter((c) => c.status !== "EXPIRED" && c.status !== "FAILED"),
    [allCards],
  );
  const usableBanks = useMemo(
    () => allBanks.filter((b) => b.id !== oldBank.id && b.status !== "FAILED"),
    [allBanks, oldBank.id],
  );

  const [tab, setTab] = useState<PaymentTab>("card");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [submitting, startSubmit] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleTabChange = (next: PaymentTab) => {
    setTab(next);
    setSelectedId(null);
    setError(null);
  };

  const handleSubmit = () => {
    if (!selectedId) return;
    setError(null);
    startSubmit(async () => {
      try {
        await replaceBankWithExistingPaymentMethodAction({
          oldBankId: oldBank.id,
          targetType: tab,
          newId: selectedId,
        });

        const targetLabel = getTargetLabel(tab, selectedId, usableCards, usableBanks);
        toast.success(`Subscriptions moved to ${targetLabel}`);
        await onReplaced();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to replace bank");
      }
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[12px] text-text-muted">
        This bank account is connected to ({oldBank.activeSubscriptions}) subscription
        {oldBank.activeSubscriptions === 1 ? "" : "s"}. Choose a replacement payment method:
      </p>

      <Tabs value={tab} onChange={handleTabChange} />

      {tab === "card" ? (
        <PaymentList
          empty="No saved cards available. Please add a card first."
          items={usableCards.map((c) => ({ id: c.id, label: formatCard(c) }))}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
      ) : (
        <PaymentList
          empty="No other bank accounts available. Please link one first."
          items={usableBanks.map((b) => ({ id: b.id, label: formatBank(b) }))}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
      )}

      {error && (
        <div className="rounded-[8px] bg-[#FCEBEB] border border-[#791F1F40] px-3 py-2 text-[12px] text-[#791F1F]">
          {error}
        </div>
      )}

      <div className="flex items-center gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={submitting}
          className="flex-1"
        >
          ← Go Back
        </Button>
        <Button
          type="button"
          variant="primary"
          loading={submitting}
          loadingText="Replacing…"
          onClick={handleSubmit}
          disabled={!selectedId}
          className="flex-1"
        >
          Replace and remove bank account
        </Button>
      </div>
    </div>
  );
}

interface PaymentListProps {
  empty: string;
  items: { id: number; label: string }[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}

function PaymentList({ empty, items, selectedId, onSelect }: PaymentListProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-[10px] border border-border-subtle bg-[#f7fbfe] px-4 py-3 text-[12px] text-text-muted">
        {empty}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {items.map((item) => {
        const selected = item.id === selectedId;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
            className={`text-left flex items-center gap-3 px-4 py-3 rounded-[10px] border transition-colors cursor-pointer ${
              selected
                ? "border-brand-primary bg-[#eef6fc]"
                : "border-border-subtle bg-white hover:bg-[#f7fbfe]"
            }`}
          >
            <span
              className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                selected ? "border-brand-primary" : "border-border-subtle"
              }`}
            >
              {selected && <span className="w-2 h-2 rounded-full bg-brand-primary" />}
            </span>
            <span className="text-[13px] font-semibold text-text-heading">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function getTargetLabel(
  tab: PaymentTab,
  selectedId: number,
  usableCards: CardPaymentMethod[],
  usableBanks: BankPaymentMethod[],
): string {
  if (tab === "card") {
    const card = usableCards.find((c) => c.id === selectedId);
    return card ? formatCard(card) : "the selected payment method";
  }
  const bank = usableBanks.find((b) => b.id === selectedId);
  return bank ? formatBank(bank) : "the selected payment method";
}

function formatBank(bank: BankPaymentMethod): string {
  return `${(bank.bankName ?? "Bank")} ****${bank.last4 ?? "****"}`;
}

function formatCard(card: CardPaymentMethod): string {
  return `${(card.brand ?? "").toUpperCase()} ****${card.last4}`;
}
