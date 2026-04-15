import { getRenewals } from "@/lib/actions/renewal.actions";
import Accordion from "./_components/accordion";

export default async function FilterRenewalsPage() {
  const orders = await getRenewals();

  if (orders.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="flex flex-col gap-3">
      {orders.map((order, i) => (
        <Accordion key={i} {...order} defaultOpen={i === 0} />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
      <h2 className="text-2xl font-bold text-text-heading mb-2">No Subscriptions</h2>
      <p className="text-sm text-text-muted">
        You don&apos;t have any active subscriptions yet.
      </p>
    </div>
  );
}
