export type ValidityType = "MONTHS" | "WEEKS";

export interface PreferencesPayload {
  itemId: number;
  unusedItems: number;
  validityType: ValidityType;
  validityValue: number;
  quantity: number;
  upcomingReminder: string;
}
