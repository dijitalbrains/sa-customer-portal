interface EmptyStateProps {
  title: string;
  message: string;
}

export default function EmptyState({ title, message }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
      <h2 className="text-2xl font-bold text-text-heading mb-2">{title}</h2>
      <p className="text-sm text-text-muted">{message}</p>
    </div>
  );
}
