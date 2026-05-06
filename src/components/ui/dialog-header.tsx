"use client";

interface DialogHeaderProps {
  iconSrc: string;
  title: string;
  subtitle?: string;
  onClose: () => void;
}

export default function DialogHeader({ iconSrc, title, subtitle, onClose }: DialogHeaderProps) {
  return (
    <div className="border-b border-border-subtle/50">
      <div className="flex items-center justify-between gap-3 px-7 py-3">
        <div className="flex items-center gap-3">
          <span className="rounded-lg bg-[#eef6fc] flex items-center justify-center">
            <img src={iconSrc} alt="" className="w-7 h-7 p-1" />
          </span>
          <div className="flex flex-col leading-tight">
            <h3 className="font-bold text-[17px] text-text-heading">{title}</h3>
            {subtitle && <span className="text-[11px] text-text-muted">{subtitle}</span>}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-surface-overlay cursor-pointer"
        >
          <img src="/assets/icons/close.svg" alt="" className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
