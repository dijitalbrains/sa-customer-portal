"use client";

export type PaymentTab = "card" | "bank";

interface TabsProps {
  value: PaymentTab;
  onChange: (tab: PaymentTab) => void;
}

interface TabConfig {
  key: PaymentTab;
  label: string;
  subtitle: string;
}

const TABS: TabConfig[] = [
  { key: "card", label: "Card", subtitle: "Includes about 3% processing fee" },
  { key: "bank", label: "Bank Transfer (ACH)", subtitle: "No processing fee" },
];

export default function Tabs({ value, onChange }: TabsProps) {
  return (
    <div className="flex justify-center">
      <div className="inline-flex items-center gap-1 rounded-[10px] bg-[#F0F4F8] p-1">
        {TABS.map((tab) => {
          const active = tab.key === value;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onChange(tab.key)}
              className={`text-center rounded-[8px] px-5 py-1 transition-colors cursor-pointer ${
                active ? "bg-white shadow-[0px_1px_4px_0px_#0E172B1A]" : "hover:bg-[#F0F4F8]"
              }`}
            >
              <div
                className={`text-[14px] font-[600] ${
                  active ? "text-brand-primary" : "text-[#808799]"
                }`}
              >
                {tab.label}
              </div>
              <div className="text-[11px] text-[#808799]">{tab.subtitle}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
