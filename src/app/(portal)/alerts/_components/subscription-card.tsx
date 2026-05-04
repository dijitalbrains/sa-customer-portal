"use client";

import HoverTooltip from "@/components/ui/hover-tooltip";
import Toggle from "@/components/ui/toggle";
import type { AlertChannel, AlertItem, AlertSubscription } from "@/lib/types/alert";

interface SubscriptionCardProps {
  subscription: AlertSubscription;
  hasPhone: boolean;
  hasEmail: boolean;
  onToggle: (itemId: number, channel: AlertChannel, value: boolean) => void;
}

export default function SubscriptionCard({
  subscription,
  hasPhone,
  hasEmail,
  onToggle,
}: SubscriptionCardProps) {
  return (
    <section className="rounded-[15px] bg-white overflow-hidden">
      <header className="flex items-center px-7 py-3">
        <h2 className="text-[22px] font-bold text-text-heading">{subscription.title}</h2>
      </header>

      <div>
        <ColumnHeaders />
        {subscription.items.map((item, index) => (
          <ItemRow
            key={item.id}
            item={item}
            zebra={index % 2 === 1}
            hasPhone={hasPhone}
            hasEmail={hasEmail}
            onToggle={onToggle}
          />
        ))}
      </div>
    </section>
  );
}

function ColumnHeaders() {
  return (
    <div className="flex items-center px-7 pb-3 pt-1 gap-6">
      <div className="flex-1" />
      <ChannelHeader iconSrc="/assets/icons/alert/chat.svg" label="Text Message" />
      <ChannelHeader iconSrc="/assets/icons/alert/envelope.svg" label="Email" />
      <ChannelHeader iconSrc="/assets/icons/alert/bell.svg" label="Push" />
    </div>
  );
}

function ChannelHeader({ iconSrc, label }: { iconSrc: string; label: string }) {
  return (
    <div className="w-[120px] flex items-center gap-2 justify-start">
      <img src={iconSrc} alt="" className="w-4 h-4" />
      <span className="text-[11px] font-semibold text-text-muted">{label}</span>
    </div>
  );
}

interface ItemRowProps {
  item: AlertItem;
  zebra: boolean;
  hasPhone: boolean;
  hasEmail: boolean;
  onToggle: (itemId: number, channel: AlertChannel, value: boolean) => void;
}

function ItemRow({ item, zebra, hasPhone, hasEmail, onToggle }: ItemRowProps) {
  const cadence = `Every ${item.validityValue} ${item.validityType.toLowerCase()}`;

  return (
    <div
      className={`flex items-center px-7 py-4 gap-6 border-t border-[#edf0f5] ${
        zebra ? "bg-[#fcfcff]" : "bg-white"
      }`}
    >
      <div className="flex-1 flex flex-col min-w-0">
        <span className="text-[14px] font-semibold text-text-heading truncate">
          {item.productName}
        </span>
        <span className="text-[12px] text-text-muted truncate">{cadence}</span>
      </div>

      <div className="w-[120px] flex justify-start">
        <HoverTooltip
          content={hasPhone ? null : "Add a phone number in your profile to enable text alerts"}
        >
          <Toggle
            checked={item.textAlerts}
            onChange={(v) => onToggle(item.id, "text_alerts", v)}
            variant="primary"
            disabled={!hasPhone}
            label="Text alerts"
          />
        </HoverTooltip>
      </div>
      <div className="w-[120px] flex justify-start">
        <HoverTooltip
          content={hasEmail ? null : "Add an email address in your profile to enable email alerts"}
        >
          <Toggle
            checked={item.emailAlerts}
            onChange={(v) => onToggle(item.id, "email_alerts", v)}
            variant="purple"
            disabled={!hasEmail}
            label="Email alerts"
          />
        </HoverTooltip>
      </div>
      <div className="w-[120px] flex justify-start">
        <Toggle
          checked={item.notificationAlerts}
          onChange={(v) => onToggle(item.id, "notification_alerts", v)}
          variant="green"
          label="Push notifications"
        />
      </div>
    </div>
  );
}
