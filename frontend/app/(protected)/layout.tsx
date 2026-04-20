import type { ReactNode } from "react";
import { ProtectedNav } from "@/components/navigation/protected-nav";

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <ProtectedNav />
      {children}
    </div>
  );
}
