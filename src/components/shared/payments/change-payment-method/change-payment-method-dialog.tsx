"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "react-toastify";
import Button from "@/components/ui/button";
import DialogHeader from "@/components/ui/dialog-header";
import LoadingSpinner from "@/components/ui/loading-spinner";
import Modal from "@/components/ui/modal";
import CardDialog from "@/app/(portal)/payments/_components/card/add/card-dialog";
import LinkBankButton from "@/app/(portal)/payments/_components/bank/add/link-bank-button";
import Tabs, { type PaymentTab } from "@/app/(portal)/payments/_components/tabs";
import {
  getAchEligibility,
  getPaymentMethods,
} from "@/lib/actions/payment.actions";
import { updateSubscriptionItemPayment } from "@/lib/actions/renewal-detail.actions";
import type { BankPaymentMethod } from "@/lib/types/bank";
import type { CardPaymentMethod } from "@/lib/types/card";
import SelectableBank from "./selectable-bank";
import SelectableCard from "./selectable-card";

interface ChangePaymentMethodDialogProps {
  open: boolean;
  onClose: () => void;
  subscriptionItemId: number;
  currentCardId: number | null;
  currentBankId: number | null;
}

type Selection =
  | { type: "card"; id: number }
  | { type: "bank"; id: number }
  | null;

export default function ChangePaymentMethodDialog({
  open,
  onClose,
  subscriptionItemId,
  currentCardId,
  currentBankId,
}: ChangePaymentMethodDialogProps) {
  const initialTab: PaymentTab = currentBankId !== null ? "bank" : "card";
  
  const initialSelection: Selection =
    currentCardId !== null
      ? { type: "card", id: currentCardId }
      : currentBankId !== null
        ? { type: "bank", id: currentBankId }
        : null;

  const [tab, setTab] = useState<PaymentTab>(initialTab);
  const [selection, setSelection] = useState<Selection>(initialSelection);
  const [cards, setCards] = useState<CardPaymentMethod[] | null>(null);
  const [banks, setBanks] = useState<BankPaymentMethod[] | null>(null);
  const [achEligible, setAchEligible] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();
  const [cardDialogOpen, setCardDialogOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTab(initialTab);
    setSelection(initialSelection);
    setLoadError(null);
    setCards(null);
    setBanks(null);

    let cancelled = false;
    Promise.all([getPaymentMethods(), getAchEligibility()])
      .then(([methods, eligible]) => {
        if (cancelled) return;
        setCards(methods.cards);
        setBanks(methods.banks);
        setAchEligible(eligible);
      })
      .catch((e) => {
        if (cancelled) return;
        setLoadError(e instanceof Error ? e.message : "Failed to load payment methods");
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, currentCardId, currentBankId]);

  const handleSave = () => {
    if (!selection) return;
    startSaving(async () => {
      try {
        await updateSubscriptionItemPayment({
          subscriptionItemId,
          type: selection.type,
          paymentMethodId: selection.id,
        });
        toast.success("Payment method updated");
        onClose();
      } catch (e) {
        const message = e instanceof Error ? e.message : "Failed to update payment method";
        toast.error(message);
      }
    });
  };

  const handleCardAdded = async (card: CardPaymentMethod) => {
    try {
      await updateSubscriptionItemPayment({
        subscriptionItemId,
        type: "card",
        paymentMethodId: card.id,
      });
      toast.success("Card added and payment method updated");
      onClose();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to update payment method";
      toast.error(message);
    }
  };

  const handleBankLinked = async (bank: BankPaymentMethod) => {
    try {
      await updateSubscriptionItemPayment({
        subscriptionItemId,
        type: "bank",
        paymentMethodId: bank.id,
      });
      toast.success("Bank linked and payment method updated");
      onClose();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to update payment method";
      toast.error(message);
    }
  };

  const isUnchanged =
    selection !== null &&
    ((selection.type === "card" && selection.id === currentCardId) ||
      (selection.type === "bank" && selection.id === currentBankId));

  return (
    <>
      <Modal open={open && !cardDialogOpen} onClose={onClose} width="max-w-[830px]" showClose={false}>
        <DialogHeader
          iconSrc="/assets/icons/card/chip.svg"
          title="Change Payment Method"
          onClose={onClose}
        />

        <div className="px-7 py-6 flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            {achEligible ? <Tabs value={tab} onChange={setTab} /> : <span />}
            {!achEligible || tab === "card" ? (
              <button
                type="button"
                onClick={() => setCardDialogOpen(true)}
                className="h-10 px-5 rounded-pill bg-brand-gradient text-white text-sm font-semibold shadow-[0px_6px_18px_0px_rgba(55,146,222,0.35)] hover:opacity-95 cursor-pointer flex items-center gap-2"
              >
                <span className="text-base leading-none">+</span>
                Add Payment Method
              </button>
            ) : (
              <LinkBankButton onLinked={handleBankLinked} />
            )}
          </div>

          {loadError && (
            <div className="rounded-[8px] bg-[#FCEBEB] border border-[#791F1F40] px-3 py-2 text-[12px] text-[#791F1F]">
              {loadError}
            </div>
          )}

          {!loadError && (cards === null || banks === null) && (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          )}

          {cards && banks && (
            <>
              {tab === "card" ? (
                <CardGrid
                  cards={cards}
                  selectedId={selection?.type === "card" ? selection.id : null}
                  onSelect={(id) => setSelection({ type: "card", id })}
                />
              ) : !achEligible ? (
                <div className="rounded-[10px] border border-border-subtle bg-[#f7fbfe] px-4 py-3 text-[12px] text-text-muted">
                  Bank Transfer (ACH) is only available for US users.
                </div>
              ) : (
                <BankGrid
                  banks={banks}
                  selectedId={selection?.type === "bank" ? selection.id : null}
                  onSelect={(id) => setSelection({ type: "bank", id })}
                />
              )}

              <div className="flex items-center gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={saving}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  loading={saving}
                  loadingText="Saving…"
                  onClick={handleSave}
                  disabled={selection === null || isUnchanged}
                  className="flex-1"
                >
                  Save Payment
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>

      <CardDialog
        open={cardDialogOpen}
        onClose={() => setCardDialogOpen(false)}
        onAdded={async (card) => {
          setCardDialogOpen(false);
          await handleCardAdded(card);
        }}
      />
    </>
  );
}

function CardGrid({
  cards,
  selectedId,
  onSelect,
}: {
  cards: CardPaymentMethod[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}) {
  if (cards.length === 0) {
    return (
      <div className="rounded-[10px] border border-border-subtle bg-[#f7fbfe] px-4 py-3 text-[12px] text-text-muted">
        No saved cards. Click + Add Payment Method to add one.
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[420px] overflow-y-auto pr-1">
      {cards.map((card) => (
        <SelectableCard
          key={card.id}
          card={card}
          selected={card.id === selectedId}
          onSelect={() => onSelect(card.id)}
        />
      ))}
    </div>
  );
}

function BankGrid({
  banks,
  selectedId,
  onSelect,
}: {
  banks: BankPaymentMethod[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}) {
  if (banks.length === 0) {
    return (
      <div className="rounded-[10px] border border-border-subtle bg-[#f7fbfe] px-4 py-3 text-[12px] text-text-muted">
        No saved bank accounts. Click + Link Bank Transfer (ACH) to add one.
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[420px] overflow-y-auto pr-1">
      {banks.map((bank) => (
        <SelectableBank
          key={bank.id}
          bank={bank}
          selected={bank.id === selectedId}
          onSelect={() => onSelect(bank.id)}
        />
      ))}
    </div>
  );
}
