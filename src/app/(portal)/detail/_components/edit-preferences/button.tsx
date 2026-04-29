"use client";

import { useState } from "react";
import EditPreferencesDialog from "./dialog";
import type { RenewalItem } from "@/lib/types/subscription";

interface EditPreferencesButtonProps {
  item: RenewalItem;
  className?: string;
}

export default function EditPreferencesButton({ item, className = "" }: EditPreferencesButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        Edit Preferences
      </button>
      {open && (
        <EditPreferencesDialog open={open} onClose={() => setOpen(false)} item={item} />
      )}
    </>
  );
}
