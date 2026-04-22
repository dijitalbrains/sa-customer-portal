import type { PaymentMethod } from "./payment";

export interface UserAccount {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  initials: string;
  fullName: string;
}

export interface Address {
  formatted: string;
  isDefault: boolean;
}

export interface Payment {
  payment: PaymentMethod;
  isDefault: boolean;
}

export interface AccountSummary {
  user: UserAccount;
  addressCount: number;
  address: Address | null;
  cardCount: number;
  card: Payment;
  bankCount: number;
  bank: Payment;
  subscriptionCount: number;
}
