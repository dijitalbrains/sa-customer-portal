"use client";

import { useTransition } from "react";
import { toast } from "react-toastify";
import {
  loadStripe,
  type CreatePaymentMethodData,
  type Stripe,
} from "@stripe/stripe-js";
import {
  addBankPaymentMethod,
  getAchSessionContext,
} from "@/lib/actions/payment.actions";
import type { BankInput, BankPaymentMethod } from "@/lib/types/bank";

interface LinkBankButtonProps {
  submit?: (input: BankInput) => Promise<BankPaymentMethod>;
  onLinked?: (bank: BankPaymentMethod) => void;
  label?: string;
  className?: string;
}

const PUBLISHABLE_KEY =
  process.env.NODE_ENV === "production"
    ? process.env.NEXT_PUBLIC_STRIPE_KEY_LIVE
    : process.env.NEXT_PUBLIC_STRIPE_KEY_TEST;

let stripePromise: Promise<Stripe | null> | null = null;
function getStripe(): Promise<Stripe | null> | null {
  if (!PUBLISHABLE_KEY) return null;
  if (!stripePromise) stripePromise = loadStripe(PUBLISHABLE_KEY);
  return stripePromise;
}

const DEFAULT_CLASS =
  "h-10 px-5 rounded-pill bg-brand-gradient text-white text-sm font-semibold shadow-[0px_6px_18px_0px_rgba(55,146,222,0.35)] hover:opacity-95 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed";

export default function LinkBankButton({
  submit = addBankPaymentMethod,
  onLinked,
  label = "Link Bank Transfer (ACH)",
  className,
}: LinkBankButtonProps) {
  const [busy, startBusy] = useTransition();

  const handleClick = () => {
    if (busy) return;
    startBusy(async () => {
      try {
        const stripe = await getStripe();
        if (!stripe) throw new Error("Stripe is not configured");

        const { clientSecret, name, email } = await getAchSessionContext();

        const collectResult = await stripe.collectFinancialConnectionsAccounts({
          clientSecret,
        });
        if (collectResult.error) {
          throw new Error(collectResult.error.message ?? "Failed to link bank account");
        }
        const linked = collectResult.financialConnectionsSession?.accounts?.[0];
        if (!linked) {
          throw new Error("No bank account was linked. Please try again.");
        }

        const pmResult = await stripe.createPaymentMethod({
          type: "us_bank_account",
          us_bank_account: { financial_connections_account: linked.id },
          billing_details: { name, email },
        } as unknown as CreatePaymentMethodData);
        if (pmResult.error) {
          throw new Error(pmResult.error.message ?? "Failed to create payment method");
        }

        const pm = pmResult.paymentMethod;
        const usBank = pm.us_bank_account;
        
        const bank = await submit({
          paymentMethodId: pm.id,
          bankName: linked.institution_name ?? usBank?.bank_name ?? null,
          last4: linked.last4 ?? usBank?.last4 ?? null,
          accountHolderType: usBank?.account_holder_type ?? null,
          isDefault: false,
        });

        toast.success("Bank account linked");
        onLinked?.(bank);
      } catch (e) {
        const message = e instanceof Error ? e.message : "Failed to link bank account";
        toast.error(message);
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      className={className ?? DEFAULT_CLASS}
    >
      <span className="text-base leading-none">+</span>
      {busy ? "Linking…" : label}
    </button>
  );
}
