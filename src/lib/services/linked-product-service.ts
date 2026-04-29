import "server-only";

const RENEWAL_FILTER_KEY_BY_SYSTEM: Record<string, string> = {
  "ultimate-system": "ultimate-renewal-filters",
  "wet7-rejuvenator": "rejuvenator-renewal-filters",
  "rv-system": "rv-renewal-filters",
  "wet6-system": "wet6-renewal-filters",
  "wet5-system": "wet5-renewal-filters",
};

/** Port of RenewalsController::getLinkedProductKey */
export function getLinkedProductKey(waterSystemKey: string, zone: number): string | null {
  if (waterSystemKey === "ultimate-system" && ![0, 1, 2].includes(zone)) {
    return zone === 3 || zone === 4 ? "p2-p3-filters" : "p2-p3-p3-p4-filters";
  }
  if (waterSystemKey === "rv-system" && zone === 0) return "p1-filter";
  if (waterSystemKey === "rv-system" && ![0, 1, 2, 3].includes(zone)) {
    return zone === 4 ? "p3-filter" : "p3-p4-filters";
  }
  if (waterSystemKey === "wet5-system" && ![0, 1, 2].includes(zone)) {
    return zone === 3 || zone === 4 ? "p3-filter" : "p3-p4-filters";
  }
  if (waterSystemKey === "wet6-system" && zone === 5) return "p4-filter";
  return null;
}

export function getRenewalFilterKey(waterSystemKey: string): string | null {
  return RENEWAL_FILTER_KEY_BY_SYSTEM[waterSystemKey] ?? null;
}
