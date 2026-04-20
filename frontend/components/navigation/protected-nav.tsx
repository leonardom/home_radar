import Link from "next/link";
import { ROUTES } from "@/app/nav-constants";

export function ProtectedNav() {
  return (
    <nav className="flex items-center justify-between py-4 px-6 border-b border-border/50">
      <Link href={ROUTES.dashboard} className="font-bold text-xl text-primary">
        HomeRadar
      </Link>
      <div className="flex gap-4">
        <Link href={ROUTES.dashboard} className="text-muted-foreground hover:text-primary">
          Dashboard
        </Link>
        <Link href={ROUTES.public} className="text-muted-foreground hover:text-primary">
          Log Out
        </Link>
      </div>
    </nav>
  );
}
