import type { ReactNode } from "react";
import { PublicNav } from "@/components/navigation/public-nav";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-background text-foreground min-h-screen">
      <PublicNav />
      {children}
    </div>
  );
}
