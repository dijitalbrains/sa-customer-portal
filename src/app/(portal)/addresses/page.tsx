import { getAddresses, getCountries } from "@/lib/actions/address.actions";
import AddressList from "@/components/shared/addresses/address-list";

export default async function AddressesPage() {
  const [addresses, countries] = await Promise.all([getAddresses(), getCountries()]);
  return <AddressList addresses={addresses} countries={countries} />;
}
