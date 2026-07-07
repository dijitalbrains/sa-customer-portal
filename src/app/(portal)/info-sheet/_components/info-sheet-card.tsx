interface InfoSheetCardProps {
  title: string;
  children: React.ReactNode;
}

export default function InfoSheetCard({ title, children }: InfoSheetCardProps) {
  return (
    <div className="h-full flex flex-col overflow-hidden rounded-2xl shadow-[0px_4px_20px_0px_#00305214]">
      <div className="bg-surface-overlay px-5 py-3.5 border-b border-border-subtle/40">
        <h2 className="text-[15px] font-semibold text-text-heading">{title}</h2>
      </div>
      <div className="flex-1 p-5">{children}</div>
    </div>
  );
}
