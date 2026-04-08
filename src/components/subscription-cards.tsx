"use client";

import { useState } from "react";
import Badge from "./badge";
import { ChevronDownIcon } from "./icons";

/* eslint-disable @next/next/no-img-element */

function ProgressBar({
  percent,
  variant = "active",
}: {
  percent: number;
  variant?: "active" | "expired";
}) {
  return (
    <div
      className={`h-1.5 w-full rounded-pill overflow-hidden ${
        variant === "expired" ? "bg-white" : "bg-[#e0e3e5]"
      }`}
    >
      <div
        className={`h-full rounded-pill ${
          variant === "expired"
            ? "bg-status-error-text/60"
            : "bg-gradient-to-r from-brand-primary to-brand-light"
        }`}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

export interface FilterCardProps {
  iconSrc: string;
  title: string;
  location: string;
  price: string;
  status: "active" | "expired";
  frequency: string;
  remaining?: string;
  nextDate: string;
  shipTo: string;
  loyalty: React.ReactNode;
  progress: number;
}

export function FilterCard({
  iconSrc,
  title,
  location,
  price,
  status,
  frequency,
  remaining,
  nextDate,
  shipTo,
  loyalty,
  progress,
}: FilterCardProps) {
  const isExpired = status === "expired";
  const textColor = isExpired ? "text-status-error-text" : "text-text-primary";
  const mutedColor = isExpired ? "text-status-error-text" : "text-text-muted";

  return (
    <div
      className={`bg-surface-overlay rounded-2xl border p-5 md:p-6 flex flex-col gap-4 flex-1 min-w-0 ${
        isExpired ? "border-status-error-text/40" : "border-border-subtle/10"
      }`}
    >
      {/* Filter Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <img src={iconSrc} alt="" className="w-4 h-4 shrink-0" />
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className={`text-[13px] font-bold ${isExpired ? "text-status-error-text" : "text-text-primary"}`}>
              {title}
            </span>
            <span className={`text-[12px] font-normal ${mutedColor}`}>({location})</span>
          </div>
        </div>
        <div className="flex items-center gap-2 ml-7 sm:ml-0">
          <p className={`text-[12px] ${textColor}`}>
            <span className="font-bold">{price} </span>
            <span className="font-normal">(plus shipping + tax)</span>
          </p>
          <Badge status={status} label={isExpired ? "Expired" : "Active"} />
        </div>
      </div>

      {/* Progress */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className={`text-[12px] font-medium ${mutedColor}`}>{frequency}</span>
          {remaining && (
            <span className={`text-[12px] font-medium ${mutedColor}`}>{remaining}</span>
          )}
        </div>
        <ProgressBar percent={progress} variant={status} />
      </div>

      {/* Details */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
        <div className="flex flex-col gap-1">
          <span className={`text-[10px] font-semibold uppercase tracking-wide ${textColor}`}>
            Next subscription
          </span>
          <span className={`text-[12px] font-normal ${textColor}`}>{nextDate}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className={`text-[10px] font-semibold uppercase tracking-wide ${textColor}`}>
            Ship To
          </span>
          <span className={`text-[12px] font-normal ${textColor}`}>{shipTo}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className={`text-[10px] font-semibold uppercase tracking-wide ${textColor}`}>
            Loyalty Program
          </span>
          <div className={`text-[12px] font-normal ${textColor}`}>{loyalty}</div>
        </div>
      </div>
    </div>
  );
}

export interface SubscriptionItemProps {
  iconSrc: string;
  title: string;
  filters: FilterCardProps[];
}

export function SubscriptionItem({ iconSrc, title, filters }: SubscriptionItemProps) {
  return (
    <div className="bg-surface-base rounded-lg shadow-card px-2 md:px-5 py-5">
      {/* Item Header */}
      <div className="flex items-center justify-between mb-5 gap-4">
        <div className="flex items-center gap-4 md:gap-6 min-w-0">
          <div className="w-12 h-12 md:w-16 md:h-16 rounded-[20px] md:rounded-[24px] bg-brand-primary/10 flex items-center justify-center shrink-0">
            <img src={iconSrc} alt="" className="w-6 h-7 md:w-7 md:h-8" />
          </div>
          <h2 className="text-lg md:text-2xl font-bold text-text-heading truncate">{title}</h2>
        </div>
        <button className="border border-brand-primary text-brand-primary font-semibold text-[13px] md:text-[14px] px-4 md:px-5 py-2 md:py-2.5 rounded-pill hover:bg-brand-surface transition-colors whitespace-nowrap shrink-0">
          Pause Subscription
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4 md:gap-6">
        {filters.map((filter, i) => (
          <FilterCard key={i} {...filter} />
        ))}
      </div>
    </div>
  );
}

export interface OrderAccordionProps {
  orderNumber: string;
  placedDate: string;
  items: SubscriptionItemProps[];
  defaultOpen?: boolean;
}

export function OrderAccordion({ orderNumber, placedDate, items, defaultOpen = false }: OrderAccordionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="bg-surface-overlay rounded-lg p-4">
      {/* Order Header — clickable toggle */}
      <button
        onClick={() => setOpen(!open)}
        className="bg-surface-base rounded-lg shadow-card flex items-center justify-between px-5 md:px-6 py-4 w-full"
      >
        <div className="flex items-center gap-5 md:gap-6">
          <div className="flex flex-col gap-0.5 text-left">
            <span className="text-[10px] font-semibold text-text-muted uppercase tracking-[1.1px]">
              Order Number
            </span>
            <span className="text-[15px] font-bold text-text-heading">
              {orderNumber}
            </span>
          </div>
          <div className="w-px h-10 bg-border-subtle/20 hidden sm:block" />
          <div className="flex flex-col gap-0.5 text-left">
            <span className="text-[10px] font-semibold text-text-muted uppercase tracking-[1.1px]">
              Placed Date
            </span>
            <span className="text-[15px] font-medium text-text-heading">
              {placedDate}
            </span>
          </div>
        </div>
        <ChevronDownIcon
          className={`w-5 h-5 text-text-muted transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Order Items — shown when expanded */}
      {open && (
        <div className="flex flex-col gap-4 mt-[5px]">
          {items.map((item, i) => (
            <SubscriptionItem key={i} {...item} />
          ))}
        </div>
      )}
    </div>
  );
}
