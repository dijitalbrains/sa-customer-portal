import type { PaymentMethod } from "./payment";
import type { TaxSource } from "@/lib/utils/tax";

export type { PaymentMethod };

export interface PriceLine {
  label: string;
  amount: number;
  originalAmount?: number | null;
}

export interface LinkedProductOption {
  id: number | null;
  key: string | null;
  name: string;
  price: number;
}

export interface RenewalListItem {
  id: number;
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

export interface RenewalSubscription {
  id: number;
  nickname: string;
  technology: string;
  zone: number;
  isLoyaltyEnabled: boolean;
  isShowerFilter: boolean;
  canAddP1Filter: boolean;
  productKey: string;
  countryId: number | null;
  stateId: number | null;
  city: string;
  zip: string;
  householdSize: number;
  isWellWater: boolean | null;
  hasFiltrationSystem: boolean | null;
  hasMicronSystem: boolean | null;
}

export interface RenewalItem {
  id: number;
  productName: string;
  productKey: string;
  productImage: string;
  productType: string;
  status: "active" | "expired" | "pending";
  isPending: boolean;
  isP1Filter: boolean;
  validityType: "MONTHS" | "WEEKS";
  validityValue: number;
  endsAt: string | null;
  upcomingReminder: string | null;
  nextReminderDate: string;
  shipTo: string;
  userAddressId: number | null;
  payment: PaymentMethod;
  quantity: number;
  linkedProductName: string | null;
  linkedProductPrice: number | null;
  linkedProductQuantity: number | null;

  pricingLines: PriceLine[];
  subTotal: number;
  shipping: number;
  taxPercent: number;
  tax: number;
  estimatedTax: number;
  taxExempted: number | null;
  taxSource: TaxSource | null;
  total: number;

  subscription: RenewalSubscription;
}

export interface RenewalDetailResponse {
  subscriptionItems: RenewalItem[];
  subscriptionFlash: boolean;
  availableLinkedProducts: LinkedProductOption[];
}
