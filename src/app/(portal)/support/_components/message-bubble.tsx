import type { TicketMessage } from "@/lib/types/ticket";

interface MessageBubbleProps {
  message: TicketMessage;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isCustomer = message.side === "customer";

  const avatar = (
    <span
      className={`flex size-8 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white ${
        isCustomer ? "bg-[#22BB62]" : "bg-brand-primary"
      }`}
    >
      {message.initials}
    </span>
  );

  return (
    <div className={`flex gap-2.5 ${isCustomer ? "justify-end" : "justify-start"}`}>
      {!isCustomer && avatar}

      <div
        className={`flex max-w-[80%] flex-col gap-1 ${
          isCustomer ? "items-end" : "items-start"
        }`}
      >
        <div
          className={`flex items-center gap-2 ${isCustomer ? "flex-row-reverse" : ""}`}
        >
          <span
            className={`text-[12px] font-semibold ${
              isCustomer ? "text-[#22BB62]" : "text-brand-primary"
            }`}
          >
            {message.authorName}
          </span>
          <span className="text-[10px] text-[#9BA3AF]">{message.dateTime}</span>
        </div>

        <div
          className={`rounded-[12px] px-3.5 py-2.5 ${
            isCustomer
              ? "bg-[#EAF3DE] shadow-[0px_0px_0px_1px_rgba(34,187,98,0.08)]"
              : "bg-surface-overlay shadow-[0px_0px_0px_1px_rgba(55,146,222,0.08)]"
          }`}
        >
          {message.message && (
            <p className="whitespace-pre-wrap text-[12px] leading-[18px] text-text-muted">
              {message.message}
            </p>
          )}

          {message.attachments.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-3">
              {message.attachments.map((attachment, index) => (
                <a
                  key={index}
                  href={attachment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <img
                    src={attachment.url}
                    alt={attachment.name}
                    className="size-[59px] rounded-[8px] border border-brand-light object-cover"
                  />
                  <span className="text-[11px] font-medium text-text-muted">
                    {attachment.name}
                  </span>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {isCustomer && avatar}
    </div>
  );
}
