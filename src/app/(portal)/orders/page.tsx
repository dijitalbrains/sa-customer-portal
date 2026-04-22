import { getOrders, getOrderDetail } from "@/lib/actions/order.actions";
import Card from "./_components/card";
import Invoice from "./_components/invoice";
import EmptyState from "@/components/ui/empty-state";

interface OrdersPageProps {
  searchParams: Promise<{ id?: string }>;
}

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const { id } = await searchParams;
  const orders = await getOrders();

  if (orders.length === 0) {
    return <EmptyState title="No Orders" message="You don't have any orders yet." />;
  }

  const activeId = id ? Number(id) : orders[0].id;
  const detail = await getOrderDetail(activeId);

  return (
    <div className="flex flex-col xl:flex-row gap-5 h-[calc(100vh-120px)] min-h-0">
      <div data-print-hide="" className="w-full xl:w-[480px] shrink-0 flex flex-col gap-4 min-h-0 xl:overflow-y-auto">
        <h1 className="text-[24px] font-bold text-text-heading shrink-0">Orders</h1>
        <div className="flex flex-col gap-4 xl:overflow-y-auto">
          {orders.map((order) => (
            <Card key={order.id} order={order} isActive={order.id === activeId} />
          ))}
        </div>
      </div>

      {detail && (
        <div data-print-invoice="" className="flex-1 min-w-0 min-h-0 xl:flex xl:flex-col">
          <Invoice order={detail} />
        </div>
      )}
    </div>
  );
}
