/**
 * Determines where to navigate after a successful login.
 *
 * Valid staff destinations are an explicit whitelist — any unrecognised or
 * tampered redirect param falls back to the role's default landing page.
 */

const VALID_PATHS_BY_ROLE: Record<string, Set<string>> = {
  admin: new Set(["/admin"]),
  barber: new Set(["/barber"]),
};

const DEFAULT_PATH_BY_ROLE: Record<string, string> = {
  admin: "/admin",
  barber: "/barber",
};

/**
 * Returns the path to navigate to after login.
 *
 * @param role        - Role returned by the auth API ("admin" | "barber")
 * @param redirectParam - The `redirect` query-param value (may be empty string)
 */
export function resolveLoginRedirect(role: string, redirectParam: string): string {
  const defaultPath = DEFAULT_PATH_BY_ROLE[role] ?? "/";
  const validPaths = VALID_PATHS_BY_ROLE[role];
  if (validPaths && validPaths.has(redirectParam)) {
    return redirectParam;
  }
  return defaultPath;
}
