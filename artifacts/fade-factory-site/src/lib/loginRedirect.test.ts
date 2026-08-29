import { describe, it, expect } from "vitest";
import { resolveLoginRedirect } from "./loginRedirect";

describe("resolveLoginRedirect", () => {
  // ── Admin ────────────────────────────────────────────────────────────────

  it("sends an admin to /admin when the redirect param is /admin", () => {
    expect(resolveLoginRedirect("admin", "/admin")).toBe("/admin");
  });

  it("falls back to /admin when an admin has an empty redirect param", () => {
    expect(resolveLoginRedirect("admin", "")).toBe("/admin");
  });

  it("falls back to /admin when the redirect param is an unrecognised path", () => {
    expect(resolveLoginRedirect("admin", "/dashboard")).toBe("/admin");
  });

  it("falls back to /admin when an admin provides the barber path", () => {
    // Correct prefix, wrong role — must NOT be accepted
    expect(resolveLoginRedirect("admin", "/barber")).toBe("/admin");
  });

  it("falls back to /admin when the redirect param tries to escape (traversal attempt)", () => {
    expect(resolveLoginRedirect("admin", "/admin/../evil")).toBe("/admin");
  });

  // ── Barber ───────────────────────────────────────────────────────────────

  it("sends a barber to /barber when the redirect param is /barber", () => {
    expect(resolveLoginRedirect("barber", "/barber")).toBe("/barber");
  });

  it("falls back to /barber when a barber has an empty redirect param", () => {
    expect(resolveLoginRedirect("barber", "")).toBe("/barber");
  });

  it("falls back to /barber when the redirect param is an unrecognised path", () => {
    expect(resolveLoginRedirect("barber", "/profile")).toBe("/barber");
  });

  it("falls back to /barber when a barber provides the admin path", () => {
    // Correct prefix, wrong role — must NOT be accepted
    expect(resolveLoginRedirect("barber", "/admin")).toBe("/barber");
  });

  // ── Unknown role ─────────────────────────────────────────────────────────

  it("falls back to / for an unknown role", () => {
    expect(resolveLoginRedirect("superuser", "/superuser")).toBe("/");
  });
});
