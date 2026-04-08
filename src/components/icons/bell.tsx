import type { IconProps } from "./types";

export default function BellIcon({ className, color = "currentColor", size = 20 }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 20 20" fill="none" stroke={color} strokeWidth="1.5">
      <path d="M8 16a2 2 0 004 0" />
      <path d="M4 12c0-1 .5-1.5 1-2 .5-.5 1-2 1-4a4 4 0 018 0c0 2 .5 3.5 1 4s1 1 1 2H4z" />
    </svg>
  );
}
