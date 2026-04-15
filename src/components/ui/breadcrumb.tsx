import Link from "next/link";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex items-center flex-wrap gap-x-2 gap-y-1 text-[12px] font-medium">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={i} className="flex items-center gap-2">
              {item.href && !isLast ? (
                <Link href={item.href} className="text-brand-primary hover:underline transition-colors cursor-pointer">
                  {item.label}
                </Link>
              ) : (
                <span className={isLast ? "text-text-heading" : "text-text-muted"}>
                  {item.label}
                </span>
              )}
              {!isLast && <img src="/assets/icons/chevron-collapsed.svg" alt="" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
