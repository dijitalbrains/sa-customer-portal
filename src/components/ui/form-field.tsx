import { forwardRef, type InputHTMLAttributes } from "react";

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

const FormField = forwardRef<HTMLInputElement, FormFieldProps>(function FormField(
  { label, error, className, ...props },
  ref,
) {
  return (
    <div className="flex flex-col">
      <div className="bg-surface-base border border-[#D1D6E0] rounded-[10px] px-3 pt-[7px] pb-[5px]">
        <label className="block text-[9px] font-semibold uppercase tracking-[0.5px] text-text-muted">
          {label}
        </label>
        <input
          ref={ref}
          className={`block w-full bg-transparent text-[13px] font-normal text-text-primary focus:outline-none placeholder:text-text-muted/60 ${className ?? ""}`}
          {...props}
        />
      </div>
      {error && <span className="text-[11px] text-status-error-text mt-1">{error}</span>}
    </div>
  );
});

export default FormField;
