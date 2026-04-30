"use client";

import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  width?: string;
}

const PANEL_SHADOW =
  "shadow-[0px_0px_0px_1px_rgba(55,146,222,0.08),0px_32px_80px_-8px_rgba(8,20,40,0.5)]";

export default function Modal({ open, onClose, children, width = "max-w-[540px]" }: ModalProps) {
  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <DialogBackdrop className="fixed inset-0 bg-text-heading/50 backdrop-blur-[2px]" />
      <div className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto">
        <DialogPanel className={`relative bg-white rounded-3xl ${PANEL_SHADOW} w-full ${width}`}>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full text-text-muted hover:bg-surface-overlay cursor-pointer"
          >
            <img src="/assets/icons/close.svg" alt="" className="w-4 h-4" />
          </button>
          {children}
        </DialogPanel>
      </div>
    </Dialog>
  );
}
