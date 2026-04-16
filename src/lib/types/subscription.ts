import type { PaymentMethod } from "./payment";

export type { PaymentMethod };

export interface PriceLine {
  label: string;
  amount: number;
}

export interface LinkedProductOption {
  id: number | null;
  key: string | null;
  name: string;
  price: number;
}

export interface RenewalListItem {
  subscriptionId: number;
  productName: string;
  nickname: string;
  price: string;
  status: "active" | "expired";
  frequency: string;
  remaining: string | null;
  nextDate: string;
  shipTo: string;
  isLoyaltyEnabled: boolean;
  productType: string;
  progress: number;
  payment: PaymentMethod;
}

export interface RenewalListGroup {
  title: string;
  isLoyaltyEnabled: boolean;
  hasPendingInstall: boolean;
  subscriptionItems: RenewalListItem[];
}

export interface RenewalOrder {
  placedDate: string;
  hasExpiredItem: boolean;
  hasFailedCard: boolean;
  subscriptions: RenewalListGroup[];
}

export interface RenewalItem {
  id: number;
  productName: string;
  productType: string;
  technology: string;
  zone: number;
  status: "active" | "expired" | "pending";
  isPending: boolean;
  nextReminderDate: string;
  shipTo: string;
  pricingLines: PriceLine[];
  subTotal: number;
  shipping: number;
  taxPercent: number;
  tax: number;
  total: number;
  isP1Filter: boolean;
  payment: PaymentMethod;
  quantity: number;
  linkedProductName: string | null;
  linkedProductPrice: number | null;
  linkedProductQuantity: number | null;
}

export interface SubscriptionDetail {
  id: number;
  technology: string;
  nickname: string;
  zone: number;
  isLoyaltyEnabled: boolean;
  canAddP1Filter: boolean;
  isShowerFilter: boolean;
  availableLinkedProducts: LinkedProductOption[];
  items: RenewalItem[];
}
