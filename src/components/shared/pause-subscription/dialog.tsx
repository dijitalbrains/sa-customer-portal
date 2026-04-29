"use client";

import { useState, useTransition } from "react";
import { toast } from "react-toastify";
import Modal from "@/components/ui/modal";
import Toggle from "@/components/ui/toggle";
import { pauseSubscriptionItems } from "@/lib/actions/pause.actions";

export interface PauseItem {
  id: number;
  productName: string;
}

interface PauseSubscriptionDialogProps {
  open: boolean;
  onClose: () => void;
  items: PauseItem[];
}

const PAUSE_OPTIONS = [
  { value: 1, label: "1 month" },
  { value: 2, label: "2 months" },
  { value: 3, label: "3 months" },
];

const LABEL_CLASS = "text-[11px] font-semibold uppercase text-text-muted";

export default function PauseSubscriptionDialog({
  open,
  onClose,
  items,
}: PauseSubscriptionDialogProps) {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(
    () => new Set(items.map((i) => i.id)),
  );
  const [pauseMonths, setPauseMonths] = useState(0);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const toggle = (id: number, on: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const submit = () => {
    setError(null);
    if (selectedIds.size === 0) return setError("Select at least one renewal to pause.");
    if (pauseMonths < 1) return setError("Choose how long to pause for.");

    startTransition(async () => {
      try {
        await pauseSubscriptionItems({
          subscriptionItemIds: [...selectedIds],
          pauseMonths,
        });
        toast.success(
          `Paused ${selectedIds.size} renewal${selectedIds.size > 1 ? "s" : ""} for ${pauseMonths} month${pauseMonths > 1 ? "s" : ""}.`,
        );
        onClose();
      } catch (e) {
        const message = e instanceof Error ? e.message : "Something went wrong";
        toast.error(message);
        setError(message);
      }
    });
  };

  return (
    <Modal open={open} onClose={onClose}>
      <div className="px-10 pt-9 pb-5 flex flex-col items-center gap-2">
        <img src="/assets/icons/figma/pause-icon.svg" alt="" className="w-20 h-20" />
        <h2 className="text-2xl font-bold text-text-heading mt-2">Are you moving?</h2>
        <p className="text-[13px] text-text-muted text-center max-w-[300px]">
          Pause your filter renewals while you get settled into your new place.
        </p>
      </div>

      <div className="border-t border-border-subtle/70 mx-8" />

      <div className="px-10 py-5 flex flex-col gap-3">
        <span className={LABEL_CLASS}>Which renewals to pause?</span>
        <div className="flex flex-col gap-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 h-12 px-3 rounded-md bg-surface-overlay border border-brand-primary/50"
            >
              <Toggle
                checked={selectedIds.has(item.id)}
                onChange={(on) => toggle(item.id, on)}
                label={item.productName}
              />
              <span className="text-sm font-semibold text-text-primary">{item.productName}</span>
            </div>
          ))}
        </div>

        <span className={`${LABEL_CLASS} mt-2`}>Pause for?</span>
        <div className="relative">
          <select
            value={pauseMonths}
            onChange={(e) => setPauseMonths(Number(e.target.value))}
            className="appearance-none w-full h-11 px-4 pr-10 rounded-[10px] bg-white border border-border-subtle shadow-[0px_2px_6px_0px_rgba(0,48,82,0.05)] text-[13px] text-text-primary focus:outline-none focus:border-brand-primary cursor-pointer"
          >
            <option value={0} disabled>
              Select the option from the drop down
            </option>
            {PAUSE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <img
            src="/assets/icons/figma/chevron-down.svg"
            alt=""
            className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none"
          />
        </div>

        {error && <p className="text-xs text-status-error-text">{error}</p>}

        <button
          type="button"
          onClick={submit}
          disabled={pending}
          className="mt-3 h-[50px] rounded-pill bg-brand-gradient shadow-[0px_6px_18px_0px_rgba(55,146,222,0.35)] text-white font-bold text-[15px] hover:opacity-95 disabled:opacity-60 cursor-pointer"
        >
          {pending ? "Saving…" : "Update and Save"}
        </button>
      </div>
    </Modal>
  );
}
