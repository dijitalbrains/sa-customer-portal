"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { replyToTicket } from "@/lib/actions/ticket.actions";
import type { TicketNotificationPref } from "@/lib/types/ticket";

interface ReplyBoxProps {
  ticketId: number;
  notifications: TicketNotificationPref[];
}

export default function ReplyBox({ ticketId, notifications }: ReplyBoxProps) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [previews, setPreviews] = useState<{ source: string; name: string }[]>([]);
  const [prefs, setPrefs] = useState(notifications);
  const [isSending, setIsSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  function togglePref(id: number, enabled: boolean) {
    setPrefs((prev) =>
      prev.map((pref) => (pref.id === id ? { ...pref, enabled } : pref)),
    );
  }

  async function send() {
    if (!message.trim() || isSending) return;
    setIsSending(true);
    try {
      await replyToTicket({
        ticketId,
        message,
        images,
        notifications: prefs.map((pref) => ({ id: pref.id, email: pref.enabled })),
      });
      toast.success("Your message has been sent, thank you!");
      setMessage("");
      setImages([]);
      setPreviews([]);
      router.refresh();
    } catch {
      toast.error("Could not send your reply. Please try again.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="border-t border-[rgba(193,198,215,0.4)] bg-[#F7F9FC] px-4 py-4">
      <textarea
        className="h-20 w-full resize-none rounded-[10px] bg-white p-3.5 text-[12px] text-text-primary placeholder:text-[#B0B8C1] shadow-[0px_0px_0px_1px_rgba(193,198,215,0.4)] focus:outline-none focus:border-brand-primary"
        placeholder="Write a reply..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex h-8 items-center gap-1.5 rounded-[8px] bg-[#F0F4F8] px-3.5 text-[11px] font-medium text-text-muted shadow-[0px_0px_0px_1px_rgba(193,198,215,0.4)] cursor-pointer"
        >
          <img src="/assets/icons/upload.svg" alt="" className="w-3 h-3" />
          Attach file
        </button>
        <span className="text-[11px] text-[#B0B8C1]">
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
        <div className="mt-3 flex flex-wrap gap-3">
          {previews.map((preview, index) => (
            <div key={index} className="relative">
              <img
                src={preview.source}
                alt={preview.name}
                className="w-16 h-16 rounded-[8px] border border-border-subtle object-cover"
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

      <div className="mt-3 flex items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          {prefs.map((pref) => (
            <button
              key={pref.id}
              type="button"
              onClick={() => togglePref(pref.id, !pref.enabled)}
              className="flex items-center gap-2.5 self-start cursor-pointer"
            >
              <span
                className={`flex size-4 shrink-0 items-center justify-center rounded-[4px] shadow-[0px_0px_0px_1px_rgba(193,198,215,0.4)] ${
                  pref.enabled ? "bg-brand-primary" : "bg-white"
                }`}
              >
                {pref.enabled && (
                  <img src="/assets/icons/check.svg" alt="" className="w-2.5 h-2.5" />
                )}
              </span>
              <span className="text-[11px] text-[#6B7280]">
                {pref.label} ({pref.email})
              </span>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={send}
          disabled={!message.trim() || isSending}
          className="inline-flex h-10 items-center justify-center rounded-pill bg-brand-gradient px-7 text-[13px] font-semibold text-white shadow-button cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSending ? "Sending..." : "Send Reply"}
        </button>
      </div>
    </div>
  );
}
