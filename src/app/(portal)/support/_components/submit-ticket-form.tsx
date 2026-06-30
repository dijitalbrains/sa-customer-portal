"use client";

import { useRef, useState } from "react";
import { toast } from "react-toastify";
import Button from "@/components/ui/button";
import {
  faqFeedback,
  submitTicket,
  suggestFaqAnswer,
} from "@/lib/actions/ticket.actions";
import type {
  FaqSuggestion,
  SupportUser,
  TicketCategoryOption,
  TicketCustomerOption,
} from "@/lib/types/ticket";

type Step = "describe" | "answer" | "ticket";

interface SubmitTicketFormProps {
  user: SupportUser;
  categories: TicketCategoryOption[];
  customers: TicketCustomerOption[];
  onSubmitted: () => void;
}

const inputClass =
  "w-full h-9 px-3 rounded-[8px] bg-[#F9FAFC] border border-border-subtle text-[13px] text-text-primary placeholder:text-[#B0B8C1] shadow-[0px_2px_6px_0px_rgba(0,48,82,0.05)] focus:outline-none focus:border-brand-primary";

const labelClass = "text-[12px] font-medium text-text-muted";

export default function SubmitTicketForm({
  user,
  categories,
  customers,
  onSubmitted,
}: SubmitTicketFormProps) {
  const [step, setStep] = useState<Step>("describe");
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [detail, setDetail] = useState("");
  const [resolution, setResolution] = useState<FaqSuggestion | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [aiAttempted, setAiAttempted] = useState(false);
  const [aiError, setAiError] = useState(false);
  const [customerId, setCustomerId] = useState<number | null>(
    customers.length === 1 ? customers[0].id : null,
  );
  const [images, setImages] = useState<string[]>([]);
  const [previews, setPreviews] = useState<{ source: string; name: string }[]>([]);
  const [notifyMe, setNotifyMe] = useState(false);
  const [notifyCustomer, setNotifyCustomer] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedCustomer = customers.find((c) => c.id === customerId) ?? null;
  const describeComplete = Boolean(title) && categoryId !== null && Boolean(detail);
  const complete = describeComplete && customerId !== null;
  const inAnswerStep = step === "answer";

  async function getHelp() {
    setIsSearching(true);
    const category = categories.find((c) => c.id === categoryId);
    try {
      const result = await suggestFaqAnswer({
        title,
        detail,
        categoryKey: category?.key ?? null,
      });
      setAiAttempted(true);
      setAiError(false);
      setResolution(result);
      setStep(result.matched ? "answer" : "ticket");
    } catch {
      setAiAttempted(true);
      setAiError(true);
      setResolution(null);
      setStep("ticket");
    } finally {
      setIsSearching(false);
    }
  }

  function logFeedback(outcome: string) {
    if (resolution?.suggestionId == null) return;
    faqFeedback({ suggestionId: resolution.suggestionId, outcome }).catch(() => {});
  }

  function markResolved() {
    logFeedback("helped");
    toast.success("Glad we could help! If you need anything else, we're here.");
    resetForm();
  }

  function needMoreHelp() {
    logFeedback("need_more_help");
    setStep("ticket");
  }

  function resetForm() {
    setStep("describe");
    setTitle("");
    setCategoryId(null);
    setDetail("");
    setResolution(null);
    setAiAttempted(false);
    setAiError(false);
    setImages([]);
    setPreviews([]);
    setNotifyMe(false);
    setNotifyCustomer(false);
    setCustomerId(customers.length === 1 ? customers[0].id : null);
  }

  function handleFiles(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const source = String(e.target?.result ?? "");
        setImages((prev) => [...prev, source]);
        setPreviews((prev) => [...prev, { source, name: file.name }]);
      };
      reader.readAsDataURL(file);
    });
  }

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  }

  async function submit() {
    if (!complete || categoryId === null || customerId === null) return;
    setIsSubmitting(true);
    try {
      await submitTicket({
        title,
        categoryId,
        detail,
        customerId,
        images,
        notifyMe,
        notifyCustomer,
        suggestionId: resolution?.suggestionId ?? null,
      });
      toast.success("Ticket submitted");
      onSubmitted();
    } catch {
      toast.error("Could not submit your ticket. Please try again.");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-[16px] bg-white shadow-[0px_4px_24px_0px_rgba(128,149,170,0.1)]">
      <Band>How can we help?</Band>

      <div className="flex flex-col gap-4 px-6 py-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <span className={labelClass}>What&apos;s happening?</span>
            <input
              className={inputClass}
              placeholder="e.g. My water flow is very slow"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={inAnswerStep}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className={labelClass}>Category</span>
            <div className="relative">
              <select
                className={`${inputClass} appearance-none pr-8 cursor-pointer`}
                value={categoryId === null ? "" : String(categoryId)}
                onChange={(e) =>
                  setCategoryId(e.target.value ? Number(e.target.value) : null)
                }
                disabled={inAnswerStep}
              >
                <option value="" disabled>
                  Select Category
                </option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.title}
                  </option>
                ))}
              </select>
              <img
                src="/assets/icons/chevron-down.svg"
                alt=""
                className="pointer-events-none absolute right-3 top-1/2 w-3 -translate-y-1/2"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className={labelClass}>Tell us more about your situation</span>
          <textarea
            className={`${inputClass} h-auto min-h-[82px] resize-none py-2.5`}
            placeholder="Tell us more about your situation..."
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            disabled={inAnswerStep}
          />
        </div>

        {step === "describe" && (
          <>
            <Button
              onClick={getHelp}
              disabled={!describeComplete || isSearching}
              loading={isSearching}
              loadingText="Looking into this..."
              className="h-12 w-full"
            >
              Get Help
            </Button>
            <button
              type="button"
              onClick={() => setStep("ticket")}
              className="self-center text-[12px] font-medium text-brand-primary cursor-pointer hover:underline"
            >
              I&apos;d rather talk to a person — submit a ticket
            </button>
          </>
        )}

        {step === "answer" && resolution?.matched && (
          <AnswerCard
            resolution={resolution}
            onResolved={markResolved}
            onNeedHelp={needMoreHelp}
          />
        )}

        {step === "ticket" && aiAttempted && <NoticeBanner error={aiError} />}
      </div>

      {step === "ticket" && (
        <>
          <Band>Submit A Support Ticket</Band>
          <div className="flex flex-col gap-4 px-6 py-5">
            {customers.length > 1 && (
              <div className="flex flex-col gap-1.5">
                <span className={labelClass}>Select Customer</span>
                <div className="relative">
                  <select
                    className={`${inputClass} appearance-none pr-8 cursor-pointer`}
                    value={customerId === null ? "" : String(customerId)}
                    onChange={(e) =>
                      setCustomerId(e.target.value ? Number(e.target.value) : null)
                    }
                  >
                    <option value="" disabled>
                      Select Customer
                    </option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                      </option>
                    ))}
                  </select>
                  <img
                    src="/assets/icons/chevron-down.svg"
                    alt=""
                    className="pointer-events-none absolute right-3 top-1/2 w-3 -translate-y-1/2"
                  />
                </div>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <span className={labelClass}>Attachment (optional)</span>
              <div className="flex items-center gap-3 h-12 px-1.5 rounded-[10px] bg-white shadow-[0px_0px_0px_1px_rgba(193,198,215,0.45)]">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-[8px] bg-[#F0F4F8] text-[12px] font-semibold text-text-muted shadow-[0px_0px_0px_1px_rgba(193,198,215,0.6)] cursor-pointer"
                >
                  <img src="/assets/icons/upload.svg" alt="" className="w-3.5 h-3.5" />
                  Upload
                </button>
                <span className="text-[12px] text-[#9BA3AF]">
                  {previews.length === 0
                    ? "No file chosen"
                    : `${previews.length} file${previews.length === 1 ? "" : "s"} chosen`}
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  hidden
                  onChange={handleFiles}
                />
              </div>

              {previews.length > 0 && (
                <div className="flex flex-wrap gap-3 pt-1">
                  {previews.map((preview, index) => (
                    <div key={index} className="relative">
                      <img
                        src={preview.source}
                        alt={preview.name}
                        className="w-20 h-20 rounded-[8px] object-cover border border-border-subtle"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        aria-label="Remove image"
                        className="absolute -right-2 -top-2 flex size-5 items-center justify-center rounded-full bg-text-heading text-[10px] text-white cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <CheckRow checked={notifyMe} onChange={setNotifyMe}>
              Notify me of updates at:{" "}
              <span className="font-semibold text-brand-primary">{user.email}</span>
            </CheckRow>

            {selectedCustomer && selectedCustomer.id !== user.id && (
              <CheckRow checked={notifyCustomer} onChange={setNotifyCustomer}>
                Notify {selectedCustomer.name} of updates at:{" "}
                <span className="font-semibold text-brand-primary">
                  {selectedCustomer.email}
                </span>
              </CheckRow>
            )}

            <div className="h-px bg-[rgba(193,198,215,0.35)]" />

            <div className="flex justify-center">
              <Button
                onClick={submit}
                disabled={!complete || isSubmitting}
                loading={isSubmitting}
                loadingText="Submitting..."
                className="h-12 w-full max-w-[600px]"
              >
                Submit Ticket
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Band({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-14 items-center justify-center bg-surface-overlay">
      <span className="text-[16px] font-semibold text-text-heading">{children}</span>
    </div>
  );
}

function AnswerCard({
  resolution,
  onResolved,
  onNeedHelp,
}: {
  resolution: FaqSuggestion;
  onResolved: () => void;
  onNeedHelp: () => void;
}) {
  return (
    <div className="rounded-[14px] border border-brand-primary/15 bg-surface-overlay p-5">
      <p className="text-[14px] font-semibold text-text-heading">
        We found something that might help
      </p>
      <p className="mt-2 text-[13px] leading-relaxed text-text-muted">
        {resolution.answer}
      </p>

      {resolution.links.length > 0 && (
        <div className="mt-3">
          <p className="text-[12px] font-semibold text-text-heading">
            Helpful resources:
          </p>
          <ul className="mt-1 flex flex-col gap-1">
            {resolution.links.map((link, index) => (
              <li key={index}>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[13px] text-brand-primary hover:underline cursor-pointer"
                >
                  {link.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onResolved}
          className="inline-flex h-10 items-center rounded-pill bg-[#22BB62] px-5 text-[13px] font-semibold text-white cursor-pointer"
        >
          This helped!
        </button>
        <button
          type="button"
          onClick={onNeedHelp}
          className="inline-flex h-10 items-center rounded-pill border border-border-subtle px-5 text-[13px] font-medium text-text-muted cursor-pointer hover:bg-surface-overlay"
        >
          I still need help
        </button>
      </div>
    </div>
  );
}

function NoticeBanner({ error }: { error: boolean }) {
  return (
    <div className="relative flex items-start gap-4 overflow-hidden rounded-[14px] bg-[#FFFBEB] p-5 shadow-[0px_0px_0px_1px_rgba(245,158,11,0.2)]">
      <span className="absolute inset-y-0 left-0 w-1 bg-[#F59E0B]" />
      <img
        src="/assets/icons/alert-circle.svg"
        alt=""
        className="w-10 h-10 shrink-0"
      />
      <div>
        <p className="text-[14px] font-semibold text-[#92400E]">
          {error ? "Let's get our team to help" : "We couldn't find a matching answer"}
        </p>
        <p className="mt-1 text-[12px] leading-[18px] text-[#78350F]">
          {error
            ? "Our instant help isn't reachable right now, but you can still submit your question below and our support team will get back to you."
            : "Go ahead and submit the details below — our support team will take it from here and reply soon."}
        </p>
      </div>
    </div>
  );
}

function CheckRow({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center gap-3 self-start cursor-pointer"
    >
      <span
        className={`flex size-5 shrink-0 items-center justify-center rounded-[4px] shadow-[0px_0px_0px_1.5px_rgba(193,198,215,0.7)] ${
          checked ? "bg-brand-primary" : "bg-white"
        }`}
      >
        {checked && (
          <img src="/assets/icons/check.svg" alt="" className="w-3 h-3" />
        )}
      </span>
      <span className="text-[12px] text-text-muted">{children}</span>
    </button>
  );
}
