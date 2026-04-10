import Button from "@/components/ui/button";
import SubscriptionItemCard from "./subscription-item-card";
import type { Subscription } from "@/lib/types/subscription";

export default function SubscriptionItem({
  title,
  isLoyaltyEnabled,
  hasPendingInstall,
  subscriptionItems,
}: Subscription) {
  const showPauseButton = isLoyaltyEnabled && !hasPendingInstall;

  return (
    <div className="bg-surface-base rounded-lg shadow-card p-3 px-5 md:py-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 gap-4">
        <h2 className="text-lg md:text-2xl font-bold text-text-heading truncate">{title}</h2>
        {showPauseButton && (
          <Button variant="outline" size="sm">
            Pause Subscription
          </Button>
        )}
      </div>

      {/* Subscription Item Cards */}
      <div className="flex flex-col lg:flex-row gap-4 md:gap-6">
        {subscriptionItems.map((item, i) => (
          <SubscriptionItemCard key={i} {...item} />
        ))}
      </div>
    </div>
  );
}
