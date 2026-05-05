import { getPaymentMethods } from "@/lib/actions/payment.actions";
import PaymentsPage from "./_components/payments-page";

export default async function ManagePaymentsPage() {
  const methods = await getPaymentMethods();
  return <PaymentsPage methods={methods} />;
}
