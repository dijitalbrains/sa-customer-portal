import type Stripe from "stripe";

export interface CreateCustomerInput {
  paymentMethodId: string;
  name: string;
  email: string;
}

export interface ChargeCardInput {
  customerId: string;
  paymentMethodId: string;
  amount: number;
  description: string;
}

export interface ChargeAchInput {
  customerId: string;
  paymentMethodId: string;
  amount: number;
  description: string;
}

export type StripeCustomer = Stripe.Customer;
export type StripePaymentIntent = Stripe.PaymentIntent;
export type StripePaymentMethod = Stripe.PaymentMethod;
export type StripeFinancialConnectionsSession = Stripe.FinancialConnections.Session;
