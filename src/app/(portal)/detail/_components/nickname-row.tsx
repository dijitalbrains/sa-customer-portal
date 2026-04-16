"use client";

import { useState, useTransition } from "react";
import { updateNickname } from "../actions";

interface NicknameRowProps {
  subscriptionId: number;
  initialNickname: string;
}

const CONTAINER_CLASS =
  "rounded-[8px] bg-surface-raised border border-border-subtle shadow-card px-4 py-3 w-full";
const LABEL_CLASS =
  "text-[12px] font-normal capitalize text-text-muted shrink-0 w-20";

export default function NicknameRow({ subscriptionId, initialNickname }: NicknameRowProps) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(initialNickname);
  const [saved, setSaved] = useState(initialNickname);
  const [pending, startTransition] = useTransition();

  const handleCancel = () => {
    setValue(saved);
    setEditing(false);
  };

  const handleSave = () => {
    startTransition(async () => {
      await updateNickname(subscriptionId, value);
      setSaved(value);
      setEditing(false);
    });
  };

  return (
    <div className={`${CONTAINER_CLASS} ${editing ? "" : "hover:shadow-button transition-shadow"}`}>
      {editing ? (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <span className={LABEL_CLASS}>Nickname</span>
            <input
              autoFocus
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="flex-1 bg-surface-base border border-border-subtle/40 rounded-md px-3 py-2 text-[13px] text-text-primary focus:outline-none focus:border-brand-primary"
            />
          </div>
          <div className="flex items-center gap-2 justify-end">
            <button
              type="button"
              onClick={handleCancel}
              disabled={pending}
              className="px-4 py-1.5 rounded-pill text-[12px] font-semibold text-text-muted hover:bg-surface-base transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={pending}
              className="px-4 py-1.5 rounded-pill text-[12px] font-semibold text-white bg-brand-gradient hover:opacity-90 disabled:opacity-60 cursor-pointer"
            >
              {pending ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="flex items-center gap-3 w-full text-left cursor-pointer"
        >
          <span className={LABEL_CLASS}>Nickname</span>
          <span className="text-[13px] font-medium text-text-primary truncate">
            {saved || "—"}
          </span>
        </button>
      )}
    </div>
  );
}
