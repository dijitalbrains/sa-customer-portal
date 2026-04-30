interface InvalidZipcodeProps {
  zip: string;
}

export default function InvalidZipcode({ zip }: InvalidZipcodeProps) {
  return (
    <div className="rounded-2xl border border-status-error-text/40 bg-status-error/40 p-5">
      <p className="text-[12px] text-status-error-text">
        This zip code <strong>{zip}</strong> is not in our system yet. Please contact support
        for assistance.
      </p>
    </div>
  );
}
