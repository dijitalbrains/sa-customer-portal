import { formatPrice } from "@/lib/utils/currency";
import type { RenewalTimeline } from "@/lib/types/renewal-timeline";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

interface RenewalCalendarProps {
  timeline: RenewalTimeline;
}

export default function RenewalCalendar({ timeline }: RenewalCalendarProps) {
  return (
    <div className="overflow-x-auto rounded-[16px] bg-white shadow-[0px_0px_0px_1px_rgba(193,198,215,0.18),0px_4px_24px_0px_rgba(128,149,170,0.12)]">
      <table className="w-full min-w-[900px] border-collapse text-[12px]">
        <thead>
          <tr className="bg-surface-overlay">
            <th className="px-4 py-3 text-left font-semibold text-text-heading">
              Year / Month
            </th>
            {MONTHS.map((month) => (
              <th
                key={month}
                className="px-3 py-3 text-center font-semibold text-text-heading"
              >
                {month}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {timeline.years.map((year) => (
            <tr key={year} className="border-t border-border-subtle/30">
              <td className="px-4 py-3 font-semibold text-text-heading">{year}</td>
              {Array.from({ length: 12 }, (_, index) => index + 1).map((month) => {
                const key = `${year}-${String(month).padStart(2, "0")}`;
                const total = timeline.monthlyTotals[key];
                return (
                  <td key={month} className="px-3 py-3 text-center">
                    {total ? (
                      <span className="font-medium text-text-heading">
                        {formatPrice(total)}
                      </span>
                    ) : (
                      <span className="text-[#9BA3AF]">-</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
