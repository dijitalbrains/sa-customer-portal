import Link from "next/link";
import type { RenewalItem } from "@/lib/types/subscription";
import ShipToButton from "@/components/shared/addresses/shipping-address-button";
import PaymentMethodButton from "@/components/shared/payments/payment-method-button";

export default function RenewalSettings({ item }: { item: RenewalItem }) {
  const { subscription } = item;

  return (
    <div className="flex flex-wrap gap-5 mt-3">
      <div className="flex-1 basis-[180px] min-w-0">
        {item.userAddressId !== null ? (
          <ShipToButton
            subscriptionItemId={item.id}
            currentAddressId={item.userAddressId}
            shipTo={item.shipTo}
          />
        ) : (
          <div className="flex flex-col gap-1 items-start">
            <span className="font-semibold text-[10px] uppercase text-black leading-none">Ship To</span>
            <span className="font-normal text-xs text-black leading-tight">{item.shipTo}</span>
          </div>
        )}
      </div>

      <div className="flex-1 basis-[180px] min-w-0">
        <PaymentMethodButton
          subscriptionItemId={item.id}
          currentCardId={item.userStripeSourceId}
          currentBankId={item.userBankAccountId}
          payment={item.payment}
        />
      </div>

      <div className="flex-1 basis-[180px] min-w-0 flex flex-col gap-1 items-start">
        <span className="font-semibold text-[10px] uppercase text-black leading-none">Loyalty Program</span>
        <div className="font-normal text-xs text-black leading-tight">
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
