import Link from "next/link";
import PaymentMethodCmp from "@/components/shared/payment-method";
import type { PaymentMethod } from "@/lib/types/subscription";

interface PaymentMethodRowProps {
  payment: PaymentMethod;
  href: string;
}

export default function PaymentMethodRow({ payment, href }: PaymentMethodRowProps) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-3 px-4 py-3 rounded-[8px] bg-surface-raised border border-border-subtle shadow-card hover:shadow-button transition-shadow w-full cursor-pointer"
    >
      <div className="flex items-center gap-8 min-w-0">
        <span className="text-[12px] font-normal capitalize text-text-muted shrink-0">
          Payment Method
        </span>
        {payment ? (
          <PaymentMethodCmp payment={payment} />
        ) : (
          <span className="text-[13px] font-medium text-text-muted">No payment method</span>
        )}
      </div>
    </Link>
  );
}
