import "server-only";
import Stripe from "stripe";

const UNKNOWN_REASON_MESSAGE =
  "Payment declined by the issuing bank. Your credit card has been declined. Please check to see if you have received a security message for fraud from the card issuer that you will need to verify the charge. You also may have reached the daily limit allowed on your card. Contact your credit card issuer to get further assistance.";

const DECLINE_MESSAGES: Record<string, string> = {
  authentication_required: "The card was declined as the transaction requires authentication.",
  approve_with_id: "The payment cannot be authorized.",
  card_not_supported: "The card does not support this type of purchase.",
  card_velocity_exceeded:
    "The customer has exceeded the balance or credit limit available on their card.",
  currency_not_supported: "The card does not support the specified currency.",
  duplicate_transaction:
    "A transaction with identical amount and credit card information was submitted very recently.",
  expired_card: "The card has expired.",
  fraudulent: "The payment has been declined as Stripe suspects it is fraudulent.",
  incorrect_number: "The card number is incorrect.",
  incorrect_cvc: "The CVC number is incorrect.",
  incorrect_pin: "The PIN entered is incorrect.",
  incorrect_zip: "The ZIP/postal code is incorrect.",
  insufficient_funds: "The card has insufficient funds to complete the purchase.",
  invalid_account: "The card, or account the card is connected to, is invalid.",
  invalid_amount: "The payment amount is invalid, or exceeds the amount that is allowed.",
  invalid_cvc: "The CVC number is incorrect.",
  invalid_expiry_month: "The expiration month is invalid.",
  invalid_expiry_year: "The expiration year is invalid.",
  invalid_number: "The card number is incorrect.",
  invalid_pin: "The PIN entered is incorrect.",
  issuer_not_available:
    "The card issuer could not be reached, so the payment could not be authorized.",
  lost_card: "The payment has been declined because the card is reported lost.",
  merchant_blacklist:
    "The payment has been declined because it matches a value on the Stripe user's block list.",
  new_account_information_available:
    "The card, or account the card is connected to, is invalid.",
  not_permitted: "The payment is not permitted.",
  offline_pin_required: "The card has been declined as it requires a PIN.",
  online_or_offline_pin_required: "The card has been declined as it requires a PIN.",
  pickup_card: "The card cannot be used to make this payment.",
  pin_try_exceeded: "The allowable number of PIN tries has been exceeded.",
  processing_error: "An error occurred while processing the card.",
  restricted_card: "The card cannot be used to make this payment.",
  stolen_card: "The payment has been declined because the card is reported stolen.",
  testmode_decline: "A Stripe test card number was used.",
  withdrawal_count_limit_exceeded:
    "The customer has exceeded the balance or credit limit available on their card.",
  call_issuer: UNKNOWN_REASON_MESSAGE,
  do_not_honor: UNKNOWN_REASON_MESSAGE,
  do_not_try_again: UNKNOWN_REASON_MESSAGE,
  generic_decline: UNKNOWN_REASON_MESSAGE,
  no_action_taken: UNKNOWN_REASON_MESSAGE,
  reenter_transaction: UNKNOWN_REASON_MESSAGE,
  revocation_of_all_authorizations: UNKNOWN_REASON_MESSAGE,
  revocation_of_authorization: UNKNOWN_REASON_MESSAGE,
  security_violation: UNKNOWN_REASON_MESSAGE,
  service_not_allowed: UNKNOWN_REASON_MESSAGE,
  stop_payment_order: UNKNOWN_REASON_MESSAGE,
  transaction_not_allowed: UNKNOWN_REASON_MESSAGE,
  try_again_later: UNKNOWN_REASON_MESSAGE,
};

interface StripeErrorOptions {
  statusCode?: number;
  declineCode?: string | null;
  stripeCode?: string | null;
}

export class StripeError extends Error {
  readonly statusCode: number;
  readonly declineCode: string | null;
  readonly stripeCode: string | null;

  constructor(message: string, opts: StripeErrorOptions = {}) {
    super(message);
    this.name = "StripeError";
    this.statusCode = opts.statusCode ?? 400;
    this.declineCode = opts.declineCode ?? null;
    this.stripeCode = opts.stripeCode ?? null;
  }
}

export function toStripeCardError(err: unknown): StripeError {
  const stripeErr = asStripeError(err);
  const declineCode = stripeErr?.decline_code ?? null;
  const stripeCode = stripeErr?.code ?? null;

  const declineMessage =
    (declineCode && DECLINE_MESSAGES[declineCode]) ||
    (stripeCode && DECLINE_MESSAGES[stripeCode]) ||
    null;

  return new StripeError(declineMessage ?? stripeErr?.message ?? "Payment failed", {
    statusCode: stripeErr?.statusCode ?? 400,
    declineCode,
    stripeCode,
  });
}

export function toStripeAchError(err: unknown): StripeError {
  const stripeErr = asStripeError(err);
  return new StripeError(stripeErr?.message ?? "ACH payment failed", {
    statusCode: stripeErr?.statusCode ?? 400,
    declineCode: stripeErr?.decline_code ?? null,
    stripeCode: stripeErr?.code ?? null,
  });
}

export function toStripeError(err: unknown, fallback: string): StripeError {
  const stripeErr = asStripeError(err);
  return new StripeError(stripeErr?.message ?? fallback, {
    statusCode: stripeErr?.statusCode ?? 400,
    stripeCode: stripeErr?.code ?? null,
  });
}

type StripeRuntimeError = InstanceType<typeof Stripe.errors.StripeError>;

function asStripeError(err: unknown): StripeRuntimeError | null {
  if (
    err &&
    typeof err === "object" &&
    "type" in err &&
    typeof (err as { type: unknown }).type === "string"
  ) {
    return err as StripeRuntimeError;
  }
  return null;
}
