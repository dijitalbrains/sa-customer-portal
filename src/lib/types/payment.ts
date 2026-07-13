export type PaymentMethod =
  | {
      type: "card";
      brand: string;
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
