"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { toast } from "react-toastify";
import Button from "@/components/ui/button";
import DropdownField from "@/components/ui/dropdown-field";
import {
  replaceCardWithExistingAction,
  replaceCardWithNewAction,
} from "@/lib/actions/payment.actions";
import type { CardInput, CardPaymentMethod } from "@/lib/types/card";
import AddCard, { type AddCardState } from "../add/add-card";

interface ReplaceCardProps {
  oldCard: CardPaymentMethod;
  allCards: CardPaymentMethod[];
  onBack: () => void;
  onReplaced: () => void;
}

const NEW_CARD = "new";
const FORM_ID = "replace-card-form";

export default function ReplaceCard({
  oldCard,
  allCards,
  onBack,
  onReplaced,
}: ReplaceCardProps) {
  const options = useMemo(() => buildOptions(allCards, oldCard.id), [allCards, oldCard.id]);
  const [selectedId, setSelectedId] = useState<string>(NEW_CARD);
  const isNewCard = selectedId === NEW_CARD;

  return (
    <div className="flex flex-col gap-5">
      <Section
        title="Select a Payment Method"
        subtitle="Choose an existing saved card or add a new one"
      >
        <DropdownField value={selectedId} onChange={setSelectedId} options={options} />
      </Section>

      {isNewCard ? (
        <NewCardFlow oldCardId={oldCard.id} onBack={onBack} onReplaced={onReplaced} />
      ) : (
        <ExistingCardFlow
          oldCard={oldCard}
          newCardId={Number(selectedId)}
          allCards={allCards}
          onBack={onBack}
          onReplaced={onReplaced}
        />
      )}
    </div>
  );
}

interface FlowProps {
  onBack: () => void;
  onReplaced: () => void;
}

function NewCardFlow({ oldCardId, onBack, onReplaced }: FlowProps & { oldCardId: number }) {
  const [state, setState] = useState<AddCardState>({ ready: false, submitting: false });

  const submit = useCallback(
    (input: CardInput) => replaceCardWithNewAction({ oldCardId, card: input }),
    [oldCardId],
  );

  const handleSuccess = (card: CardPaymentMethod) => {
    toast.success(`Subscriptions moved to ${formatCard(card)}`);
    onReplaced();
  };

  return (
    <>
      <Section
        title="Card Details"
        subtitle="Enter new card information or select an existing saved card above"
      >
        <AddCard
          formId={FORM_ID}
          submit={submit}
          onSuccess={handleSuccess}
          onStateChange={setState}
        />
      </Section>

      <ButtonBar
        onBack={onBack}
        busy={state.submitting}
        continueButton={
          <Button
            type="submit"
            form={FORM_ID}
            variant="primary"
            loading={state.submitting}
            loadingText="Saving…"
            disabled={!state.ready}
            className="flex-1"
          >
            Continue
          </Button>
        }
      />
    </>
  );
}

function ExistingCardFlow({
  oldCard,
  newCardId,
  allCards,
  onBack,
  onReplaced,
}: FlowProps & {
  oldCard: CardPaymentMethod;
  newCardId: number;
  allCards: CardPaymentMethod[];
}) {
  const [submitting, startSubmit] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleContinue = () => {
    setError(null);
    startSubmit(async () => {
      try {
        await replaceCardWithExistingAction({ oldCardId: oldCard.id, newCardId });
        const picked = allCards.find((c) => c.id === newCardId);
        toast.success(
          picked ? `Subscriptions moved to ${formatCard(picked)}` : "Subscriptions moved",
        );
        onReplaced();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to replace card");
      }
    });
  };

  return (
    <>
      <Section title="Card Details">
        <div className="rounded-[10px] border border-border-subtle bg-[#f7fbfe] px-4 py-3 text-[12px] text-text-muted">
          Subscriptions on {formatCard(oldCard)} will move to the selected card.
        </div>
      </Section>

      {error && (
        <div className="rounded-[8px] bg-[#FCEBEB] border border-[#791F1F40] px-3 py-2 text-[12px] text-[#791F1F]">
          {error}
        </div>
      )}

      <ButtonBar
        onBack={onBack}
        busy={submitting}
        continueButton={
          <Button
            type="button"
            variant="primary"
            loading={submitting}
            loadingText="Moving…"
            onClick={handleContinue}
            className="flex-1"
          >
            Continue
          </Button>
        }
      />
    </>
  );
}

function ButtonBar({
  onBack,
  busy,
  continueButton,
}: {
  onBack: () => void;
  busy: boolean;
  continueButton: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        onClick={onBack}
        disabled={busy}
        className="flex-1"
      >
        ← Go Back
      </Button>
      {continueButton}
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-0.5">
        <span className="text-[13px] font-bold text-text-heading">{title}</span>
        {subtitle && <span className="text-[11px] text-text-muted">{subtitle}</span>}
      </div>
      {children}
    </div>
  );
}

function formatCard(card: CardPaymentMethod): string {
  return `${(card.brand ?? "").toUpperCase()} ****${card.last4}`;
}

function buildOptions(allCards: CardPaymentMethod[], oldCardId: number) {
  const usable = allCards.filter(
    (c) => c.id !== oldCardId && c.status !== "EXPIRED" && c.status !== "FAILED",
  );
  return [
    { value: NEW_CARD, label: "Add new card" },
    ...usable.map((c) => ({ value: String(c.id), label: formatCard(c) })),
  ];
}
