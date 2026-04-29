interface LoadingSpinnerProps {
  size?: number;
  className?: string;
}

export default function LoadingSpinner({ size = 32, className = "" }: LoadingSpinnerProps) {
  return (
    <span
      style={{ width: size, height: size }}
      className={`inline-block border-[3px] border-brand-primary/20 border-t-brand-primary rounded-full animate-spin ${className}`}
    />
  );
}
