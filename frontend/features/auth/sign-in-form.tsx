"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { isClerkAPIResponseError, useSignIn } from "@clerk/nextjs";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  authSignInFormSchema,
  type AuthSignInFormValues,
} from "@/features/auth/auth-form.schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getFieldErrorMessage } from "@/lib/forms/validation";

const FALLBACK_REDIRECT = "/dashboard";

export default function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoaded, signIn, setActive } = useSignIn();

  const returnTo = searchParams.get("returnTo") || FALLBACK_REDIRECT;

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting, isValid },
  } = useForm<AuthSignInFormValues>({
    resolver: zodResolver(authSignInFormSchema),
    mode: "onChange",
  });

  const onSubmit = async (values: AuthSignInFormValues) => {
    if (!isLoaded) {
      return;
    }

    try {
      const result = await signIn.create({
        identifier: values.email,
        password: values.password,
      });

      if (result.status !== "complete" || !result.createdSessionId) {
        setError("root", {
          type: "server",
          message: "Sign-in requires additional steps. Please try again.",
        });
        return;
      }

      await setActive({ session: result.createdSessionId });
      router.replace(returnTo);
      router.refresh();
    } catch (error: unknown) {
      if (isClerkAPIResponseError(error) && error.errors.length > 0) {
        setError("root", {
          type: "server",
          message: error.errors[0]?.longMessage || "Unable to sign in.",
        });
        return;
      }

      setError("root", {
        type: "server",
        message: "Unable to sign in right now. Please try again.",
      });
    }
  };

  return (
    <form
      className="mx-auto max-w-md space-y-6 rounded-lg border p-8 shadow"
      onSubmit={handleSubmit(onSubmit)}
      noValidate
    >
      <h1 className="mb-4 text-2xl font-bold">Welcome back</h1>
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
          autoComplete="current-password"
          disabled={isSubmitting}
        />
        {errors.password && (
          <p id="password-error" className="text-destructive text-sm">
            {getFieldErrorMessage(errors, "password")}
          </p>
        )}
      </div>

      {errors.root?.message && (
        <p className="text-destructive text-sm" role="alert">
          {errors.root.message}
        </p>
      )}

      <Button
        type="submit"
        className="w-full"
        disabled={!isLoaded || !isValid || isSubmitting}
      >
        {isSubmitting ? "Signing in..." : "Sign In"}
      </Button>

      <p className="text-muted-foreground text-center text-sm">
        Don&apos;t have an account?{" "}
        <Link href="/sign-up" className="text-foreground underline">
          Create one
        </Link>
      </p>
    </form>
  );
}
