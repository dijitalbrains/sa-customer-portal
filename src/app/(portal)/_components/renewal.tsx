import PauseSubscriptionButton from "@/components/shared/pause-subscription-button";
import RenewalCard from "./renewal-card";
import type { RenewalListGroup } from "@/lib/types/subscription";

export default function Renewal({
  title,
  isLoyaltyEnabled,
  hasPendingInstall,
  subscriptionItems,
}: RenewalListGroup) {
  const showPauseButton = isLoyaltyEnabled && !hasPendingInstall;

  const pauseItems = subscriptionItems.map((item) => ({
    id: item.id,
    productName: item.productName,
  }));

  return (
    <div className="bg-surface-base rounded-lg shadow-card p-3 px-5 md:py-5">
      <div className="flex items-center justify-between mb-5 gap-4">
        <h2 className="text-lg md:text-2xl font-bold text-text-heading truncate">{title}</h2>
        {showPauseButton && (
          <PauseSubscriptionButton
            items={pauseItems}
            className="h-9 px-4 text-xs font-semibold rounded-pill border border-brand-primary text-brand-primary hover:bg-brand-surface transition-colors cursor-pointer whitespace-nowrap"
          />
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-4 md:gap-6">
        {subscriptionItems.map((item, i) => (
          <RenewalCard key={i} {...item} />
        ))}
      </div>
    </div>
  );
}
