interface AvatarProps {
  initials: string;
  size?: number;
}

export default function Avatar({ initials, size = 72 }: AvatarProps) {
  return (
    <div
      className="text-white rounded-full bg-brand-gradient text-text-heading font-bold flex items-center justify-center shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.35 }}
    >
      {initials || "?"}
    </div>
  );
}
