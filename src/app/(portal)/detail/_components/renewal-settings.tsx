import Link from "next/link";
import PaymentMethod from "@/components/shared/payment-method";
import type { RenewalItem } from "@/lib/types/subscription";
import ShipToButton from "@/components/shared/addresses/change-shipping-address/ship-to-button";

const LABEL_CLASS = "font-semibold text-[10px] uppercase text-black leading-none";
const VALUE_CLASS = "font-normal text-xs text-black leading-tight";
const COLUMN_CLASS = "flex-1 basis-[180px] min-w-0";
const CHEVRON = (
  <img src="/assets/icons/chevron-tiny.svg" alt="" className="w-[5px] h-[9px] -scale-y-100" />
);

export default function RenewalSettings({ item }: { item: RenewalItem }) {
  const { subscription } = item;

  return (
    <div className="flex flex-wrap gap-5 mt-3">
      <div className={COLUMN_CLASS}>
        {item.userAddressId !== null ? (
          <ShipToButton
            subscriptionItemId={item.id}
            currentAddressId={item.userAddressId}
            shipTo={item.shipTo}
          />
        ) : (
          <div className="flex flex-col gap-1 items-start">
            <span className={LABEL_CLASS}>Ship To</span>
            <span className={VALUE_CLASS}>{item.shipTo}</span>
          </div>
        )}
      </div>

      <Link
        href={`/edit-payment/${item.id}`}
        className={`${COLUMN_CLASS} flex gap-[18px] items-center cursor-pointer hover:opacity-80 transition-opacity`}
      >
        <div className="flex-1 min-w-0 flex flex-col gap-1 items-start">
          <span className={LABEL_CLASS}>Payment Method</span>
          <div className={VALUE_CLASS}>
            {item.payment ? (
              <PaymentMethod payment={item.payment} showStatus />
            ) : (
              <span className="text-text-muted">No payment method</span>
            )}
          </div>
        </div>
        {CHEVRON}
      </Link>

      <div className={`${COLUMN_CLASS} flex flex-col gap-1 items-start`}>
        <span className={LABEL_CLASS}>Loyalty Program</span>
        <div className={VALUE_CLASS}>
          {subscription.isLoyaltyEnabled ? (
            <span>
              You&apos;ve saved <strong className="font-bold">$0.00</strong> being a loyalty customer
            </span>
          ) : (
            <Link
              href={`/loyalty/${subscription.id}`}
              className="text-brand-primary font-semibold hover:underline"
            >
              Join Loyalty Program
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
