"use client";

import Modal from "@/components/ui/modal";

interface RemoveDefaultDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function RemoveDefaultDialog({ open, onClose }: RemoveDefaultDialogProps) {
  return (
    <Modal open={open} onClose={onClose}>
      <div className="px-10 pt-9 pb-7 flex flex-col items-center text-center gap-3">
        <h3 className="text-lg font-bold text-text-heading">Cannot remove default address</h3>
        <p className="text-[13px] text-text-muted max-w-[360px]">
          Please set another address as your default before removing this one.
        </p>

        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full h-11 rounded-pill bg-brand-gradient text-sm font-bold text-white shadow-[0px_6px_18px_0px_rgba(55,146,222,0.35)] hover:opacity-95 cursor-pointer"
        >
          Got it
        </button>
      </div>
    </Modal>
  );
}
