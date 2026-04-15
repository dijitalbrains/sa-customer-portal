"use client";

import { useState, useTransition } from "react";

interface RemoveButtonProps {
  label: string;
  confirmTitle: string;
  confirmMessage: string;
  action: () => Promise<void>;
  variant?: "link" | "ghost";
}

export default function RemoveButton({
  label,
  confirmTitle,
  confirmMessage,
  action,
  variant = "link",
}: RemoveButtonProps) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const handleConfirm = () => {
    startTransition(async () => {
      await action();
      setOpen(false);
    });
  };

  const triggerClass =
    variant === "ghost"
      ? "w-full text-center py-2.5 rounded-lg text-[13px] font-semibold text-status-error-text hover:bg-status-error/40 transition-colors cursor-pointer"
      : "text-[13px] font-medium text-status-error-text hover:underline self-center cursor-pointer";

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={triggerClass}>
        {label}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-text-heading/40 px-4">
          <div className="bg-surface-base rounded-2xl shadow-card max-w-md w-full p-6 flex flex-col gap-4">
            <h3 className="text-[18px] font-bold text-text-heading">{confirmTitle}</h3>
            <p className="text-[13px] text-text-muted">{confirmMessage}</p>
            <div className="flex items-center gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={pending}
                className="px-5 py-2 rounded-pill text-[13px] font-semibold text-text-muted hover:bg-surface-overlay cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={pending}
                className="px-5 py-2 rounded-pill text-[13px] font-semibold text-white bg-status-error-text hover:opacity-90 disabled:opacity-60 cursor-pointer"
              >
                {pending ? "Removing..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
