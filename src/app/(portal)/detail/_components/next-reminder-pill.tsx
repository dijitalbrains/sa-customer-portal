interface NextReminderPillProps {
  isPending: boolean;
  date: string;
}

export default function NextReminderPill({ isPending, date }: NextReminderPillProps) {
  if (isPending) {
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-pill text-[11px] font-semibold bg-status-warning text-text-primary">
        Pending Install
      </span>
    );
  }

  return (
    <div className="flex flex-col items-end gap-0.5">
      <span className="text-[12px] text-text-muted">Next Subscription</span>
      <span className="text-[12px] font-semibold text-text-heading">{date}</span>
    </div>
  );
}
