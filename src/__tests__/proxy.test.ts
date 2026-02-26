/**
 * Tests for proxy routing logic (auth redirect rules).
 * We test the decision logic in isolation without needing a real HTTP server.
 */

// Replication of the proxy decision logic as pure functions for testing
function getRedirectTarget(
    isAuthenticated: boolean,
    pathname: string,
    userEmail: string | undefined,
    adminEmail: string
): string | null {
    // Not logged in, not on login → send to login
    if (!isAuthenticated && pathname !== "/login") return "/login";

    // Already logged in, trying to visit login → send to correct dashboard
    if (isAuthenticated && pathname === "/login") {
        return userEmail === adminEmail ? "/admin" : "/dashboard";
    }

    // Non-admin trying to access /admin
    if (pathname.startsWith("/admin")) {
        if (!isAuthenticated || userEmail !== adminEmail) return "/dashboard";
    }

    return null; // no redirect needed
}

const ADMIN_EMAIL = "admin@smartwallet.app";

describe("Proxy routing logic", () => {
    // ── Unauthenticated ──────────────────────────────────────────────────────

    it("redirects unauthenticated user to /login from /dashboard", () => {
        expect(getRedirectTarget(false, "/dashboard", undefined, ADMIN_EMAIL)).toBe("/login");
    });

    it("redirects unauthenticated user to /login from /admin", () => {
        expect(getRedirectTarget(false, "/admin", undefined, ADMIN_EMAIL)).toBe("/login");
    });

    it("does NOT redirect unauthenticated user on /login", () => {
        expect(getRedirectTarget(false, "/login", undefined, ADMIN_EMAIL)).toBeNull();
    });

    // ── Authenticated admin ──────────────────────────────────────────────────

    it("redirects admin from /login to /admin", () => {
        expect(getRedirectTarget(true, "/login", ADMIN_EMAIL, ADMIN_EMAIL)).toBe("/admin");
    });

    it("allows admin to access /admin without redirect", () => {
        expect(getRedirectTarget(true, "/admin", ADMIN_EMAIL, ADMIN_EMAIL)).toBeNull();
    });

    it("allows admin to access /admin/users without redirect", () => {
        expect(getRedirectTarget(true, "/admin/users", ADMIN_EMAIL, ADMIN_EMAIL)).toBeNull();
    });

    // ── Authenticated regular user ───────────────────────────────────────────

    it("redirects regular user from /login to /dashboard", () => {
        expect(getRedirectTarget(true, "/login", "user@example.com", ADMIN_EMAIL)).toBe("/dashboard");
    });

    it("blocks regular user from /admin → redirects to /dashboard", () => {
        expect(getRedirectTarget(true, "/admin", "user@example.com", ADMIN_EMAIL)).toBe("/dashboard");
    });

    it("blocks regular user from /admin/users → redirects to /dashboard", () => {
        expect(getRedirectTarget(true, "/admin/users", "user@example.com", ADMIN_EMAIL)).toBe("/dashboard");
    });

    it("allows regular user to access /dashboard without redirect", () => {
        expect(getRedirectTarget(true, "/dashboard", "user@example.com", ADMIN_EMAIL)).toBeNull();
    });

    it("allows regular user to access /dashboard/history without redirect", () => {
        expect(getRedirectTarget(true, "/dashboard/history", "user@example.com", ADMIN_EMAIL)).toBeNull();
    });

    it("allows regular user to access /dashboard/analytics without redirect", () => {
        expect(getRedirectTarget(true, "/dashboard/analytics", "user@example.com", ADMIN_EMAIL)).toBeNull();
    });
});
