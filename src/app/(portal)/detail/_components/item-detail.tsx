import RemoveButton from "./remove-button";
import NeedThisNowButton from "@/components/shared/need-this-now/need-this-now-button";
import { removeSubscriptionItem } from "../actions";
import type { RenewalItem } from "@/lib/types/subscription";

interface ItemDetailProps {
  item: RenewalItem;
  isAdmin: boolean;
}

export default function ItemDetail({ item, isAdmin }: ItemDetailProps) {
  const showDeleteP1 = item.isP1Filter && isAdmin;

  return (
    <div className="flex flex-wrap gap-4 sm:gap-[19px] items-start">
      <img
        src={item.productImage}
        alt={item.productName}
        className="w-[94px] h-[91px] object-cover shrink-0"
      />

      <div className="flex-1 min-w-[140px] flex flex-col gap-1 pt-2">
        <h3 className="font-semibold text-base text-status-active-text leading-6 truncate">
          {item.productName}
        </h3>
        {item.isPending ? (
          <span className="self-start inline-flex items-center px-3 py-1 rounded-pill text-[11px] font-semibold bg-status-warning text-text-primary">
            Pending Install
          </span>
        ) : (
          <div className="flex items-baseline gap-2">
            <span className="font-semibold text-[10px] uppercase text-black leading-none">
              Next Subscription:
            </span>
            <span className="font-normal text-xs text-black leading-none">
              {item.nextReminderDate}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-col items-end gap-1.5 shrink-0 pt-2 ml-auto">
        <NeedThisNowButton item={item} />
        {showDeleteP1 && (
          <RemoveButton
            label={`Delete ${item.productName}`}
            confirmTitle={`Delete ${item.productName}?`}
            confirmMessage={`This will remove the ${item.productName} from this subscription. This action cannot be undone.`}
            action={removeSubscriptionItem.bind(null, item.id)}
            variant="link"
          />
        )}
      </div>
    </div>
  );
}
