import type { ReactNode } from "react";
import { ProtectedNav } from "@/components/navigation/protected-nav";

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-background text-foreground min-h-screen">
      <ProtectedNav />
      {children}
    </div>
  );
}
