import type { CountryOption } from "@/lib/types/reference";

export interface ZoneSubscriptionData {
  countryId: number;
  stateId: number | null;
  city: string;
  zip: string;
  householdSize: number;
  isWellWater: boolean;
  hasFiltrationSystem: boolean;
  hasMicronSystem: boolean;
}

export interface ZoneFormInput {
  subscriptionId: number;
  countryId: number;
  stateId: number | null;
  city: string;
  zip: string;
  householdSize: number;
  isWellWater: boolean;
  hasFiltrationSystem: boolean;
  hasMicronSystem: boolean;
}

export interface ProductRef {
  id: number;
  key: string;
  name: string;
  price: number;
}

export interface SubscriptionItemSnapshot {
  id: number;
  product: ProductRef;
  quantity: number;
  validityType: "MONTHS" | "WEEKS";
  validityValue: number;
  linkedProduct: ProductRef | null;
}

export interface SubscriptionSnapshot {
  id: number;
  zone: number;
  countryId: number | null;
  stateId: number | null;
  city: string;
  zip: string;
  householdSize: number;
  isWellWater: boolean | null;
  hasFiltrationSystem: boolean | null;
  hasMicronSystem: boolean | null;
  items: SubscriptionItemSnapshot[];
}

export interface EditZoneData {
  subscription: SubscriptionSnapshot;
  p1Filter: ProductRef | null;
  countries: CountryOption[];
}

export interface ZoneChangesResult {
  zone: number;
  p1ValidityMonths: number | null;
  linkedProduct: ProductRef | null;
}
