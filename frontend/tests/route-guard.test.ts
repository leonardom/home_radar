import {
  buildSignInRedirectPath,
  isProtectedPath,
} from "../lib/auth/route-guard";

describe("FE-9 route guard helpers", () => {
  it("marks dashboard, filters, and profile as protected", () => {
    expect(isProtectedPath("/dashboard")).toBe(true);
    expect(isProtectedPath("/dashboard/stats")).toBe(true);
    expect(isProtectedPath("/filters")).toBe(true);
    expect(isProtectedPath("/filters/new")).toBe(true);
    expect(isProtectedPath("/profile")).toBe(true);
    expect(isProtectedPath("/profile/security")).toBe(true);
    expect(isProtectedPath("/")).toBe(false);
    expect(isProtectedPath("/sign-in")).toBe(false);
  });

  it("builds sign-in redirect URL with returnTo for unauthenticated users", () => {
    const redirectPath = buildSignInRedirectPath({
      pathname: "/dashboard",
      search: "?tab=recent",
      hasSessionCookie: false,
    });

    expect(redirectPath).toBe("/sign-in?returnTo=%2Fdashboard%3Ftab%3Drecent");
  });

  it("includes session_expired reason when stale session cookie exists", () => {
    const redirectPath = buildSignInRedirectPath({
      pathname: "/profile",
      search: "",
      hasSessionCookie: true,
    });

    expect(redirectPath).toContain("returnTo=%2Fprofile");
    expect(redirectPath).toContain("reason=session_expired");
  });
});
