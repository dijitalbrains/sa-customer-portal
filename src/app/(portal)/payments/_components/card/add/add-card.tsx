"use client";

import { useEffect, useState, useTransition } from "react";
import { CardElement, useElements, useStripe } from "@stripe/react-stripe-js";
import InputField from "@/components/ui/input-field";
import StripeProvider from "@/components/providers/stripe-provider";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { getCardFormContext } from "@/lib/actions/payment.actions";
import type { CardFormContext, CardInput, CardPaymentMethod } from "@/lib/types/card";

export interface AddCardState {
  ready: boolean;
  submitting: boolean;
}

interface AddCardProps {
  formId: string;
  submit: (input: CardInput) => Promise<CardPaymentMethod>;
  onSuccess: (card: CardPaymentMethod) => void;
  onStateChange?: (state: AddCardState) => void;
  showSetAsDefault?: boolean;
}

export default function AddCard(props: AddCardProps) {
  const [context, setContext] = useState<CardFormContext | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getCardFormContext()
      .then((c) => {
        if (!cancelled) setContext(c);
      })
      .catch((e) => {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : "Failed to load card form");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loadError) {
    return <div className="text-[12px] text-status-error-text">{loadError}</div>;
  }
  if (!context) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <StripeProvider>
      <AddCardFields {...props} context={context} />
    </StripeProvider>
  );
}

interface AddCardFieldsProps extends AddCardProps {
  context: CardFormContext;
}

const CARD_OPTIONS = {
  hidePostalCode: true,
  style: {
    base: {
      color: "#111",
      lineHeight: "20px",
      fontSize: "14px",
      fontWeight: "normal",
      fontFamily: "inherit",
      fontSmoothing: "antialiased",
      "::placeholder": { color: "#aab7c4" },
    },
    invalid: { color: "#fa755a", iconColor: "#fa755a" },
  },
};

function AddCardFields({
  formId,
  context,
  submit,
  onSuccess,
  onStateChange,
  showSetAsDefault = true,
}: AddCardFieldsProps) {
  const stripe = useStripe();
  const elements = useElements();

  const [nameOnCard, setNameOnCard] = useState("");
  const [useAccountName, setUseAccountName] = useState(false);
  const [isDefault, setIsDefault] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, startSubmit] = useTransition();

  const ready = Boolean(stripe && elements);

  useEffect(() => {
    onStateChange?.({ ready, submitting });
  }, [ready, submitting, onStateChange]);

  const handleNameChange = (value: string) => {
    setUseAccountName(false);
    setNameOnCard(value);
  };

  const handleUseAccountNameChange = (checked: boolean) => {
    setUseAccountName(checked);
    setNameOnCard(checked ? context.name : "");
  };

  const handleSubmit = () => {
    setError(null);

    if (!stripe || !elements) {
      setError("Stripe is still loading. Please try again.");
      return;
    }
    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setError("Card field not ready. Please try again.");
      return;
    }
    if (!nameOnCard.trim()) {
      setError("Please enter the name on the card.");
      return;
    }

    startSubmit(async () => {
      const pmResult = await stripe.createPaymentMethod({
        type: "card",
        card: cardElement,
        billing_details: { name: nameOnCard.trim(), email: context.email },
      });

      if (pmResult.error) {
        setError(pmResult.error.message ?? "Card validation failed");
        return;
      }

      const pm = pmResult.paymentMethod;
      const card = pm.card;
      if (!card) {
        setError("Stripe did not return card details. Please try again.");
        return;
      }

      try {
        const created = await submit({
          paymentMethodId: pm.id,
          brand: card.brand,
          last4: card.last4,
          expMonth: String(card.exp_month),
          expYear: String(card.exp_year),
          nameOnCard: nameOnCard.trim(),
          isDefault,
        });
        onSuccess(created);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to save card");
      }
    });
  };

  return (
    <form
      id={formId}
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
      className="flex flex-col gap-3"
    >
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={useAccountName}
          onChange={(e) => handleUseAccountNameChange(e.target.checked)}
          className="w-4 h-4 cursor-pointer"
        />
        <span className="text-[13px] text-text-primary">Use name on account</span>
      </label>

      <InputField
        label="Name on card"
        value={nameOnCard}
        onChange={handleNameChange}
        placeholder="Name on card"
      />

      <div className="flex flex-col gap-1.5 w-full">
        <span className="text-[12px] font-semibold text-text-heading">Card details</span>
        <div className="px-3 py-2.5 rounded-[8px] bg-white border border-border-subtle focus-within:border-brand-primary">
          <CardElement options={CARD_OPTIONS} />
        </div>
      </div>

      {showSetAsDefault && (
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isDefault}
            onChange={(e) => setIsDefault(e.target.checked)}
            className="w-4 h-4 cursor-pointer"
          />
          <span className="text-[13px] text-text-primary">
            Set as default payment method
          </span>
        </label>
      )}

      {error && (
        <div className="text-[12px] text-status-error-text bg-[#FCEBEB] border border-[#791F1F40] rounded-[8px] px-3 py-2">
          {error}
        </div>
      )}
    </form>
  );
}
