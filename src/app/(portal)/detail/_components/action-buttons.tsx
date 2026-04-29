import PauseSubscriptionButton from "@/components/shared/pause-subscription/button";
import EditPreferencesButton from "./edit-preferences/button";
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
  return (
    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-auto pt-3">
      <EditPreferencesButton
        item={item}
        className={`${BUTTON_BASE} bg-brand-gradient rounded-[24px] text-white hover:opacity-90`}
      />

      {showPauseButton && (
        <PauseSubscriptionButton
          items={pauseItems}
          className={`${BUTTON_BASE} border border-brand-primary rounded-pill text-brand-primary hover:bg-brand-surface`}
        />
      )}
    </div>
  );
}
