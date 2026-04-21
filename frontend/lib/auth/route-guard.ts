const SIGN_IN_PATH = "/sign-in";

export const PROTECTED_ROUTE_BASES = ["/dashboard", "/filters", "/profile"];

export const isProtectedPath = (pathname: string): boolean =>
  PROTECTED_ROUTE_BASES.some(
    (basePath) => pathname === basePath || pathname.startsWith(`${basePath}/`),
  );

export const buildSignInRedirectPath = (params: {
  pathname: string;
  search: string;
  hasSessionCookie: boolean;
}): string => {
  const query = new URLSearchParams();
  const searchValue = params.search.startsWith("?")
    ? params.search
    : params.search
      ? `?${params.search}`
      : "";

  query.set("returnTo", `${params.pathname}${searchValue}`);

  if (params.hasSessionCookie) {
    query.set("reason", "session_expired");
  }

  return `${SIGN_IN_PATH}?${query.toString()}`;
};
