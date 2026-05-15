"use client";

import { useState } from "react";
import ChangeShippingDialog from "./change-shipping-address/change-shipping-dialog";

interface ShipToButtonProps {
  subscriptionItemId: number;
  currentAddressId: number;
  shipTo: string;
}

const LABEL_CLASS = "font-semibold text-[10px] uppercase text-black leading-none";
const VALUE_CLASS = "font-normal text-xs text-black leading-tight";

export default function ShipToButton({
  subscriptionItemId,
  currentAddressId,
  shipTo,
}: ShipToButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex gap-[18px] items-center cursor-pointer hover:opacity-80 transition-opacity w-full text-left"
      >
        <div className="flex-1 min-w-0 flex flex-col gap-1 items-start">
          <span className={LABEL_CLASS}>Ship To</span>
          <span className={VALUE_CLASS}>{shipTo}</span>
        </div>
        <img
          src="/assets/icons/chevron-tiny.svg"
          alt=""
          className="w-[5px] h-[9px] -scale-y-100"
        />
      </button>

      <ChangeShippingDialog
        open={open}
        onClose={() => setOpen(false)}
        subscriptionItemId={subscriptionItemId}
        currentAddressId={currentAddressId}
      />
    </>
  );
}
