"use client";

import { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "ghost" | "outline" | "link";
type ButtonSize = "sm" | "md";

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-brand-gradient text-white hover:opacity-90 shadow-button",
  ghost:
    "bg-transparent text-text-muted hover:bg-surface-overlay",
  outline:
    "border border-brand-primary text-brand-primary bg-transparent hover:bg-brand-surface",
  link:
    "bg-transparent text-brand-primary hover:underline p-0",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-[12px]",
  md: "h-11 px-5 text-[14px]",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  loadingText?: string;
}

export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  loadingText = "Loading...",
  disabled,
  children,
  className = "",
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      disabled={isDisabled}
      className={`
        inline-flex items-center justify-center gap-2 rounded-pill font-semibold
        transition-colors whitespace-nowrap shrink-0
        disabled:opacity-60 disabled:cursor-not-allowed
        ${variantStyles[variant]}
        ${variant !== "link" ? sizeStyles[size] : ""}
        ${className}
      `}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {loading ? loadingText : children}
    </button>
  );
}
