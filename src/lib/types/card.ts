export type CardStatus = "GOOD" | "EXPIRING_SOON" | "EXPIRED" | "FAILED";

export interface CardPaymentMethod {
  id: number;
  brand: string;
  last4: string;
  expMonth: string;
  expYear: string;
  nameOnCard: string | null;
  hasFailed: boolean;
  isDefault: boolean;
  status: CardStatus;
  activeSubscriptions: number;
  expiredSubscriptions: number;
}
