"use client";

import { useState, useTransition } from "react";

type Variant = "link" | "ghost" | "pill";

interface RemoveButtonProps {
  label: string;
  confirmTitle: string;
  confirmMessage: string;
  action: () => Promise<void>;
  variant?: Variant;
}

const TRIGGER_CLASS: Record<Variant, string> = {
  ghost:
    "w-full text-center py-2.5 rounded-md text-[13px] font-semibold text-status-error-text hover:bg-status-error/40 transition-colors cursor-pointer",
  pill:
    "inline-flex items-center justify-center h-[38px] w-[164px] rounded-pill border-[0.5px] border-border-danger text-sm font-semibold text-border-danger hover:bg-admin-bg transition-colors cursor-pointer",
  link:
    "text-xs font-medium text-status-error-text hover:underline cursor-pointer whitespace-nowrap",
};

export default function RemoveButton({
  label,
  confirmTitle,
  confirmMessage,
  action,
  variant = "link",
}: RemoveButtonProps) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const confirm = () => {
    startTransition(async () => {
      await action();
      setOpen(false);
    });
  };

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={TRIGGER_CLASS[variant]}>
        {label}
      </button>

      {open && (
        <ConfirmDialog
          title={confirmTitle}
          message={confirmMessage}
          pending={pending}
          onCancel={() => setOpen(false)}
          onConfirm={confirm}
        />
      )}
    </>
  );
}

interface ConfirmDialogProps {
  title: string;
  message: string;
  pending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

function ConfirmDialog({ title, message, pending, onCancel, onConfirm }: ConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-text-heading/40 px-4">
      <div className="bg-surface-base rounded-2xl shadow-card max-w-md w-full p-6 flex flex-col gap-4">
        <h3 className="text-lg font-bold text-text-heading">{title}</h3>
        <p className="text-[13px] text-text-muted">{message}</p>
        <div className="flex items-center gap-3 justify-end pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="px-5 py-2 rounded-pill text-[13px] font-semibold text-text-muted hover:bg-surface-overlay cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className="px-5 py-2 rounded-pill text-[13px] font-semibold text-white bg-status-error-text hover:opacity-90 disabled:opacity-60 cursor-pointer"
          >
            {pending ? "Removing..." : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}
