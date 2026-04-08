import type { IconProps } from "./types";

export default function CartIcon({ className, color = "currentColor", size = 20 }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 20 20" fill="none" stroke={color} strokeWidth="1.5">
      <path d="M3 3h1.5l1 9h10l1.5-6H6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="8" cy="16" r="1.5" />
      <circle cx="14" cy="16" r="1.5" />
    </svg>
  );
}
