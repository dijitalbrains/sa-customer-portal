"use client";

import { formatPrice } from "@/lib/utils/currency";
import Button from "@/components/ui/button";
import PaymentMethodCmp from "@/components/shared/payment-method";
import SectionHeader from "./section-header";
import type { OrderDetail, OrderItemGroup } from "@/lib/types/order";
import type { PaymentMethod } from "@/lib/types/payment";

interface InvoiceProps {
  order: OrderDetail;
}

function paymentDetailLine(payment: PaymentMethod): string {
  if (!payment) return "—";
  if (payment.type === "card") return `${payment.brand} | Last digits: ${payment.last4}`;
  return `Bank Account (ACH) | ${payment.bankName} | Last digits: ${payment.last4}`;
}

function paymentTransactionLine(payment: PaymentMethod): string {
  if (!payment) return "—";
  if (payment.type === "card") return `${payment.brand} ending in: ${payment.last4}`;
  return `${payment.bankName} ending in: ${payment.last4}`;
}

export default function Invoice({ order }: InvoiceProps) {
  return (
    <div data-print-invoice="" className="bg-surface-base rounded-[16px] shadow-[-4px_0px_32px_0px_rgba(0,48,82,0.1)] overflow-hidden flex flex-col xl:h-full min-w-0">
      <div data-print-hide="" className="h-[3px] bg-brand-gradient rounded-t-[16px] shrink-0" />

      <div className="shrink-0">
        <div className="bg-[#F6F9FC] px-8 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-[22px] font-bold text-text-heading">{order.placedDate}</span>
            <span className="text-[12px] font-normal text-text-muted">
              Order placed by {order.placedBy}
            </span>
          </div>
          <div data-print-hide="">
            <Button variant="outline" onClick={() => window.print()}>
              Print Invoice
            </Button>
          </div>
        </div>

        <div className="px-8 py-2">
          <div className="bg-surface-overlay rounded-[12px] flex items-stretch h-[52px] overflow-hidden">
            <SummaryCell label="ORDER DATE" value={order.placedDate} />
            <Divider />
            <SummaryCell label="GRAND TOTAL" value={formatPrice(order.total, order.currencyCode)} isBrand />
            <Divider />
            <div className="flex-1 px-3.5 flex flex-col justify-center gap-0.5">
              <span className="text-[8px] font-semibold text-text-muted uppercase">Payment</span>
              <PaymentMethodCmp payment={order.payment} />
            </div>
          </div>
        </div>
      </div>

      <div data-print-scroll="" className="px-8 pb-8 flex flex-col gap-4 xl:overflow-y-auto xl:flex-1">
        <div className="flex flex-col gap-1">
          <SectionHeader
            label="ITEMS ORDERED"
            extra={`Price: ${formatPrice(order.subtotal, order.currencyCode)}`}
          />
          <div data-print-grid="" className="grid grid-cols-1 xl:grid-cols-2 gap-0 border border-border-subtle rounded-md overflow-hidden">
            {order.itemGroups.map((group, i) => (
              <ItemGroup key={i} group={group} index={i} total={order.itemGroups.length} />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <SectionHeader label="PAYMENT INFORMATION" />
          <div className="border border-border-subtle rounded-md overflow-hidden flex flex-col xl:flex-row">
            <div className="flex-1 min-w-0 basis-1/2">
              <div className="p-3.5 flex flex-col gap-1">
                <span className="text-[11px] font-semibold text-text-muted">Payment Method:</span>
                <span className="text-[12px] font-normal text-text-primary">
                  {paymentDetailLine(order.payment)}
                </span>
              </div>
              <div data-print-grid="" className="grid grid-cols-1 xl:grid-cols-2">
                {order.itemGroups.map((group, i) => (
                  <div key={i} className={`p-3.5 flex flex-col gap-1 ${
                    order.itemGroups.length > 1 && i % 2 === 0 && i + 1 < order.itemGroups.length
                      ? "xl:border-r border-border-subtle" : ""
                  }`}>
                    <span className="text-[12px] font-bold text-text-primary">{group.name}</span>
                    <span className="text-[11px] font-normal text-text-muted">{group.phone}</span>
                    <span className="text-[11px] font-semibold text-text-primary">{group.address}</span>
                    {group.products.map((p, j) => (
                      <span key={j} className="text-[11px] font-normal text-text-primary">{p}</span>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <div className="hidden xl:block w-px bg-border-subtle self-stretch mx-0 my-2" />

            <div className="flex-1 min-w-0 basis-1/2 p-3.5 flex flex-col gap-1.5">
              <PriceRow label="Item(s) Subtotal:" value={formatPrice(order.subtotal, order.currencyCode)} />
              <PriceRow label="Shipping & Handling:" value={formatPrice(order.shippingPrice, order.currencyCode)} />
              {order.ccProcessingFee > 0 && (
                <PriceRow label="CC Processing Fee (3%):" value={formatPrice(order.ccProcessingFee, order.currencyCode)} />
              )}
              <div className="h-px bg-border-subtle my-1" />
              {order.countryCode === "US" ? (
                <>
                  <PriceRow label="Total before tax:" value={formatPrice(order.subtotal, order.currencyCode)} />
                  <PriceRow label="Tax collected:" value={formatPrice(order.tax, order.currencyCode)} />
                </>
              ) : (
                <PriceRow label="Estimated tax and duties:" value={formatPrice(order.estimatedTax, order.currencyCode)} />
              )}
              <div className="h-px bg-border-subtle my-1" />
              <div className="flex items-center justify-between bg-brand-primary/5 rounded px-2 py-1">
                <span className="text-[12px] font-bold text-text-heading">Grand Total:</span>
                <span className="text-[14px] font-bold text-brand-primary font-data">
                  {formatPrice(order.total, order.currencyCode)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <SectionHeader
            label={order.payment?.type === "bank" ? "BANK ACCOUNT TRANSACTIONS (ACH)" : "CREDIT CARD TRANSACTIONS"}
          />
          <div className="bg-surface-raised border border-border-subtle rounded-md px-3.5 py-2.5 flex items-center justify-between">
            <span className="text-[11px] font-normal text-text-primary">
              {paymentTransactionLine(order.payment)}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold text-text-muted">Transaction Amount:</span>
              <span className="text-[14px] font-bold text-brand-primary font-data">
                {formatPrice(order.total, order.currencyCode)}
              </span>
            </div>
          </div>
        </div>

        <div className="h-px bg-border-subtle" />

        <p className="text-[11px] font-normal text-text-muted">
          Spring Aqua Customer Portal · This is your official order record
        </p>
      </div>
    </div>
  );
}

function SummaryCell({ label, value, isBrand }: { label: string; value: string; isBrand?: boolean }) {
  return (
    <div className="flex-1 px-3.5 flex flex-col justify-center gap-0.5">
      <span className="text-[8px] font-semibold text-text-muted uppercase">{label}</span>
      <span className={`text-[13px] font-semibold ${isBrand ? "text-brand-primary font-data font-bold" : "text-text-primary"}`}>
        {value}
      </span>
    </div>
  );
}

function Divider() {
  return <div className="w-px bg-border-subtle self-stretch my-2.5" />;
}

function ItemGroup({ group, index, total }: { group: OrderItemGroup; index: number; total: number }) {
  const showRightBorder = total > 1 && index % 2 === 0 && index + 1 < total;

  return (
    <div className={`p-3.5 flex flex-col gap-1 ${showRightBorder ? "xl:border-r border-border-subtle" : ""}`}>
      <span className="text-[12px] font-bold text-text-primary">{group.name}</span>
      <span className="text-[11px] font-normal text-text-muted">{group.phone}</span>
      <span className="text-[11px] font-semibold text-text-primary">{group.address}</span>
      {group.products.map((product, i) => (
        <span key={i} className="text-[11px] font-normal text-text-primary">{product}</span>
      ))}
    </div>
  );
}

function PriceRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px] font-normal text-text-muted">{label}</span>
      <span className="text-[11px] font-normal text-text-primary font-data">{value}</span>
    </div>
  );
}
