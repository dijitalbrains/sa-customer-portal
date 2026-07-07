export type InfoSheetStatus = "ACTIVE" | "EXPIRED" | "PENDING";

export interface InfoSheetRenewalItem {
  name: string;
  cycle: string | null;
  nextDate: string | null;
  status: InfoSheetStatus;
  address: string | null;
}

export interface InfoSheetProductSection {
  name: string;
  zone: number;
  zoneFilterDesc: string | null;
  address: string | null;
  nickname: string | null;
  renewalItems: InfoSheetRenewalItem[];
}

export interface InfoSheet {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  productSections: InfoSheetProductSection[];
  portalUrl: string;
  productSupportUrl: string;
  customerServiceUrl: string;
  emergencyPhone: string;
  generatedDate: string;
}
