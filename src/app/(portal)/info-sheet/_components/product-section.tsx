import Badge from "@/components/ui/badge";
import type { InfoSheetProductSection } from "@/lib/types/info-sheet";

interface ProductSectionProps {
  section: InfoSheetProductSection;
}

export default function ProductSection({ section }: ProductSectionProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-border-subtle/50">
      <div className="flex items-center gap-2 bg-surface-overlay/60 px-4 py-2.5 border-b border-border-subtle/40">
        <span className="text-[13px] font-semibold text-text-heading">
          {section.name}
        </span>
        {section.nickname && (
          <span className="text-[12px] text-text-muted">({section.nickname})</span>
        )}
      </div>

      <div className="flex flex-col gap-4 p-4 text-[13px]">
        <div>
          <h6 className="font-semibold text-text-heading">Address</h6>
          <p className="text-text-muted">{section.address ?? "—"}</p>
        </div>

        {section.zoneFilterDesc && (
          <div className="flex flex-col gap-0.5">
            <h6 className="font-semibold text-text-heading">Zone Info</h6>
            <p className="text-text-muted">
              <span className="font-semibold text-text-heading">Zone:</span>{" "}
              {section.zone}
            </p>
            <p className="text-text-muted">
              <span className="font-semibold text-text-heading">Filters:</span>{" "}
              {section.zoneFilterDesc}
            </p>
          </div>
        )}

        {section.renewalItems.length > 0 && (
          <div className="flex flex-col">
            <h6 className="mb-1 font-semibold text-text-heading">
              Subscription Details
            </h6>
            {section.renewalItems.map((item, index) => (
              <div
                key={index}
                className="border-b border-border-subtle/40 py-2.5 last:border-b-0"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="font-semibold text-text-heading">
                      {item.name}
                    </span>
                    {item.cycle && (
                      <span className="ml-1.5 text-text-muted">
                        (Every {item.cycle})
                      </span>
                    )}
                  </div>
                  <Badge
                    status={item.status.toLowerCase() as "active" | "expired" | "pending"}
                    label={item.status}
                  />
                </div>
                <p className="mt-0.5 text-[12px] text-text-muted">
                  {item.status === "PENDING"
                    ? "Pending Install"
                    : `Next renewal: ${item.nextDate ?? "N/A"}`}
                </p>
                {item.address && (
                  <p className="text-[12px] text-text-muted">
                    Ship to: {item.address}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
