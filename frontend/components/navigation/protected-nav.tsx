import Link from "next/link";
import { ROUTES } from "@/app/nav-constants";

export function ProtectedNav() {
  return (
    <nav className="border-border/50 flex items-center justify-between border-b px-6 py-4">
      <Link href={ROUTES.dashboard} className="text-primary text-xl font-bold">
        HomeRadar
      </Link>
      <div className="flex gap-4">
        <Link
          href={ROUTES.dashboard}
          className="text-muted-foreground hover:text-primary"
        >
          Dashboard
        </Link>
        <Link
          href={ROUTES.public}
          className="text-muted-foreground hover:text-primary"
        >
          Log Out
        </Link>
      </div>
    </nav>
  );
}
