import type { IconProps } from "./types";

export default function SupportIcon({ className, color = "currentColor", size = 20 }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 20 20" fill="none" stroke={color} strokeWidth="1.5">
      <path d="M4 13V8a6 6 0 1112 0v5" />
      <path d="M4 10v4a1 1 0 001 1h1a1 1 0 001-1v-2a1 1 0 00-1-1H4zM16 10v4a1 1 0 01-1 1h-1a1 1 0 01-1-1v-2a1 1 0 011-1h2z" />
    </svg>
  );
}
