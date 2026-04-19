"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { login, register } from "@/lib/api";
import { setSession } from "@/lib/session";

export default function AuthPage() {
  const router = useRouter();
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("loginEmail") ?? "").trim();
    const password = String(formData.get("loginPassword") ?? "");

    try {
      const tokens = await login(email, password);
      setSession({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken });
      setMessage("Login successful. Redirecting to dashboard...");
      router.push("/dashboard");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("registerName") ?? "").trim();
    const email = String(formData.get("registerEmail") ?? "").trim();
    const password = String(formData.get("registerPassword") ?? "");

    try {
      await register(name, email, password);
      const tokens = await login(email, password);
      setSession({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken });
      setMessage("Registration successful. Redirecting to dashboard...");
      router.push("/dashboard");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Registration failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="stack-lg">
      {(message || error) && (
        <p className={error ? "notice error" : "notice success"}>{error || message}</p>
      )}

      <div className="grid two-col stack-lg">
      <section className="panel stack-md">
        <h1>Login</h1>
        <p className="muted">Use your Home Radar account credentials.</p>
        <form className="stack-sm" onSubmit={onLogin}>
          <label className="field">
            Email
            <input name="loginEmail" type="email" placeholder="you@email.com" required />
          </label>
          <label className="field">
            Password
            <input name="loginPassword" type="password" placeholder="Your password" required />
          </label>
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Login"}
          </button>
        </form>
      </section>

      <section className="panel stack-md">
        <h1>Register</h1>
        <p className="muted">Create your account and start configuring filters.</p>
        <form className="stack-sm" onSubmit={onRegister}>
          <label className="field">
            Name
            <input name="registerName" type="text" placeholder="Your name" required />
          </label>
          <label className="field">
            Email
            <input name="registerEmail" type="email" placeholder="you@email.com" required />
          </label>
          <label className="field">
            Password
            <input
              name="registerPassword"
              type="password"
              placeholder="Choose a password"
              minLength={8}
              required
            />
          </label>
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Create account"}
          </button>
        </form>
      </section>
      </div>
    </div>
  );
}
