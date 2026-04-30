"use client";

import { useState } from "react";
import PauseSubscriptionButton from "@/components/shared/pause-subscription/button";
import EditPreferences from "@/components/shared/edit-preferences/edit-preferences";
import type { PauseItem } from "@/components/shared/pause-subscription/dialog";
import type { RenewalItem } from "@/lib/types/subscription";

interface ActionButtonsProps {
  item: RenewalItem;
  showPauseButton: boolean;
  pauseItems: PauseItem[];
}

const BUTTON_BASE =
  "h-11 flex-1 flex items-center justify-center font-semibold text-sm cursor-pointer";

export default function ActionButtons({ item, showPauseButton, pauseItems }: ActionButtonsProps) {
  const [editOpen, setEditOpen] = useState(false);

  return (
    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-auto pt-3">
      <button
        type="button"
        onClick={() => setEditOpen(true)}
        className={`${BUTTON_BASE} bg-brand-gradient rounded-[24px] text-white hover:opacity-90`}
      >
        Edit Preferences
      </button>
      {editOpen && (
        <EditPreferences open={editOpen} onClose={() => setEditOpen(false)} item={item} />
      )}

      {showPauseButton && (
        <PauseSubscriptionButton
          items={pauseItems}
          className={`${BUTTON_BASE} border border-brand-primary rounded-pill text-brand-primary hover:bg-brand-surface`}
        />
      )}
    </div>
  );
}
