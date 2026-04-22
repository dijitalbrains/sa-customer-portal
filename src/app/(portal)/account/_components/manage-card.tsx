import Link from "next/link";
import TitledCard from "./titled-card";
import { ChevronRight } from "./icons";

interface ManageCardProps {
  icon: React.ReactNode;
  title: string;
  manageLabel: string;
  manageHref: string;
  children: React.ReactNode;
}

interface ManageRowProps {
  title: string;
  description?: React.ReactNode;
  isDefault?: boolean;
}

export default function ManageCard({
  icon,
  title,
  manageLabel,
  manageHref,
  children,
}: ManageCardProps) {
  return (
    <TitledCard icon={icon} title={title}>
      <div className="flex flex-col divide-y divide-border-subtle/60">{children}</div>

      <Link
        href={manageHref}
        className="bg-[#F9FCFF] h-[52px] px-6 flex items-center gap-2 text-[13px] font-semibold text-brand-primary cursor-pointer hover:bg-[#EDF5FC] transition-colors"
      >
        {manageLabel}
        <ChevronRight className="text-brand-primary" />
      </Link>
    </TitledCard>
  );
}

export function ManageRow({ title, description, isDefault }: ManageRowProps) {
  return (
    <div className="relative px-6 py-3.5 pl-7 overflow-hidden">
      <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-brand-gradient" />
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[14px] font-semibold text-text-heading">{title}</span>
        {isDefault && (
          <span className="inline-flex items-center px-2.5 h-5 rounded-pill bg-status-success text-[9px] font-semibold text-[#27500A]">
            Default
          </span>
        )}
      </div>
      {description && (
        <div className="text-[12px] font-normal text-text-muted mt-0.5">{description}</div>
      )}
    </div>
  );
}
