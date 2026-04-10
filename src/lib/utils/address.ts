/**
 * Address formatting helpers
 */

export interface AddressLike {
  street: string;
  apartment?: string | null;
  city: string;
  zip: string;
  states: { abbr: string };
}

export function formatAddress(address: AddressLike | null): string {
  if (!address) return "—";
  const parts = [address.street];
  if (address.apartment) parts.push(address.apartment);
  parts.push(`${address.city}, ${address.states.abbr} ${address.zip}`);
  return parts.join(" ");
}
