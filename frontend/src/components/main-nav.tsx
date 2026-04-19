"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { logout } from "@/lib/api";
import { clearSession, getSession } from "@/lib/session";

export default function MainNav() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onLogout = async () => {
    const session = getSession();
    setIsSubmitting(true);

    try {
      if (session) {
        await logout(session.refreshToken);
      }
    } catch {
      // Client-side session should still be removed even if API logout fails.
    } finally {
      clearSession();
      setIsSubmitting(false);
      router.push("/auth");
    }
  };

  return (
    <nav className="main-nav" aria-label="Main navigation">
      <Link href="/auth">Login/Register</Link>
      <Link href="/dashboard">Dashboard</Link>
      <Link href="/filters">Filter settings</Link>
      <Link href="/saved-listings">Saved listings</Link>
      <button
        type="button"
        onClick={() => void onLogout()}
        disabled={isSubmitting}
      >
        {isSubmitting ? "Logging out..." : "Logout"}
      </button>
    </nav>
  );
}
