import { OrderAccordion } from "@/components/features/filter-renewal";
import { orderData } from "@/data/orders";

export default function FilterRenewalsPage() {
  return (
    <div className="flex flex-col gap-4">
      {orderData.map((order, i) => (
        <OrderAccordion key={i} {...order} defaultOpen />
      ))}
    </div>
  );
}
