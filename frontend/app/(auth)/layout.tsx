import type { ReactNode } from "react";
import { AuthNav } from "@/components/navigation/auth-nav";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <AuthNav />
      {children}
    </div>
  );
}
