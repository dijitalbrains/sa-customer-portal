import "server-only";
import Stripe from "stripe";

let cachedClient: Stripe | null = null;

export function getStripeClient(): Stripe {
  if (cachedClient) return cachedClient;

  const isProd = process.env.NODE_ENV === "production";
  const envKey = isProd ? "STRIPE_SECRET_LIVE" : "STRIPE_SECRET_TEST";
  const apiKey = process.env[envKey];
  if (!apiKey) throw new Error(`Missing ${envKey} env var`);

  cachedClient = new Stripe(apiKey);
  return cachedClient;
}
