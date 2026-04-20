import Link from "next/link";
import { ROUTES } from "@/app/nav-constants";

export function PublicNav() {
  return (
    <nav className="border-border/50 flex items-center justify-between border-b px-6 py-4">
      <Link href={ROUTES.public} className="text-primary text-xl font-bold">
        HomeRadar
      </Link>
      <div className="flex gap-4">
        <Link
          href={ROUTES.signIn}
          className="text-muted-foreground hover:text-primary"
        >
          Sign In
        </Link>
        <Link
          href={ROUTES.signUp}
          className="text-muted-foreground hover:text-primary"
        >
          Sign Up
        </Link>
      </div>
    </nav>
  );
}
