"use client";

export type SupportTab = "open" | "resolved" | "submit";

interface TabConfig {
  key: SupportTab;
  label: string;
  subtitle: string;
}

const TABS: TabConfig[] = [
  { key: "open", label: "Open Tickets", subtitle: "Currently active issues" },
  { key: "resolved", label: "Resolved Tickets", subtitle: "Completed & closed" },
  { key: "submit", label: "Submit New Ticket", subtitle: "Raise a new request" },
];

interface TabBarProps {
  value: SupportTab;
  onChange: (value: SupportTab) => void;
}

export default function TabBar({ value, onChange }: TabBarProps) {
  return (
    <div className="flex items-stretch gap-1 h-11 p-1 rounded-[10px] bg-[#F0F4F8]">
      {TABS.map((tab) => {
        const active = tab.key === value;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            className={`flex flex-1 flex-col items-center justify-center rounded-[7px] leading-tight transition-colors cursor-pointer ${
              active
                ? "bg-white shadow-[0px_0px_0px_1px_rgba(193,198,215,0.2),0px_2px_8px_0px_rgba(128,149,170,0.15)]"
                : "hover:bg-white/40"
            }`}
          >
            <span
              className={`text-[13px] ${
                active
                  ? "font-semibold text-brand-primary"
                  : "font-medium text-[#808599]"
              }`}
            >
              {tab.label}
            </span>
            <span
              className={`text-[9px] ${active ? "text-[#808599]" : "text-[#A0A8B8]"}`}
            >
              {tab.subtitle}
            </span>
          </button>
        );
      })}
    </div>
  );
}
