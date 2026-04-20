import type { ReactNode } from "react";
import { PublicNav } from "@/components/navigation/public-nav";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicNav />
      {children}
    </div>
  );
}
