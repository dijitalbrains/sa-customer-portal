interface TitledCardProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}

export default function TitledCard({ icon, title, children }: TitledCardProps) {
  return (
    <section className="bg-surface-base rounded-2xl shadow-[0px_4px_20px_0px_rgba(0,48,82,0.08)] flex flex-col">
      <div className="bg-surface-overlay h-[52px] px-6 flex items-center gap-3 rounded-t-2xl">
        <div className="w-8 h-8 rounded-[8px] bg-brand-gradient flex items-center justify-center text-white shrink-0">
          {icon}
        </div>
        <h2 className="text-[14px] font-semibold text-text-heading">{title}</h2>
      </div>
      {children}
    </section>
  );
}
