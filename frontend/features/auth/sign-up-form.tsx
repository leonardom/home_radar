"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  authSignUpFormSchema,
  type AuthSignUpFormValues,
} from "@/features/auth/auth-form.schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getFieldErrorMessage } from "@/lib/forms/validation";

export default function SignUpForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
  } = useForm<AuthSignUpFormValues>({
    resolver: zodResolver(authSignUpFormSchema),
    mode: "onChange",
  });

  const onSubmit = async (data: AuthSignUpFormValues) => {
    // TODO: Replace with actual sign-up logic (API call, Clerk, etc.)
    void data;
  };

  return (
    <form
      className="mx-auto max-w-md space-y-6 rounded-lg border p-8 shadow"
      onSubmit={handleSubmit(onSubmit)}
      noValidate
    >
      <h1 className="mb-4 text-2xl font-bold">Create your account</h1>
      <div className="space-y-2">
        <label htmlFor="name" className="block font-medium">
          Name
        </label>
        <Input
          id="name"
          {...register("name")}
          aria-invalid={!!errors.name}
          aria-describedby="name-error"
          autoComplete="name"
          disabled={isSubmitting}
        />
        {errors.name && (
          <p id="name-error" className="text-destructive text-sm">
            {getFieldErrorMessage(errors, "name")}
          </p>
        )}
      </div>
      <div className="space-y-2">
        <label htmlFor="email" className="block font-medium">
          Email
        </label>
        <Input
          id="email"
          type="email"
          {...register("email")}
          aria-invalid={!!errors.email}
          aria-describedby="email-error"
          autoComplete="email"
          disabled={isSubmitting}
        />
        {errors.email && (
          <p id="email-error" className="text-destructive text-sm">
            {getFieldErrorMessage(errors, "email")}
          </p>
        )}
      </div>
      <div className="space-y-2">
        <label htmlFor="password" className="block font-medium">
          Password
        </label>
        <Input
          id="password"
          type="password"
          {...register("password")}
          aria-invalid={!!errors.password}
          aria-describedby="password-error"
          autoComplete="new-password"
          disabled={isSubmitting}
        />
        {errors.password && (
          <p id="password-error" className="text-destructive text-sm">
            {getFieldErrorMessage(errors, "password")}
          </p>
        )}
      </div>
      <Button
        type="submit"
        disabled={!isValid || isSubmitting}
        className="w-full"
      >
        {isSubmitting ? "Creating account..." : "Sign Up"}
      </Button>
    </form>
  );
}
