import ItemDetail from "./item-detail";
import PricingBreakdown from "./pricing-breakdown";
import RenewalSettings from "./renewal-settings";
import ActionButtons from "./action-buttons";
import type {
  RenewalItem,
  LinkedProductOption,
} from "@/lib/types/subscription";
import type { PauseItem } from "@/components/shared/pause-subscription-dialog";

interface RenewalCardProps {
  item: RenewalItem;
  isAdmin: boolean;
  availableLinkedProducts: LinkedProductOption[];
  pauseItems: PauseItem[];
}

export default function RenewalCard({
  item,
  isAdmin,
  availableLinkedProducts,
  pauseItems,
}: RenewalCardProps) {
  const showPauseButton = item.subscription.isLoyaltyEnabled && !item.isPending;

  return (
    <article className="bg-surface-base border border-border-card rounded-card p-5 flex flex-wrap gap-5 w-full">
      <div className="flex-1 basis-[200px] min-w-0 flex flex-col gap-4">
        <ItemDetail item={item} isAdmin={isAdmin} />
        <RenewalSettings item={item} />
        <ActionButtons
          itemId={item.id}
          showPauseButton={showPauseButton}
          pauseItems={pauseItems}
        />
      </div>

      <div className="flex-1 basis-[300px] min-w-0">
        <PricingBreakdown
          item={item}
          isAdmin={isAdmin}
          availableLinkedProducts={availableLinkedProducts}
        />
      </div>
    </article>
  );
}
