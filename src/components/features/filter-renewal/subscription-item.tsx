import Button from "@/components/ui/button";
import RenewalCard from "./renewal-card";
import type { RenewalCardProps } from "./renewal-card";

/* eslint-disable @next/next/no-img-element */

export interface SubscriptionItemProps {
  iconSrc: string;
  title: string;
  filters: RenewalCardProps[];
}

export default function SubscriptionItem({ iconSrc, title, filters }: SubscriptionItemProps) {
  return (
    <div className="bg-surface-base rounded-lg shadow-card p-3 px-5 md:py-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 gap-4">
        <div className="flex items-center gap-4 md:gap-6 min-w-0">
          <div className="w-12 h-12 md:w-16 md:h-16 rounded-[20px] md:rounded-[24px] bg-brand-primary/10 flex items-center justify-center shrink-0">
            <img src={iconSrc} alt="" className="w-6 h-7 md:w-7 md:h-8" />
          </div>
          <h2 className="text-lg md:text-2xl font-bold text-text-heading truncate">{title}</h2>
        </div>
        <Button variant="outline" size="sm">
          Pause Subscription
        </Button>
      </div>

      {/* Filter Cards */}
      <div className="flex flex-col lg:flex-row gap-4 md:gap-6">
        {filters.map((filter, i) => (
          <RenewalCard key={i} {...filter} />
        ))}
      </div>
    </div>
  );
}
