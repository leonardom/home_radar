import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { buildSignInRedirectPath } from "@/lib/auth/route-guard";

const SESSION_COOKIE_NAME = "__session";

export const proxy = clerkMiddleware(async (auth, request) => {
  let isAuthenticated = false;

  try {
    const { userId } = await auth();
    isAuthenticated = Boolean(userId);
  } catch {
    isAuthenticated = false;
  }

  if (isAuthenticated) {
    return NextResponse.next();
  }

  const signInRedirectPath = buildSignInRedirectPath({
    pathname: request.nextUrl.pathname,
    search: request.nextUrl.search,
    hasSessionCookie: Boolean(request.cookies.get(SESSION_COOKIE_NAME)?.value),
  });

  return NextResponse.redirect(new URL(signInRedirectPath, request.url));
});

export const config = {
  matcher: ["/dashboard/:path*", "/filters/:path*", "/profile/:path*"],
};
