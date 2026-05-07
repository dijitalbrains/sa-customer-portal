export type BankStatus = "GOOD" | "FAILED";

export interface BankPaymentMethod {
  id: number;
  bankName: string | null;
  last4: string | null;
  accountHolderType: string | null;
  hasFailed: boolean;
  isDefault: boolean;
  status: BankStatus;
  activeSubscriptions: number;
}

export interface BankInput {
  paymentMethodId: string;
  bankName: string | null;
  last4: string | null;
  accountHolderType: string | null;
  isDefault: boolean;
}

export interface AchSessionContext {
  clientSecret: string;
  name: string;
  email: string;
}
