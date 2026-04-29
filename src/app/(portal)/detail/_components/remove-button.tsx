"use client";

import { toast } from "react-toastify";
import { useConfirmation } from "@/components/providers/confirmation-provider";

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
  const { confirm } = useConfirmation();

  const handleClick = () => {
    confirm({
      title: confirmTitle,
      description: confirmMessage,
      confirmText: label,
      variant: "danger",
      onConfirm: async () => {
        try {
          await action();
          toast.success(`${label} successful`);
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "Something went wrong");
        }
      },
    });
  };

  return (
    <button type="button" onClick={handleClick} className={TRIGGER_CLASS[variant]}>
      {label}
    </button>
  );
}
