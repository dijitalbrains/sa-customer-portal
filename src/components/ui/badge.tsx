type BadgeStatus = "active" | "paused" | "expired" | "pending" | "complete" | "scheduled" | "inactive";

const statusStyles: Record<BadgeStatus, string> = {
  active: "bg-status-active text-status-active-text",
  paused: "bg-status-paused text-brand-primary",
  inactive: "bg-status-error text-status-error-text",
  expired: "bg-status-error text-status-error-text",
  pending: "bg-status-warning text-text-primary",
  complete: "bg-status-success text-text-primary",
  scheduled: "bg-status-scheduled text-text-primary",
};

interface BadgeProps {
  status: BadgeStatus;
  label?: string;
}

export default function Badge({ status, label }: BadgeProps) {
  const displayLabel = label ?? status.charAt(0).toUpperCase() + status.slice(1);
  return (
    <span
      className={`inline-flex items-center capitalize justify-center px-3 py-1 rounded-pill text-[11px] font-semibold ${statusStyles[status]}`}
    >
      {displayLabel}
    </span>
  );
}
