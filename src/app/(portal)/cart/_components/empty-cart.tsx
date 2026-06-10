import Link from "next/link";

export default function EmptyCart() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center gap-4">
      <img src="/assets/icons/cart.svg" alt="" className="w-12 h-12 opacity-40" />
      <h2 className="text-[18px] font-bold text-text-heading">Your cart is empty</h2>
      <p className="text-[13px] text-text-muted max-w-[320px]">
        Add an item from any subscription using the &quot;Need this item right now?&quot; link.
      </p>
      <Link
        href="/"
        className="inline-flex items-center px-5 h-10 rounded-pill bg-brand-gradient text-white text-[13px] font-semibold hover:opacity-90 cursor-pointer"
      >
        Browse Subscriptions
      </Link>
    </div>
  );
}
