import Link from "next/link";

interface ActionButtonsProps {
  itemId: number;
  subscriptionId: number;
  showPauseButton: boolean;
}

const BUTTON_BASE =
  "h-11 flex-1 flex items-center justify-center font-semibold text-sm cursor-pointer";

export default function ActionButtons({
  itemId,
  subscriptionId,
  showPauseButton,
}: ActionButtonsProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-auto pt-3">
      <Link
        href={`/edit-preferences/${itemId}`}
        className={`${BUTTON_BASE} bg-brand-gradient rounded-[24px] text-white hover:opacity-90`}
      >
        Edit Preferences
      </Link>

      {showPauseButton && (
        <Link
          href={`/pause-subscription/${subscriptionId}`}
          className={`${BUTTON_BASE} border border-brand-primary rounded-pill text-brand-primary hover:bg-brand-surface`}
        >
          Pause Subscription
        </Link>
      )}
    </div>
  );
}
