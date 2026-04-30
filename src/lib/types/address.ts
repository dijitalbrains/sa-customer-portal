export interface AddressInput {
  countryId: number;
  stateId: number;
  name: string;
  phone: string | null;
  street: string;
  apartment: string | null;
  city: string;
  zip: string;
  isDefault: boolean;
  deliveryInstructions: string | null;
}

export interface UserAddressView {
  id: number;
  name: string | null;
  phone: string | null;
  street: string;
  apartment: string | null;
  city: string;
  zip: string;
  stateId: number;
  stateName: string;
  stateAbbr: string;
  countryId: number | null;
  countryName: string | null;
  isDefault: boolean;
  deliveryInstructions: string | null;
  activeSubscriptions: number;
  formatted: string;
}
