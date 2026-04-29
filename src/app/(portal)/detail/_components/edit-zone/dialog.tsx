"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react";
import { getEditZoneData, type EditZoneData } from "@/lib/actions/zone.actions";
import EditZoneForm from "./form";

interface EditZoneDialogProps {
  open: boolean;
  onClose: () => void;
  subscriptionId: number;
}

const PANEL_SHADOW =
  "shadow-[0px_0px_0px_1px_rgba(55,146,222,0.08),0px_32px_80px_-8px_rgba(8,20,40,0.5)]";

export default function EditZoneDialog({ open, onClose, subscriptionId }: EditZoneDialogProps) {
  const [data, setData] = useState<EditZoneData | null>(null);

  useEffect(() => {
    if (!open) return;
    setData(null);
    getEditZoneData(subscriptionId)
      .then(setData)
      .catch((err) => {
        toast.error("Failed to load setup");
        onClose();
      });
  }, [open, subscriptionId, onClose]);

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <DialogBackdrop className="fixed inset-0 bg-text-heading/50 backdrop-blur-[2px]" />
      <div className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto">
        <DialogPanel
          className={`relative bg-white rounded-3xl ${PANEL_SHADOW} w-full max-w-[960px]`}
        >
          <Header onClose={onClose} />
          {data ? (
            <EditZoneForm data={data} onClose={onClose} />
          ) : (
            <LoadingState />
          )}
        </DialogPanel>
      </div>
    </Dialog>
  );
}

function Header({ onClose }: { onClose: () => void }) {
  return (
    <div className="border-b border-border-subtle/50">
      <div className="flex items-center justify-between gap-3 px-7 py-3">
        <div className="flex items-center gap-3">
          <span className="rounded-lg bg-[#eef6fc] flex items-center justify-center">
            <img src="/assets/icons/figma/setup-icon.svg" alt="" />
          </span>
          <h3 className="font-bold text-[17px] text-text-heading leading-tight">
            Customize your setup
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-surface-overlay cursor-pointer"
        >
          <img src="/assets/icons/figma/close.svg" alt="" className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="px-7 py-10 text-center text-sm text-text-muted">Loading setup…</div>
  );
}