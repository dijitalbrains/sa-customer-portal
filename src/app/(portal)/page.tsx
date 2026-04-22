import { getRenewals } from "@/lib/actions/renewal.actions";
import Accordion from "./_components/accordion";
import EmptyState from "@/components/ui/empty-state";

export default async function FilterRenewalsPage() {
  const orders = await getRenewals();

  if (orders.length === 0) {
    return <EmptyState title="No Subscriptions" message="You don't have any active subscriptions yet." />;
  }

  return (
    <div className="flex flex-col gap-3">
      {orders.map((order, i) => (
        <Accordion key={i} {...order} defaultOpen={i === 0} />
      ))}
    </div>
  );
}
