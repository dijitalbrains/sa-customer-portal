import Link from "next/link";
import Button from "@/components/ui/button";

export default function ThankYouPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center gap-5">
      <span className="w-16 h-16 rounded-full bg-[#22c55e] flex items-center justify-center">
        <img src="/assets/icons/check.svg" alt="" className="w-8 h-8" />
      </span>
      <div className="flex flex-col gap-2">
        <h1 className="text-[26px] font-bold text-text-heading">Order placed!</h1>
        <p className="text-[14px] text-text-muted max-w-[440px]">
          Thank you for your purchase. We&apos;ll send you an email confirmation shortly with the
          details of your order.
        </p>
      </div>
      <div className="flex items-center gap-3 mt-2">
        <Link href="/orders">
          <Button type="button" variant="outline" className="rounded-pill">
            View Orders
          </Button>
        </Link>
        <Link href="/">
          <Button type="button" variant="primary" className="rounded-pill">
            Back to Renewals
          </Button>
        </Link>
      </div>
    </div>
  );
}
