import { getAuth } from "@/lib/auth";
import { loadCart } from "@/lib/services/cart-service";
import { getCreditBalance } from "@/lib/services/user-credits-service";
import type { Cart, CartItem } from "@/lib/types/cart";
import EmptyCart from "./_components/empty-cart";
import OrderGroupCard from "./_components/order-group-card";
import OrderSummary from "./_components/order-summary";

interface OrderGroup {
  title: string;
  items: CartItem[];
}

export default async function CartPage() {
  const { userId } = await getAuth();
  const [cart, creditBalance] = await Promise.all([
    loadCart(userId),
    getCreditBalance(userId),
  ]);

  if (!cart || cart.items.length === 0) {
    return <EmptyCart />;
  }

  const groups = groupItemsBySubscription(cart);
  const exchangedCreditBalance = creditBalance * (cart.currency?.exchangeRate ?? 1);

  return (
    <div className="flex flex-col gap-3">
      <header className="flex flex-col gap-0.5">
        <h1 className="text-[22px] font-bold text-text-heading leading-tight">My Cart</h1>
        <p className="text-[12px] text-text-muted">
          {cart.items.length} item{cart.items.length === 1 ? "" : "s"} ready for checkout
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4 items-start">
        <div className="flex flex-col gap-4 min-w-0">
          {groups.map((group, index) => (
            <OrderGroupCard key={index} title={group.title} items={group.items} />
          ))}
        </div>
        <OrderSummary cart={cart} creditBalance={exchangedCreditBalance} />
      </div>
    </div>
  );
}

function groupItemsBySubscription(cart: Cart): OrderGroup[] {
  const map = new Map<number, OrderGroup>();
  for (const item of cart.items) {
    const title = item.subscriptionNickname ?? item.subscriptionTechnology;
    const existing = map.get(item.subscriptionId);
    if (existing) {
      existing.items.push(item);
    } else {
      map.set(item.subscriptionId, { title, items: [item] });
    }
  }
  return Array.from(map.values());
}
