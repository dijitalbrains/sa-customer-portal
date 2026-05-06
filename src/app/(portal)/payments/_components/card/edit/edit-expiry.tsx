"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "react-toastify";
import Button from "@/components/ui/button";
import DropdownField from "@/components/ui/dropdown-field";
import { updateCardExpiry } from "@/lib/actions/payment.actions";
import type { CardPaymentMethod } from "@/lib/types/card";

interface EditExpiryProps {
  card: CardPaymentMethod;
  onReplaceClick: () => void;
  onSaved: () => void;
}

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => ({
  value: String(i + 1),
  label: `Month — ${i + 1}`,
}));

export default function EditExpiry({ card, onReplaceClick, onSaved }: EditExpiryProps) {
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 21 }, (_, i) => {
      const year = currentYear + i;
      return { value: String(year), label: `Year — ${year}` };
    });
  }, []);

  const [expMonth, setExpMonth] = useState(card.expMonth);
  const [expYear, setExpYear] = useState(card.expYear);
  const [error, setError] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();

  const isExpired = card.status === "EXPIRED";

  const handleSave = () => {
    setError(null);

    const monthNum = Number(expMonth);
    const yearNum = Number(expYear);
    const endOfMonth = new Date(yearNum, monthNum, 1);
    if (new Date() > endOfMonth) {
      setError("Select a valid expiration date");
      return;
    }

    startSaving(async () => {
      try {
        await updateCardExpiry({ cardId: card.id, expMonth, expYear });
        toast.success("Expiration date updated");
        onSaved();
      } catch (e) {
        const message = e instanceof Error ? e.message : "Failed to update expiry";
        setError(message);
      }
    });
  };

  return (
    <div className="flex flex-col gap-5">
      <Section
        title="Card Information"
        subtitle="Current card on file – update or replace below"
      >
        <CardSummary card={card} />
      </Section>

      <Section
        title="Update Expiration Date"
        subtitle="Enter the new expiration date printed on your card"
      >
        <div className="grid grid-cols-2 gap-3">
          <DropdownField value={expMonth} onChange={setExpMonth} options={MONTH_OPTIONS} />
          <DropdownField value={expYear} onChange={setExpYear} options={yearOptions} />
        </div>
        {isExpired && (
          <div className="mt-3 rounded-[8px] bg-[#FFF5E5] border border-[#F0B400]/40 px-3 py-2 text-[12px] text-[#7A4A00]">
            ⚠ Expired payment — updating the date continues active subscriptions
          </div>
        )}
        {error && (
          <div className="mt-3 rounded-[8px] bg-[#FCEBEB] border border-[#791F1F40] px-3 py-2 text-[12px] text-[#791F1F]">
            {error}
          </div>
        )}
      </Section>

      <Section title="Replace Card">
        <button
          type="button"
          onClick={onReplaceClick}
          className="w-full text-left flex items-center justify-between gap-3 px-4 py-3 rounded-[10px] border border-border-subtle bg-white hover:bg-[#f7fbfe] cursor-pointer"
        >
          <span className="flex flex-col">
            <span className="text-[13px] font-bold text-text-heading">Replace with another card</span>
            <span className="text-[11px] text-text-muted">
              Select an existing saved card or add a new one
            </span>
          </span>
          <img
            src="/assets/icons/chevron-right.svg"
            alt=""
            className="w-4 h-4 shrink-0 opacity-60"
          />
        </button>
      </Section>

      <Button
        type="button"
        variant="primary"
        loading={saving}
        loadingText="Saving…"
        onClick={handleSave}
        className="w-full"
      >
        Save Changes
      </Button>
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

function CardSummary({ card }: { card: CardPaymentMethod }) {
  const isDanger = card.status === "EXPIRED" || card.status === "FAILED";
  const gradient = isDanger
    ? "bg-gradient-to-br from-[#E84B4B] to-[#A81E1E]"
    : "bg-gradient-to-r from-[#4EC7F2] to-[#9FEAFF]";
  const pillLabel =
    card.status === "EXPIRED"
      ? "EXPIRED"
      : card.status === "FAILED"
        ? "Charge Failed"
        : null;

  return (
    <div className={`relative overflow-hidden rounded-[12px] px-4 py-3 ${gradient}`}>
      <div className="pointer-events-none absolute -top-12 -right-12 w-32 h-32 rounded-full bg-white/10" />
      <div className="relative flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <img src="/assets/icons/card/chip.svg" alt="" className="w-7 h-5" />
          <span className="text-white text-[13px] tracking-[0.18em]">
            •••• •••• •••• {card.last4}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-white text-[12px] font-bold">
            {(card.brand ?? "").toUpperCase()}
          </span>
          {pillLabel && (
            <span className="px-2 py-0.5 rounded-full bg-white border border-[#791F1F] text-[10px] font-bold text-[#791F1F]">
              {pillLabel}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
