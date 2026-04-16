import type { PaymentMethod as PaymentMethodType } from "@/lib/types/subscription";

interface Props {
  payment: PaymentMethodType;
  showStatus?: boolean;
}

export default function PaymentMethod({ payment, showStatus = false }: Props) {
  if (!payment) return null;

  if (payment.type === "bank") {
    return (
      <div className="flex items-center gap-1.5 text-text-primary">
        <span className="text-[12px] font-semibold uppercase">
          {payment.bankName} ****{payment.last4}
        </span>
        <span className="text-[12px]">(ACH)</span>
      </div>
    );
  }

  const textColor = payment.isFailed
    ? "text-status-error-text"
    : payment.isExpiringSoon
    ? "text-[#d97706]"
    : "text-text-primary";

  return (
    <div className={`flex items-center gap-1.5 ${textColor}`}>
      <img src={payment.brandImage} alt="" className="h-4 w-auto" />
      <span className="text-[12px] font-semibold uppercase">****{payment.last4}</span>
      {showStatus && <span className="text-[12px]">({payment.statusText})</span>}
    </div>
  );
}
