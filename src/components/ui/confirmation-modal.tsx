"use client";

import { useState } from "react";
import Modal from "@/components/ui/modal";

export type ConfirmationVariant = "danger" | "primary";

export interface ConfirmationConfig {
  title: string;
  description?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmationVariant;
  onConfirm: () => void | Promise<void>;
}

interface ConfirmationModalProps {
  open: boolean;
  config: ConfirmationConfig | null;
  onClose: () => void;
}

const CONFIRM_CLASS: Record<ConfirmationVariant, string> = {
  danger:
    "rounded-pill border-[0.5px] border-border-danger text-border-danger hover:opacity-95",
  primary:
    "bg-brand-gradient text-white shadow-[0px_6px_18px_0px_rgba(55,146,222,0.35)] hover:opacity-95",
};

const VARIANT_ICON: Record<ConfirmationVariant, string | null> = {
  danger: "/assets/icons/figma/delete-icon.svg",
  primary: null,
};

export default function ConfirmationModal({ open, config, onClose }: ConfirmationModalProps) {
  const [pending, setPending] = useState(false);

  if (!config) return <Modal open={open} onClose={onClose}><div /></Modal>;

  const {
    title,
    description,
    confirmText = "Confirm",
    cancelText = "Cancel",
    variant = "danger",
    onConfirm,
  } = config;
  const iconSrc = VARIANT_ICON[variant];

  const handleConfirm = async () => {
    setPending(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setPending(false);
    }
  };

  return (
    <Modal open={open} onClose={pending ? () => {} : onClose}>
      <div className="px-10 pt-9 pb-7 flex flex-col items-center text-center gap-3">
        {iconSrc && <img src={iconSrc} alt="" className="w-[60px] h-[60px]" />}
        <h3 className="text-lg font-bold text-text-heading">{title}</h3>
        {description && (
          <div className="text-[13px] text-text-muted max-w-[360px]">{description}</div>
        )}

        <div className="mt-5 flex items-center gap-3 w-full">
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="flex-1 h-11 rounded-pill border border-border-subtle text-sm font-semibold text-text-muted hover:bg-surface-overlay disabled:opacity-60 cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={pending}
            className={`flex-1 h-11 rounded-pill text-sm font-bold cursor-pointer disabled:opacity-60 ${CONFIRM_CLASS[variant]}`}
          >
            {pending ? "Please wait…" : confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}
