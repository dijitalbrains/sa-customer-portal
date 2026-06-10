import CartItemRow from "./cart-item-row";
import type { CartItem } from "@/lib/types/cart";

interface OrderGroupCardProps {
  title: string;
  items: CartItem[];
}

export default function OrderGroupCard({ title, items }: OrderGroupCardProps) {
  return (
    <section className="bg-surface-base border border-border-subtle rounded-card overflow-hidden">
      <header className="bg-[#eef6fc] px-5 py-3 flex items-center justify-between">
        <h2 className="font-semibold text-[14px] text-text-heading">Order Group — {title}</h2>
        <span className="text-[12px] text-text-muted">
          {items.length} item{items.length === 1 ? "" : "s"}
        </span>
      </header>
      <div className="divide-y divide-border-subtle">
        {items.map((item) => (
          <CartItemRow key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
