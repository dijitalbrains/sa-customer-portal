export interface Address {
  street: string;
  apartment?: string | null;
  city: string;
  zip: string;
  states?: { abbr: string } | null;
  state?: { abbr?: string } | null;
}

export function formatAddress(address: Address | null): string {
  if (!address) return "—";
  const abbr = address.states?.abbr ?? address.state?.abbr ?? "";
  const parts = [address.street];
  if (address.apartment) parts.push(address.apartment);
  parts.push(`${address.city}, ${abbr} ${address.zip}`);
  return parts.join(" ");
}
