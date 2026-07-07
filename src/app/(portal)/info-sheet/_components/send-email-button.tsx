"use client";

import { toast } from "react-toastify";
import Button from "@/components/ui/button";
import { useConfirmation } from "@/components/providers/confirmation-provider";
import { sendInfoSheetEmail } from "@/lib/actions/info-sheet.actions";

interface SendEmailButtonProps {
  email: string;
}

export default function SendEmailButton({ email }: SendEmailButtonProps) {
  const { confirm } = useConfirmation();

  function handleClick() {
    confirm({
      title: "Send Email",
      description: `Are you sure you want to send the customer info sheet to ${email}?`,
      confirmText: "Send",
      onConfirm: async () => {
        try {
          const { ok } = await sendInfoSheetEmail();
          if (ok) {
            toast.success("Customer info sheet sent to your email.");
          } else {
            toast.error("Failed to send email. Please try again.");
          }
        } catch {
          toast.error("Failed to send email. Please try again.");
        }
      },
    });
  }

  return (
    <Button variant="primary" size="sm" onClick={handleClick}>
      Send Email
    </Button>
  );
}
