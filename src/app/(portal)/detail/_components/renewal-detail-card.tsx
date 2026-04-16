import Button from "@/components/ui/button";
import SettingRow from "@/components/ui/setting-row";
import PricingSummary from "@/components/shared/pricing-summary";
import AdminEditablePricing from "./admin-editable-pricing";
import RemoveButton from "./remove-button";
import LoyaltyCta from "./loyalty-cta";
import PaymentMethodRow from "./payment-method-row";
import NextReminderPill from "./next-reminder-pill";
import { removeSubscriptionItem } from "../actions";
import type {
  RenewalItem,
  LinkedProductOption,
} from "@/lib/types/subscription";

interface RenewalDetailCardProps {
  subscriptionId: number;
  item: RenewalItem;
  isLoyaltyEnabled: boolean;
  isAdmin: boolean;
  availableLinkedProducts: LinkedProductOption[];
}

const STRIP_COLOR_BY_STATUS: Record<RenewalItem["status"], string> = {
  active: "bg-brand-gradient",
  pending: "bg-status-warning",
  expired: "bg-status-error-text",
};

export default function RenewalDetailCard({
  subscriptionId,
  item,
  isLoyaltyEnabled,
  isAdmin,
  availableLinkedProducts,
}: RenewalDetailCardProps) {
  const stripColor = STRIP_COLOR_BY_STATUS[item.status];
  const showLoyaltyCta = !isLoyaltyEnabled && item.productType !== "PRESET_FILTER";
  const showPauseButton = isLoyaltyEnabled && !item.isPending;

  return (
    <article className="bg-surface-base rounded-2xl shadow-card overflow-hidden flex flex-col w-full max-w-[460px] sm:w-[460px] shrink-0">
      <div className={`h-1 w-full ${stripColor}`} />

      <div className="p-5 flex flex-col gap-5">
        <CardHeader item={item} />

        <div className="flex flex-col gap-3">
          <button
            type="button"
            className="self-start text-[14px] font-semibold text-brand-primary hover:underline cursor-pointer"
          >
            Need this item right now?
          </button>

          <div className="flex gap-3">
            <Button href={`/edit-preferences/${item.id}`} className="flex-1">
              Edit Preferences
            </Button>

            {showPauseButton && (
              <Button
                href={`/pause-subscription/${subscriptionId}`}
                variant="outline"
                className="flex-1"
              >
                Pause Subscription
              </Button>
            )}
          </div>
        </div>

        {showLoyaltyCta && <LoyaltyCta subscriptionId={subscriptionId} />}

        {item.isP1Filter && isAdmin && (
          <RemoveButton
            label={`Delete ${item.productName}`}
            confirmTitle={`Delete ${item.productName}?`}
            confirmMessage={`This will remove the ${item.productName} from this subscription. This action cannot be undone.`}
            action={removeSubscriptionItem.bind(null, item.id)}
            variant="ghost"
          />
        )}

        <Divider />

        {isAdmin ? (
          <AdminEditablePricing item={item} availableLinkedProducts={availableLinkedProducts} />
        ) : (
          <PricingSummary
            lines={item.pricingLines}
            taxPercent={item.taxPercent}
            tax={item.tax}
            shipping={item.shipping}
            total={item.total}
          />
        )}

        <Divider />

        <div className="flex flex-col gap-3">
          <h3 className="text-[14px] font-bold text-text-heading">Renewal Settings</h3>
          <SettingRow label="Shipping Address" value={item.shipTo} href={`/edit-address/${item.id}`} />
          <PaymentMethodRow payment={item.payment} href={`/edit-payment/${item.id}`} />
        </div>
      </div>
    </article>
  );
}

function CardHeader({ item }: { item: RenewalItem }) {
  return (
    <header className="flex items-center gap-4">
      <img
        src="/assets/images/product-placeholder.svg"
        alt={item.productName}
        className="w-[58px] h-[58px] shrink-0"
      />

      <div className="flex-1 min-w-0 flex flex-col gap-[2px]">
        <h2 className="text-[15px] font-bold text-text-heading truncate leading-tight">
          {item.productName}
        </h2>
        <span className="text-[12px] font-normal text-text-muted">
          {item.technology} | Zone {item.zone}
        </span>
        <span className="text-[11px] font-normal text-text-muted">
          {item.linkedProductName ?? item.productName}
        </span>
      </div>

      <div className="shrink-0">
        <NextReminderPill isPending={item.isPending} date={item.nextReminderDate} />
      </div>
    </header>
  );
}

function Divider() {
  return <div className="h-px bg-border-subtle/30 w-full" />;
}
