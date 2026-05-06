"use client";

import { useMemo, type ReactNode } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe, type Stripe } from "@stripe/stripe-js";

interface StripeProviderProps {
  children: ReactNode;
}

const IS_PROD = process.env.NODE_ENV === "production";
const ENV_KEY = IS_PROD ? "NEXT_PUBLIC_STRIPE_KEY_LIVE" : "NEXT_PUBLIC_STRIPE_KEY_TEST";
const PUBLISHABLE_KEY = IS_PROD
  ? process.env.NEXT_PUBLIC_STRIPE_KEY_LIVE
  : process.env.NEXT_PUBLIC_STRIPE_KEY_TEST;

let stripePromise: Promise<Stripe | null> | null = null;

function getStripePromise(): Promise<Stripe | null> | null {
  if (!PUBLISHABLE_KEY) return null;
  if (!stripePromise) stripePromise = loadStripe(PUBLISHABLE_KEY);
  return stripePromise;
}

export default function StripeProvider({ children }: StripeProviderProps) {
  const promise = useMemo(() => getStripePromise(), []);

  if (!promise) {
    return (
      <div className="text-[12px] text-status-error-text">
        Missing Stripe publishable key. Set {ENV_KEY} in your env.
      </div>
    );
  }

  return <Elements stripe={promise}>{children}</Elements>;
}
