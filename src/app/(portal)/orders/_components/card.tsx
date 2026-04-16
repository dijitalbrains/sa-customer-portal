import Link from "next/link";
import { formatPrice } from "@/lib/utils/currency";
import PaymentMethodCmp from "@/components/shared/payment-method";
import type { OrderListItem } from "@/lib/types/order";

interface CardProps {
  order: OrderListItem;
  isActive: boolean;
}

export default function Card({ order, isActive }: CardProps) {
  return (
    <Link
      href={`/orders?id=${order.id}`}
      className={`block bg-surface-base rounded-[12px] overflow-hidden cursor-pointer transition-shadow relative ${
        isActive
          ? "border-2 border-brand-primary shadow-[0px_4px_16px_0px_rgba(0,48,82,0.1)]"
          : "shadow-[0px_4px_20px_0px_rgba(0,48,82,0.08)] hover:shadow-[0px_4px_16px_0px_rgba(0,48,82,0.12)]"
      }`}
    >
      {isActive && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-gradient rounded-l-[12px]" />
      )}

      <div className="p-[18px] pb-0">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-8">
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] font-semibold text-text-muted uppercase">Total</span>
              <span className="text-[13px] font-bold text-brand-primary font-data">
                {formatPrice(order.total, order.currencyCode)}
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] font-semibold text-text-muted uppercase">Payment</span>
              <PaymentMethodCmp payment={order.payment} />
            </div>
          </div>
          <span className="text-[14px] font-bold text-text-heading shrink-0">{order.placedDate}</span>
        </div>
      </div>

      <div className="mx-[18px] my-3 h-px bg-border-subtle" />

      <div className="px-[18px] pb-[14px] flex items-center justify-between gap-3">
        <p className="text-[11px] font-normal text-text-muted truncate flex-1">
          {order.productSummary}
        </p>
        <span className="text-[11px] font-semibold text-brand-primary shrink-0">View →</span>
      </div>
    </Link>
  );
}
