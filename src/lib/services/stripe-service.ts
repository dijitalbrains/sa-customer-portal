import "server-only";
import type {
  ChargeCardInput,
  CreateCustomerInput,
  StripeCustomer,
  StripePaymentIntent,
  StripePaymentMethod,
} from "@/lib/types/stripe";
import { getStripeClient } from "./stripe-client";
import { toStripeCardError, toStripeError } from "@/lib/errors/stripe-error";

export async function createCustomer(input: CreateCustomerInput): Promise<StripeCustomer> {
  try {
    const stripe = getStripeClient();
    return await stripe.customers.create({
      name: input.name,
      email: input.email,
      payment_method: input.paymentMethodId,
      invoice_settings: { default_payment_method: input.paymentMethodId },
    });
  } catch (e) {
    throw toStripeCardError(e);
  }
}

export async function attachCardPaymentMethod(
  customerId: string,
  paymentMethodId: string,
): Promise<StripePaymentMethod> {
  try {
    const stripe = getStripeClient();
    return await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId });
  } catch (e) {
    throw toStripeCardError(e);
  }
}

export async function detachCardPaymentMethod(
  paymentMethodId: string,
): Promise<StripePaymentMethod> {
  try {
    const stripe = getStripeClient();
    return await stripe.paymentMethods.detach(paymentMethodId);
  } catch (e) {
    throw toStripeError(e, "Failed to detach payment method");
  }
}

export async function updateCardExpiry(
  paymentMethodId: string,
  expMonth: number,
  expYear: number,
): Promise<StripePaymentMethod> {
  try {
    const stripe = getStripeClient();
    return await stripe.paymentMethods.update(paymentMethodId, {
      card: { exp_month: expMonth, exp_year: expYear },
    });
  } catch (e) {
    throw toStripeCardError(e);
  }
}

export async function chargeCard(input: ChargeCardInput): Promise<StripePaymentIntent> {
  try {
    const stripe = getStripeClient();
    const amountCents = Math.round(input.amount * 100);

    return await stripe.paymentIntents.create({
      amount: amountCents,
      currency: "usd",
      customer: input.customerId,
      payment_method: input.paymentMethodId,
      payment_method_types: ["card"],
      description: input.description,
      confirm: true,
      off_session: true,
    });
  } catch (e) {
    // TODO: legacy also wrote { charge_failed: true } into Session::cart on failure;
    // skipped here because the new portal has no session cart.
    throw toStripeCardError(e);
  }
}
