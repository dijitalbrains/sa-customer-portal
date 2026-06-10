import type { PriceLine } from "./subscription";

export interface CartProductSnapshot {
  id: number;
  key: string;
  name: string;
  type: string | null;
  price: number;
  actualPrice: number | null;
  imageUrl: string;
}

export interface CartCurrencySnapshot {
  id: number;
  code: string;
  symbol: string;
  exchangeRate: number;
}

export interface CartCountrySnapshot {
  id: number;
  code: string;
  htsCode: string | null;
  shippingPriceSource: "FEDEX" | "TIER";
  taxSource: "FEDEX" | "STATE";
}

export interface CartAddressSnapshot {
  id: number;
  name: string | null;
  phone: string | null;
  street: string;
  apartment: string | null;
  city: string;
  zip: string;
  stateId: number;
  stateName: string | null;
  countryId: number;
  formatted: string;
  country: CartCountrySnapshot;
  currency: CartCurrencySnapshot;
}

export interface CartCardSnapshot {
  id: number;
  brand: string;
  last4: string;
  expMonth: string;
  expYear: string;
  stripePaymentMethodId: string;
}

export interface CartBankSnapshot {
  id: number;
  bankName: string;
  last4: string;
  stripePaymentMethodId: string;
}

export interface CartItem {
  id: number;
  subscriptionId: number;
  productId: number;
  product: CartProductSnapshot;
  linkedProduct: CartProductSnapshot | null;
  linkedProductQuantity: number | null;
  quantity: number;
  userAddressId: number;
  userAddress: CartAddressSnapshot;
  subscriptionNickname: string | null;
  subscriptionTechnology: string;
  subscriptionZone: number;
  isLoyaltyEnabled: boolean;
  pricingLines: PriceLine[];
  subtotal: number;
  shippingPrice: number;
  tax: number;
  taxPercent: number;
  estimatedTax: number;
  taxExempted: number | null;
  total: number;
  shippingPriceChanged: boolean;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  shippingPrice: number;
  tax: number;
  taxExempted: number | null;
  estimatedTax: number;
  ccProcessingFee: number;
  creditsUsed: number;
  total: number;
  notes: string;
  chargeFailed: boolean;
  currency: CartCurrencySnapshot | null;
  country: CartCountrySnapshot | null;
  userStripeSource: CartCardSnapshot | null;
  userBankAccount: CartBankSnapshot | null;
}

export interface AddToCartResult {
  cart: Cart;
  addedItem: CartItem;
}
