import Link from "next/link";

export type PageKey =
  | "filter-renewals"
  | "renewal-detail"
  | "orders"
  | "order-detail"
  | "account"
  | "support"
  | "shipping-addresses";

interface BreadcrumbStep {
  label: string;
  href: string;
}

const PARENTS: Record<PageKey, BreadcrumbStep[]> = {
  "filter-renewals": [],
  "renewal-detail": [{ label: "Filter Renewals", href: "/" }],
  "orders": [],
  "order-detail": [{ label: "Orders", href: "/orders" }],
  "account": [],
  "support": [],
  "shipping-addresses": [{ label: "My Account", href: "/account" }],
};

interface BreadcrumbProps {
  page: PageKey;
  current: string;
}

export default function Breadcrumb({ page, current }: BreadcrumbProps) {
  const steps = PARENTS[page];

  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex items-center flex-wrap gap-x-2 gap-y-1 text-xs font-medium">
        {steps.map((step) => (
          <li key={step.href} className="flex items-center gap-2">
            <Link
              href={step.href}
              className="text-brand-primary hover:underline transition-colors cursor-pointer"
            >
              {step.label}
            </Link>
            <img src="/assets/icons/chevron-collapsed.svg" alt="" />
          </li>
        ))}
        <li className="text-text-heading">{current}</li>
      </ol>
    </nav>
  );
}
