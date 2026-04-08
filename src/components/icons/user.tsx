import type { IconProps } from "./types";

export default function UserIcon({ className, color = "currentColor", size = 20 }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 20 20" fill="none" stroke={color} strokeWidth="1.5">
      <circle cx="10" cy="7" r="3.5" />
      <path d="M3.5 17.5c0-3.59 2.91-6.5 6.5-6.5s6.5 2.91 6.5 6.5" strokeLinecap="round" />
    </svg>
  );
}
