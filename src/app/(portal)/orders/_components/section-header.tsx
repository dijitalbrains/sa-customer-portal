interface SectionHeaderProps {
  label: string;
  extra?: string;
}

export default function SectionHeader({ label, extra }: SectionHeaderProps) {
  return (
    <div className="bg-surface-overlay rounded-md h-8 flex items-center px-3 relative overflow-hidden">
      <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-brand-primary rounded-l-md" />
      <span className="text-[11px] font-semibold text-brand-primary">{label}</span>
      {extra && (
        <span className="text-[11px] font-semibold text-text-muted ml-auto">{extra}</span>
      )}
    </div>
  );
}
