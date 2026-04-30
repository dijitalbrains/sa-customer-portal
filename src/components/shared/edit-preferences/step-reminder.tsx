"use client";

import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import StepSection from "./step-section";
import { formatLongDate } from "@/lib/utils/date";
import type { ValidityType } from "@/lib/actions/preferences.actions";

interface StepReminderProps {
  value: Date;
  validityValue: number;
  validityType: ValidityType;
  onChange: (date: Date) => void;
}

export default function StepReminder({
  value,
  validityValue,
  validityType,
  onChange,
}: StepReminderProps) {
  const minDate = startOfToday();
  const unit = validityType.toLowerCase();

  const shiftDay = (delta: number) => {
    const next = new Date(value);
    next.setDate(next.getDate() + delta);
    if (next < minDate) return;
    onChange(next);
  };

  return (
    <StepSection
      number={3}
      title="Next reminder date"
      description="When should we remind you to change your filter?"
    >
      <div className="rounded-md border border-[rgba(255,200,100,0.4)] bg-[#fff7eb] h-8 flex items-center px-2.5">
        <p className="text-[10px] text-[#92400e]">
          Note: you can calculate this by the last time you changed your filter +{validityValue}{" "}
          {unit}.
        </p>
      </div>

      <div className="mt-2 w-full rounded-[10px] border border-border-subtle bg-white shadow-[0px_2px_6px_0px_rgba(0,48,82,0.05)] overflow-hidden edit-prefs-calendar">
        <Calendar
          value={value}
          onChange={(next: unknown) => next instanceof Date && onChange(next)}
          minDate={minDate}
          calendarType="gregory"
          locale="en-US"
          formatShortWeekday={(_locale: string | undefined, date: Date) =>
            date.toLocaleDateString("en-US", { weekday: "short" })
          }
          prev2Label={null}
          next2Label={null}
          prevLabel={
            <img src="/assets/icons/figma/chevron-left.svg" alt="" className="w-2.5 h-2.5" />
          }
          nextLabel={
            <img src="/assets/icons/figma/chevron-right.svg" alt="" className="w-2.5 h-2.5" />
          }
        />
      </div>

      <div className="mt-3 flex items-center justify-between">
        <p className="font-semibold text-[11px] text-text-heading">{formatLongDate(value)}</p>
        <div className="flex items-center gap-2">
          <ArrowButton direction="left" onClick={() => shiftDay(-1)} />
          <ArrowButton direction="right" onClick={() => shiftDay(1)} />
        </div>
      </div>
    </StepSection>
  );
}

function ArrowButton({ direction, onClick }: { direction: "left" | "right"; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={direction === "left" ? "Previous day" : "Next day"}
      className="w-6 h-6 rounded-full bg-surface-overlay flex items-center justify-center hover:bg-brand-credits cursor-pointer"
    >
      <img src={`/assets/icons/figma/chevron-${direction}.svg`} alt="" className="w-2.5 h-2.5" />
    </button>
  );
}

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
