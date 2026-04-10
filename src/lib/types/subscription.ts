/**
 * Display-ready types for filter renewal UI
 *
 * These are the shapes that components consume — already transformed
 * from raw DB data by the subscription service.
 */

export interface SubscriptionItemView {
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
}

export interface SubscriptionView {
  title: string;
  isLoyaltyEnabled: boolean;
  hasPendingInstall: boolean;
  subscriptionItems: SubscriptionItemView[];
}

export interface OrderView {
  orderNumber: string;
  placedDate: string;
  subscriptions: SubscriptionView[];
}
