"use client";

import { useState } from "react";
import PaymentMethod from "@/components/shared/payment-method";
import type { PaymentMethod as PaymentMethodType } from "@/lib/types/payment";
import ChangePaymentMethodDialog from "./change-payment-method/change-payment-method-dialog";

interface PaymentMethodButtonProps {
  subscriptionItemId: number;
  currentCardId: number | null;
  currentBankId: number | null;
  payment: PaymentMethodType;
}

export default function PaymentMethodButton({
  subscriptionItemId,
  currentCardId,
  currentBankId,
  payment,
}: PaymentMethodButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex gap-[18px] items-center cursor-pointer hover:opacity-80 transition-opacity w-full text-left"
      >
        <div className="flex-1 min-w-0 flex flex-col gap-1 items-start">
          <span className="font-semibold text-[10px] uppercase text-black leading-none">Payment Method</span>
          <div className="font-normal text-xs text-black leading-tight">
            {payment ? (
              <PaymentMethod payment={payment} showStatus />
            ) : (
              <span className="text-text-muted">No payment method</span>
            )}
          </div>
        </div>
        <img
          src="/assets/icons/chevron-tiny.svg"
          alt=""
          className="w-[5px] h-[9px] -scale-y-100"
        />
      </button>

      <ChangePaymentMethodDialog
        open={open}
        onClose={() => setOpen(false)}
        subscriptionItemId={subscriptionItemId}
        currentCardId={currentCardId}
        currentBankId={currentBankId}
      />
    </>
  );
}
