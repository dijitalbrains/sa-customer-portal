"use client";

import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import FormField from "@/components/ui/form-field";
import PhoneField from "@/components/ui/phone-field";
import TitledCard from "./titled-card";
import { UserIcon } from "./icons";
import { personalInfoSchema, type PersonalInfoInput } from "@/lib/validation/account";
import { updatePersonalInfo } from "@/lib/actions/user.actions";
import type { UserAccount } from "@/lib/types/user";

interface PersonalInfoProps {
  user: UserAccount;
}

export default function PersonalInfo({ user }: PersonalInfoProps) {
  const [pending, startTransition] = useTransition();
  const [phoneValid, setPhoneValid] = useState(true);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isDirty, isValid },
    reset,
    setError,
    clearErrors,
    trigger,
  } = useForm<PersonalInfoInput>({
    resolver: zodResolver(personalInfoSchema),
    mode: "onChange",
    defaultValues: {
      firstname: user.firstname,
      lastname: user.lastname,
      phone: user.phone,
      email: user.email,
    },
  });

  const onSubmit = (data: PersonalInfoInput) => {
    if (!phoneValid) {
      setError("phone", { type: "manual", message: "Please enter a valid phone number" });
      return;
    }

    startTransition(async () => {
      try {
        await updatePersonalInfo(data);
        reset(data, { keepValues: true });
        await trigger();
        toast.success("Profile updated Successfully");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to update profile");
      }
    });
  };

  return (
    <TitledCard icon={<UserIcon />} title="Personal Information">
      <form onSubmit={handleSubmit(onSubmit)} className="p-6 flex flex-col gap-3">
        <FormField label="First Name" {...register("firstname")} error={errors.firstname?.message} />
        <FormField label="Last Name" {...register("lastname")} error={errors.lastname?.message} />
        <Controller
          control={control}
          name="phone"
          render={({ field }) => (
            <PhoneField
              label="Phone Number"
              value={field.value}
              onChange={(num) => {
                field.onChange(num);
                clearErrors("phone");
              }}
              onBlur={() => {
                field.onBlur();
                if (!phoneValid && field.value) {
                  setError("phone", { type: "manual", message: "Please enter a valid phone number" });
                }
              }}
              onValidityChange={(valid) => {
                setPhoneValid(valid);
                if (valid) clearErrors("phone");
              }}
              error={errors.phone?.message}
            />
          )}
        />
        <FormField label="Email Address" type="email" {...register("email")} error={errors.email?.message} />

        <button
          type="submit"
          disabled={pending || !isDirty || !isValid || !phoneValid}
          className="h-11 w-full rounded-pill bg-brand-gradient text-white text-[14px] font-semibold hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {pending ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </TitledCard>
  );
}
