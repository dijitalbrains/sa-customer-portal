import type { IconProps } from "./types";

export default function FilterIcon({ className, color = "currentColor", size = 20 }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 20 20" fill="none" stroke={color} strokeWidth="1.5">
      <path d="M3 4h14M5 8h10M7 12h6M9 16h2" strokeLinecap="round" />
    </svg>
  );
}
