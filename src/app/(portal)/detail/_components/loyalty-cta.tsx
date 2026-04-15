import Link from "next/link";

interface LoyaltyCtaProps {
  subscriptionId: number;
}

export default function LoyaltyCta({ subscriptionId }: LoyaltyCtaProps) {
  return (
    <Link
      href={`/loyalty/${subscriptionId}`}
      className="flex items-center justify-between w-full px-4 py-3 rounded-lg bg-brand-credits shadow-card hover:shadow-button transition-shadow cursor-pointer"
    >
      <span className="text-[12px] font-medium text-text-primary flex items-center gap-2">
        <span aria-hidden="true">💙</span>
        Want to save on all renewals? Join the loyalty program
      </span>
      <img src="/assets/icons/chevron-collapsed.svg" alt="" />
    </Link>
  );
}
