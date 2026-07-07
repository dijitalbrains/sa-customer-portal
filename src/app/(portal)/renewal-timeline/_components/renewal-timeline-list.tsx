import { formatPrice } from "@/lib/utils/currency";
import type {
  RenewalTimelineDate,
  RenewalTimelineLine,
} from "@/lib/types/renewal-timeline";

interface RenewalTimelineListProps {
  dates: RenewalTimelineDate[];
}

export default function RenewalTimelineList({ dates }: RenewalTimelineListProps) {
  if (dates.length === 0) {
    return (
      <div className="rounded-[16px] bg-white p-10 text-center shadow-[0px_0px_0px_1px_rgba(193,198,215,0.18),0px_4px_24px_0px_rgba(128,149,170,0.12)]">
        <p className="text-[13px] text-[#6B7280]">No upcoming renewals.</p>
      </div>
    );
  }

  return (
    <div className="rounded-[16px] bg-white p-6 shadow-[0px_0px_0px_1px_rgba(193,198,215,0.18),0px_4px_24px_0px_rgba(128,149,170,0.12)]">
      {dates.map((entry, index) => (
        <div key={entry.date} className="flex gap-5">
          <div className="flex w-20 shrink-0 flex-col items-center">
            <span className="flex size-11 items-center justify-center rounded-full border border-brand-primary/25 bg-white">
              <img src="/assets/icons/credit-card.svg" alt="" className="w-5 h-5" />
            </span>
            <span className="mt-2 text-center text-[11px] font-medium text-text-muted">
              {entry.display}
            </span>
          </div>

          <div
            className={`relative flex-1 pl-6 ${
              index < dates.length - 1
                ? "border-l-2 border-dashed border-brand-primary/20 pb-8"
                : "pb-1"
            }`}
          >
            <span className="absolute -left-[7px] top-1 size-3 rounded-full bg-brand-primary ring-4 ring-brand-surface" />
            <div className="flex flex-col gap-4">
              {entry.lines.map((line, lineIndex) => (
                <div key={lineIndex}>
                  <h3 className="text-[14px] font-semibold text-text-heading">
                    {line.name}
                  </h3>
                  <p className="mt-0.5 text-[13px] leading-relaxed text-text-muted">
                    <TimelineSentence line={line} />
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function TimelineSentence({ line }: { line: RenewalTimelineLine }) {
  return (
    <>
      {line.quantity} X {line.name}(s)
      {line.technology ? ` of ${line.technology}` : ""}
      {line.nickname ? ` for ${line.nickname}` : ""} priced at{" "}
      <strong className="font-semibold text-text-heading">
        {formatPrice(line.price)}
      </strong>{" "}
      will be charged.
    </>
  );
}
