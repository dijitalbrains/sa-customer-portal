import Link from "next/link";

interface SettingRowProps {
  label: string;
  value: string;
  href?: string;
  onClick?: () => void;
}

const ROW_CLASS =
  "flex items-center justify-between gap-3 px-4 py-3 rounded-[8px] bg-surface-raised border border-border-subtle shadow-card hover:shadow-button transition-shadow w-full cursor-pointer";

export default function SettingRow({ label, value, href, onClick }: SettingRowProps) {
  const interactive = Boolean(href || onClick);
  const content = (
    <>
      <div className="flex items-center gap-8 min-w-0">
        <span className="text-[12px] font-normal capitalize text-text-muted shrink-0">
          {label}
        </span>
        <span className="text-[13px] font-medium text-text-primary truncate">{value}</span>
      </div>
      {interactive && (
        <img src="/assets/icons/chevron-collapsed.svg" alt="" className="shrink-0" />
      )}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={ROW_CLASS}>
        {content}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`${ROW_CLASS} text-left`}>
        {content}
      </button>
    );
  }

  return <div className={ROW_CLASS}>{content}</div>;
}
