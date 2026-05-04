interface AvatarProps {
  initials: string;
  size?: number;
  bgClass?: string;
  textClass?: string;
  className?: string;
}

export default function Avatar({
  initials,
  size = 36,
  bgClass = "bg-brand-gradient",
  textClass = "text-white",
  className = "",
}: AvatarProps) {
  return (
    <div
      className={`rounded-full flex items-center justify-center font-bold shrink-0 ${bgClass} ${textClass} ${className}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.33) }}
    >
      {initials || "?"}
    </div>
  );
}
