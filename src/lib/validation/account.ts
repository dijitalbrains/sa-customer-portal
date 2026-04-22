import { z } from "zod";

export const personalInfoSchema = z.object({
  firstname: z.string().trim().min(1, "First name is required").max(255),
  lastname: z.string().trim().min(1, "Last name is required").max(255),
  email: z.string().trim().email("Invalid email").max(255),
  phone: z.string().trim().min(1, "Phone is required").max(255),
});

export const changePasswordSchema = z
  .object({
    oldPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type PersonalInfoInput = z.infer<typeof personalInfoSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
