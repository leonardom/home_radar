"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { Menu, X } from "lucide-react";
import { useAuth, useClerk, useUser } from "@clerk/nextjs";
import { ROUTES } from "@/app/nav-constants";
import { publicEnv } from "@/lib/env";
import { clearStoredBackendTokens } from "@/features/auth/token-storage";

type HeaderMode = "auto" | "loggedOut" | "loggedIn";

type NavItem = {
  label: string;
  href: string;
};

type AppHeaderProps = {
  mode?: HeaderMode;
};

const LOGGED_OUT_NAV_ITEMS: NavItem[] = [
  { label: "Sign In", href: ROUTES.signIn },
  { label: "Register", href: ROUTES.signUp },
];

const LOGGED_IN_NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: ROUTES.dashboard },
  { label: "Filters", href: ROUTES.filters },
  { label: "Saved Properties", href: ROUTES.savedProperties },
];

const linkClasses = (active: boolean): string =>
  [
    "rounded-md px-2 py-1 text-sm transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
    active
      ? "text-primary bg-primary/10 font-medium"
      : "text-muted-foreground hover:text-primary",
  ].join(" ");

const isActivePath = (pathname: string, href: string): boolean => {
  if (href === ROUTES.dashboard) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return pathname === href;
};

function LoggedOutHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="border-border/50 border-b px-4 py-4 md:px-6">
      <div className="flex items-center justify-between">
        <Link
          href={ROUTES.public}
          className="text-primary focus-visible:ring-primary rounded-md text-xl font-bold focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          HomeRadar
        </Link>

        <div className="hidden items-center gap-3 md:flex" aria-label="Primary">
          {LOGGED_OUT_NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={
                isActivePath(pathname, item.href) ? "page" : undefined
              }
              className={linkClasses(isActivePath(pathname, item.href))}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <button
          type="button"
          className="text-muted-foreground hover:text-primary focus-visible:ring-primary rounded-md p-2 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none md:hidden"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          aria-controls="logged-out-mobile-menu"
          onClick={() => setMobileOpen((open) => !open)}
        >
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {mobileOpen && (
        <div id="logged-out-mobile-menu" className="mt-3 space-y-1 md:hidden">
          {LOGGED_OUT_NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={
                isActivePath(pathname, item.href) ? "page" : undefined
              }
              className={`${linkClasses(isActivePath(pathname, item.href))} block`}
              onClick={() => setMobileOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}

function ClerkAwareHeader({ mode = "auto" }: AppHeaderProps) {
  const pathname = usePathname();
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const { signOut } = useClerk();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const loggedIn = mode === "loggedIn" || (mode === "auto" && isSignedIn);
  const navItems = loggedIn ? LOGGED_IN_NAV_ITEMS : LOGGED_OUT_NAV_ITEMS;

  const initials = useMemo(() => {
    if (!user) {
      return "HR";
    }

    const fullName = user.fullName?.trim();
    if (fullName) {
      return fullName
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
    }

    const email = user.primaryEmailAddress?.emailAddress ?? "";
    return email.slice(0, 2).toUpperCase() || "HR";
  }, [user]);

  const handleLogout = async () => {
    clearStoredBackendTokens();
    setMobileOpen(false);
    setProfileOpen(false);
    await signOut({ redirectUrl: ROUTES.public });
  };

  return (
    <nav className="border-border/50 border-b px-4 py-4 md:px-6">
      <div className="flex items-center justify-between gap-4">
        <Link
          href={loggedIn ? ROUTES.dashboard : ROUTES.public}
          className="text-primary focus-visible:ring-primary rounded-md text-xl font-bold focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          HomeRadar
        </Link>

        <div className="hidden items-center gap-2 md:flex" aria-label="Primary">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={
                isActivePath(pathname, item.href) ? "page" : undefined
              }
              className={linkClasses(isActivePath(pathname, item.href))}
            >
              {item.label}
            </Link>
          ))}

          {loggedIn && (
            <div className="relative">
              <button
                type="button"
                className="border-border text-foreground hover:bg-muted focus-visible:ring-primary rounded-full border px-3 py-1 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                aria-label="Open profile menu"
                aria-expanded={profileOpen}
                aria-haspopup="menu"
                onClick={() => setProfileOpen((open) => !open)}
              >
                {initials}
              </button>
              {profileOpen && (
                <div
                  className="bg-background border-border absolute right-0 z-20 mt-2 w-48 rounded-md border p-1 shadow-lg"
                  role="menu"
                >
                  <Link
                    href={ROUTES.profile}
                    className={`${linkClasses(isActivePath(pathname, ROUTES.profile))} block`}
                    role="menuitem"
                    onClick={() => setProfileOpen(false)}
                  >
                    Profile
                  </Link>
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-primary focus-visible:ring-primary w-full rounded-md px-2 py-1 text-left text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                    role="menuitem"
                    onClick={handleLogout}
                  >
                    Log Out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <button
          type="button"
          className="text-muted-foreground hover:text-primary focus-visible:ring-primary rounded-md p-2 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none md:hidden"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          aria-controls="mobile-menu"
          onClick={() => setMobileOpen((open) => !open)}
        >
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {mobileOpen && (
        <div id="mobile-menu" className="mt-3 space-y-1 md:hidden">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={
                isActivePath(pathname, item.href) ? "page" : undefined
              }
              className={`${linkClasses(isActivePath(pathname, item.href))} block`}
              onClick={() => setMobileOpen(false)}
            >
              {item.label}
            </Link>
          ))}

          {loggedIn && (
            <>
              <Link
                href={ROUTES.profile}
                aria-current={
                  isActivePath(pathname, ROUTES.profile) ? "page" : undefined
                }
                className={`${linkClasses(isActivePath(pathname, ROUTES.profile))} block`}
                onClick={() => setMobileOpen(false)}
              >
                Profile
              </Link>
              <button
                type="button"
                className="text-muted-foreground hover:text-primary focus-visible:ring-primary w-full rounded-md px-2 py-1 text-left text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                onClick={handleLogout}
              >
                Log Out
              </button>
            </>
          )}
        </div>
      )}
    </nav>
  );
}

export function AppHeader({ mode = "auto" }: AppHeaderProps) {
  if (!publicEnv.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return <LoggedOutHeader />;
  }

  return <ClerkAwareHeader mode={mode} />;
}
