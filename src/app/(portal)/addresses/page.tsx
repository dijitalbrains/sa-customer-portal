import { getAddresses, getCountries } from "@/lib/actions/address.actions";
import AddressList from "./_components/address-list";

export default async function AddressesPage() {
  const [addresses, countries] = await Promise.all([getAddresses(), getCountries()]);
  return <AddressList addresses={addresses} countries={countries} />;
}
