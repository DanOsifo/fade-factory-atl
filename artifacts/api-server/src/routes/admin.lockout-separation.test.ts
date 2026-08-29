/**
 * Security invariant tests: password reset and lockout-clearing must remain
 * strictly separated operations in the admin routes.
 *
 * These tests inspect the actual source of admin.ts to ensure:
 *   PUT  /admin/users/:id/password  → calls db.update().set() with ONLY passwordHash
 *   POST /admin/users/:id/unlock    → calls db.update().set() with ONLY lockout fields
 *
 * Why source inspection rather than a runtime mock?
 *   The invariant lives entirely in which fields are passed to a single .set() call.
 *   A textual guard is simpler, faster, and catches the failure mode (someone adding
 *   a lockout field to the password handler) before any runtime execution.
 *
 * Run with:
 *   pnpm --filter @workspace/api-server run test
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCE = readFileSync(resolve(__dirname, "admin.ts"), "utf-8");

// ---------------------------------------------------------------------------
// Helpers: extract the body of each route handler from the source
// ---------------------------------------------------------------------------

/**
 * Extracts the source text of a route handler starting at a given signature.
 * Reads from the signature line up to (and including) the closing `});` that
 * ends the handler registered with router.<method>(..., async (...) => { ... }).
 */
function extractHandler(source: string, routeSignature: string): string {
  const startIdx = source.indexOf(routeSignature);
  assert.notEqual(
    startIdx,
    -1,
    `Could not locate handler for: ${routeSignature}`
  );

  let depth = 0;
  let inHandler = false;
  let end = startIdx;

  for (let i = startIdx; i < source.length; i++) {
    const ch = source[i];
    if (ch === "{") {
      depth++;
      inHandler = true;
    } else if (ch === "}") {
      depth--;
      if (inHandler && depth === 0) {
        end = i + 1;
        break;
      }
    }
  }

  return source.slice(startIdx, end);
}

// Identify each handler by its unique opening signature in admin.ts
const PASSWORD_HANDLER = extractHandler(
  SOURCE,
  'router.put("/users/:id/password"'
);

const UNLOCK_HANDLER = extractHandler(
  SOURCE,
  'router.post("/users/:id/unlock"'
);

// ---------------------------------------------------------------------------
// Utility: pull out the argument passed to .set(…) inside a handler block
// ---------------------------------------------------------------------------
function extractSetCallArgs(handlerSource: string): string {
  const setIdx = handlerSource.indexOf(".set({");
  assert.notEqual(
    setIdx,
    -1,
    "Expected a .set({ … }) call in handler:\n" + handlerSource
  );

  let depth = 0;
  let start = setIdx + ".set(".length; // points at opening {
  let end = start;

  for (let i = start; i < handlerSource.length; i++) {
    const ch = handlerSource[i];
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) {
        end = i + 1;
        break;
      }
    }
  }

  return handlerSource.slice(start, end);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("password reset endpoint (PUT /users/:id/password)", () => {
  const setArgs = extractSetCallArgs(PASSWORD_HANDLER);

  test("sets passwordHash", () => {
    assert.ok(
      setArgs.includes("passwordHash"),
      `Expected 'passwordHash' in .set() args. Got:\n${setArgs}`
    );
  });

  test("does NOT touch failedLoginAttempts", () => {
    assert.ok(
      !setArgs.includes("failedLoginAttempts"),
      `password reset must not reset failedLoginAttempts. Found in .set() args:\n${setArgs}`
    );
  });

  test("does NOT touch lockedUntil", () => {
    assert.ok(
      !setArgs.includes("lockedUntil"),
      `password reset must not clear lockedUntil. Found in .set() args:\n${setArgs}`
    );
  });

  test("sets ONLY passwordHash (no extra fields)", () => {
    // Normalise whitespace then extract property names from the object literal.
    // Handles both shorthand `{ passwordHash }` and explicit `{ passwordHash: x }`.
    const normalised = setArgs.replace(/\s+/g, " ").trim();
    // Remove the outer braces
    const inner = normalised.replace(/^\{/, "").replace(/\}$/, "").trim();
    // Split on commas to get individual property tokens
    const tokens = inner.split(",").map((t) => t.trim()).filter(Boolean);
    // Each token is either "key" (shorthand) or "key: value"
    const fields = tokens.map((t) => t.split(":")[0]!.trim());
    assert.deepEqual(
      fields,
      ["passwordHash"],
      `password reset .set() should contain only 'passwordHash'. Found keys: ${fields.join(", ")}`
    );
  });
});

describe("unlock endpoint (POST /users/:id/unlock)", () => {
  const setArgs = extractSetCallArgs(UNLOCK_HANDLER);

  test("clears failedLoginAttempts", () => {
    assert.ok(
      setArgs.includes("failedLoginAttempts"),
      `Expected 'failedLoginAttempts' in .set() args. Got:\n${setArgs}`
    );
  });

  test("clears lockedUntil", () => {
    assert.ok(
      setArgs.includes("lockedUntil"),
      `Expected 'lockedUntil' in .set() args. Got:\n${setArgs}`
    );
  });

  test("does NOT touch passwordHash", () => {
    assert.ok(
      !setArgs.includes("passwordHash"),
      `unlock must not alter the password hash. Found in .set() args:\n${setArgs}`
    );
  });
});
