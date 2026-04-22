"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import FormField from "@/components/ui/form-field";
import TitledCard from "./titled-card";
import { LockIcon } from "./icons";
import { changePasswordSchema, type ChangePasswordInput } from "@/lib/validation/account";
import { updatePassword } from "@/lib/actions/user.actions";

export default function ChangePassword() {
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty, isValid },
    reset,
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    mode: "onChange",
    defaultValues: { oldPassword: "", newPassword: "", confirmPassword: "" },
  });

  const onSubmit = (data: ChangePasswordInput) => {
    startTransition(async () => {
      try {
        await updatePassword(data);
        reset();
        toast.success("Password updated");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to update password");
      }
    });
  };

  return (
    <TitledCard icon={<LockIcon />} title="Security & Password">
      <form onSubmit={handleSubmit(onSubmit)} className="p-6 flex flex-col gap-3">
        <FormField
          label="Current Password"
          type="password"
          placeholder="••••••••••"
          {...register("oldPassword")}
          error={errors.oldPassword?.message}
        />
        <FormField
          label="New Password"
          type="password"
          placeholder="••••••••••"
          {...register("newPassword")}
          error={errors.newPassword?.message}
        />
        <FormField
          label="Confirm New Password"
          type="password"
          placeholder="••••••••••"
          {...register("confirmPassword")}
          error={errors.confirmPassword?.message}
        />

        <button
          type="submit"
          disabled={pending || !isDirty || !isValid}
          className="h-11 w-full rounded-pill bg-brand-gradient text-white text-[14px] font-semibold hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {pending ? "Updating..." : "Update Password"}
        </button>
      </form>
    </TitledCard>
  );
}
