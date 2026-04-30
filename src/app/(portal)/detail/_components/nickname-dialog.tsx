"use client";

import { useState, useTransition } from "react";
import { toast } from "react-toastify";
import Modal from "@/components/ui/modal";
import { updateNickname } from "../actions";

interface NicknameDialogProps {
  open: boolean;
  onClose: () => void;
  subscriptionId: number;
  currentNickname: string;
}

export default function NicknameDialog({
  open,
  onClose,
  subscriptionId,
  currentNickname,
}: NicknameDialogProps) {
  const [value, setValue] = useState(currentNickname);
  const [pending, startTransition] = useTransition();

  const save = () => {
    startTransition(async () => {
      try {
        await updateNickname(subscriptionId, value);
        toast.success("Nickname updated");
        onClose();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to update nickname");
      }
    });
  };

  return (
    <Modal open={open} onClose={onClose}>
      <div className="px-10 pt-9 pb-5 flex flex-col items-center gap-2">
        <img src="/assets/icons/edit-pencil.svg" alt="" className="w-12 h-12" />
        <h2 className="text-2xl font-bold text-text-heading mt-2">Edit Nickname</h2>
        <p className="text-[13px] text-text-muted text-center max-w-[300px]">
          Give your subscription a friendly name to easily identify it.
        </p>
      </div>

      <div className="border-t border-border-subtle/70 mx-8" />

      <div className="px-10 py-5 flex flex-col gap-3">
        <span className="text-[11px] font-semibold uppercase text-text-muted">Nickname</span>
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
            if (e.key === "Escape") onClose();
          }}
          placeholder="e.g. Office, Home"
          className="w-full h-11 px-4 rounded-[10px] bg-white border border-border-subtle shadow-[0px_2px_6px_0px_rgba(0,48,82,0.05)] text-[13px] text-text-primary focus:outline-none focus:border-brand-primary"
        />

        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="mt-3 h-[50px] rounded-pill bg-brand-gradient shadow-[0px_6px_18px_0px_rgba(55,146,222,0.35)] text-white font-bold text-[15px] hover:opacity-95 disabled:opacity-60 cursor-pointer"
        >
          {pending ? "Saving…" : "Save"}
        </button>
      </div>
    </Modal>
  );
}
