import Link from "next/link";
import { ROUTES } from "@/app/nav-constants";

export function PublicNav() {
  return (
    <nav className="flex items-center justify-between py-4 px-6 border-b border-border/50">
      <Link href={ROUTES.public} className="font-bold text-xl text-primary">
        HomeRadar
      </Link>
      <div className="flex gap-4">
        <Link href={ROUTES.signIn} className="text-muted-foreground hover:text-primary">
          Sign In
        </Link>
        <Link href={ROUTES.signUp} className="text-muted-foreground hover:text-primary">
          Sign Up
        </Link>
      </div>
    </nav>
  );
}
