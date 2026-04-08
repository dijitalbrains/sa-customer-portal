interface ProgressBarProps {
  percent: number;
  variant?: "default" | "error";
}

export default function ProgressBar({ percent, variant = "default" }: ProgressBarProps) {
  return (
    <div
      className={`h-1.5 w-full rounded-pill overflow-hidden ${
        variant === "error" ? "bg-white" : "bg-[#e0e3e5]"
      }`}
    >
      <div
        className={`h-full rounded-pill ${
          variant === "error"
            ? "bg-status-error-text/60"
            : "bg-gradient-to-r from-brand-primary to-brand-light"
        }`}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
