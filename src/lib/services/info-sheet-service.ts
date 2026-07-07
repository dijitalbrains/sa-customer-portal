import "server-only";
import { formatShortDate } from "@/lib/utils/date";
import { saApiFetch } from "@/lib/sa-api";
import type {
  InfoSheet,
  InfoSheetProductSection,
  InfoSheetRenewalItem,
  InfoSheetStatus,
} from "@/lib/types/info-sheet";

interface RenewalItem {
  name: string;
  cycle: string | null;
  next_date: string | null;
  status: string;
  address: string | null;
}

interface ProductSection {
  name: string;
  zone: number;
  zone_filter_desc: string | null;
  address: string | null;
  nickname: string | null;
  renewal_items: RenewalItem[];
}

interface InfoSheetResponse {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address: string;
  product_sections: ProductSection[];
  portal_url: string;
  product_support_url: string;
  customer_service_url: string;
  emergency_phone: string;
}

export async function getInfoSheet(userId: number): Promise<InfoSheet> {
  const response = await saApiFetch(`customer-info-sheet?user_id=${userId}`);
  if (!response.ok) {
    throw new Error(`Info sheet request failed (${response.status})`);
  }
  return toInfoSheet((await response.json()) as InfoSheetResponse);
}

export async function sendInfoSheetEmail(userId: number): Promise<boolean> {
  const response = await saApiFetch("customer-info-sheet/send-email", {
    method: "POST",
    body: JSON.stringify({ user_id: userId }),
  });
  return response.ok;
}

function toInfoSheet(response: InfoSheetResponse): InfoSheet {
  return {
    customerName: response.customer_name,
    customerEmail: response.customer_email,
    customerPhone: response.customer_phone,
    customerAddress: response.customer_address,
    productSections: response.product_sections.map(toInfoSheetProductSection),
    portalUrl: response.portal_url,
    productSupportUrl: response.product_support_url,
    customerServiceUrl: response.customer_service_url,
    emergencyPhone: response.emergency_phone,
    generatedDate: formatShortDate(new Date()),
  };
}

function toInfoSheetProductSection(
  section: ProductSection,
): InfoSheetProductSection {
  return {
    name: section.name,
    zone: section.zone,
    zoneFilterDesc: section.zone_filter_desc,
    address: section.address,
    nickname: section.nickname,
    renewalItems: section.renewal_items.map(toInfoSheetRenewalItem),
  };
}

function toInfoSheetRenewalItem(item: RenewalItem): InfoSheetRenewalItem {
  return {
    name: item.name,
    cycle: item.cycle,
    nextDate: formatRenewalDate(item.next_date),
    status: toInfoSheetStatus(item.status),
    address: item.address,
  };
}

function formatRenewalDate(value: string | null): string | null {
  if (!value) return null;
  const [month, day, year] = value.split("/").map(Number);
  if (!month || !day || !year) return null;
  return formatShortDate(new Date(Date.UTC(year, month - 1, day)));
}

function toInfoSheetStatus(status: string): InfoSheetStatus {
  if (status === "ACTIVE" || status === "EXPIRED" || status === "PENDING") {
    return status;
  }
  return "PENDING";
}
