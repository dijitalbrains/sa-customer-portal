import "server-only";
import type {
  ChargeAchInput,
  CreateBareCustomerInput,
  StripeCustomer,
  StripeFinancialConnectionsSession,
  StripePaymentIntent,
  StripePaymentMethod,
} from "@/lib/types/stripe";
import { getStripeClient } from "./client";
import { toStripeAchError, toStripeError } from "@/lib/errors/stripe-error";

export async function createBareCustomer(input: CreateBareCustomerInput): Promise<StripeCustomer> {
  try {
    const stripe = getStripeClient();
    return await stripe.customers.create({
      name: input.name,
      email: input.email,
    });
  } catch (e) {
    throw toStripeError(e, "Failed to create Stripe customer");
  }
}

export async function createFinancialConnectionsSession(
  customerId: string,
): Promise<StripeFinancialConnectionsSession> {
  try {
    const stripe = getStripeClient();
    return await stripe.financialConnections.sessions.create({
      account_holder: { type: "customer", customer: customerId },
      permissions: ["payment_method"],
      filters: { countries: ["US"] },
    });
  } catch (e) {
    throw toStripeError(e, "Failed to create Financial Connections session");
  }
}

export async function attachAchPaymentMethod(
  paymentMethodId: string,
  customerId: string,
): Promise<StripePaymentMethod> {
  try {
    const stripe = getStripeClient();
    return await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId });
  } catch (e) {
    throw toStripeError(e, "Failed to attach payment method");
  }
}

export async function chargeAch(input: ChargeAchInput): Promise<StripePaymentIntent> {
  try {
    const stripe = getStripeClient();
    const amountCents = Math.round(input.amount * 100);

    return await stripe.paymentIntents.create({
      amount: amountCents,
      currency: "usd",
      customer: input.customerId,
      payment_method: input.paymentMethodId,
      payment_method_types: ["us_bank_account"],
      description: input.description,
      confirm: true,
      mandate_data: {
        customer_acceptance: { type: "offline" },
      },
    });
  } catch (e) {
    throw toStripeAchError(e);
  }
}
