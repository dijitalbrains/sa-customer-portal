export type PaymentMethod =
  | {
      type: "card";
      brandImage: string;
      last4: string;
      statusText: string;
      isFailed: boolean;
      isExpiringSoon: boolean;
    }
  | {
      type: "bank";
      bankName: string;
      last4: string;
    }
  | null;

export interface SubscriptionItem {
  detailUrl: string;
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

export interface Subscription {
  title: string;
  isLoyaltyEnabled: boolean;
  hasPendingInstall: boolean;
  subscriptionItems: SubscriptionItem[];
}

export interface Order {
  placedDate: string;
  hasExpiredItem: boolean;
  hasFailedCard: boolean;
  subscriptions: Subscription[];
}
