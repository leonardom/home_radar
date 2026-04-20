import type { ReactNode } from "react";
import { AuthNav } from "@/components/navigation/auth-nav";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-background text-foreground min-h-screen">
      <AuthNav />
      {children}
    </div>
  );
}
