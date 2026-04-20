import { zodResolver } from "@hookform/resolvers/zod";
import type { FieldErrors, UseFormSetError } from "react-hook-form";
import type { z } from "zod";
import {
  authSignInFormSchema,
  authSignUpFormSchema,
} from "@/features/auth/auth-form.schemas";
import {
  createFilterFormSchema,
  updateFilterFormSchema,
} from "@/features/filters/filter-form.schemas";

type ValidationIssue = {
  path?: string;
  message: string;
};

export const authSignInResolver = zodResolver(authSignInFormSchema);
export const authSignUpResolver = zodResolver(authSignUpFormSchema);
export const createFilterResolver = zodResolver(createFilterFormSchema);
export const updateFilterResolver = zodResolver(updateFilterFormSchema);

export const mapServerValidationErrorsToForm = <
  TValues extends Record<string, unknown>,
>(
  issues: ValidationIssue[] | undefined,
  setError: UseFormSetError<TValues>,
): void => {
  if (!issues || issues.length === 0) {
    return;
  }

  for (const issue of issues) {
    const field = issue.path as keyof TValues | undefined;
    if (!field) {
      continue;
    }

    setError(field, {
      type: "server",
      message: issue.message,
    });
  }
};

export const getFieldErrorMessage = <TSchema extends z.ZodRawShape>(
  errors: FieldErrors<z.infer<z.ZodObject<TSchema>>>,
  fieldName: keyof z.infer<z.ZodObject<TSchema>>,
): string | undefined => {
  const error = errors[fieldName];
  if (!error || typeof error !== "object") {
    return undefined;
  }

  return "message" in error && typeof error.message === "string"
    ? error.message
    : undefined;
};
