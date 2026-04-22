interface SectionCardProps {
  children: React.ReactNode;
  className?: string;
}

export default function SectionCard({ children, className = "" }: SectionCardProps) {
  return (
    <section
      className={`bg-surface-base rounded-2xl shadow-card overflow-hidden flex flex-col ${className}`}
    >
      <div className="h-1 w-full bg-brand-gradient" />
      <div className="p-5 flex flex-col gap-4 flex-1">{children}</div>
    </section>
  );
}
