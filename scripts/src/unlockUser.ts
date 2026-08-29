/**
 * CLI script to unlock a locked-out user account.
 *
 * Usage:
 *   pnpm --filter @workspace/scripts unlock-user <username>
 *
 * This resets failedLoginAttempts to 0 and clears lockedUntil for the given
 * username without requiring an active admin session — useful when the admin
 * account itself is locked out.
 */

import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const [, , username] = process.argv;

if (!username) {
  console.error("Usage: pnpm --filter @workspace/scripts unlock-user <username>");
  process.exit(1);
}

async function unlockUser(target: string) {
  const user = await db.query.usersTable.findFirst({
    where: eq(usersTable.username, target),
  });

  if (!user) {
    console.error(`❌ No user found with username "${target}".`);
    process.exit(1);
  }

  if (!user.lockedUntil && (user.failedLoginAttempts ?? 0) === 0) {
    console.log(`ℹ️  User "${target}" is not locked out. Nothing to do.`);
    process.exit(0);
  }

  await db
    .update(usersTable)
    .set({ failedLoginAttempts: 0, lockedUntil: null })
    .where(eq(usersTable.id, user.id));

  console.log(`✅ User "${target}" (role: ${user.role}) has been unlocked.`);
  process.exit(0);
}

unlockUser(username).catch((err) => {
  console.error("Unlock failed:", err);
  process.exit(1);
});
