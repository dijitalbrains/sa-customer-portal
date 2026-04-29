interface StepSectionProps {
  number: number;
  title: string;
  description: string;
  children: React.ReactNode;
}

export default function StepSection({ number, title, description, children }: StepSectionProps) {
  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5">
        <span className="w-5 h-5 rounded-[10px] bg-brand-gradient flex items-center justify-center font-bold text-[9px] text-white">
          {number}
        </span>
        <h4 className="font-semibold text-xs text-text-heading">{title}</h4>
      </div>
      <p className="text-[11px] text-text-muted">{description}</p>
      <div className="mt-1">{children}</div>
    </section>
  );
}
