import { Router } from "express";
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router = Router();

const MAX_FAILED_ATTEMPTS = 5;
const ADMIN_MAX_FAILED_ATTEMPTS = 10; // admins get a higher threshold
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

router.post("/auth/login", async (req, res) => {
  const { username, password } = req.body as { username?: string; password?: string };

  if (!username || !password) {
    res.status(400).json({ error: "Username and password required" });
    return;
  }

  const user = await db.query.usersTable.findFirst({
    where: eq(usersTable.username, username),
  });

  if (!user) {
    res.status(401).json({ error: "Invalid username or password" });
    return;
  }

  // Check if account is currently locked
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
    res.status(423).json({
      error: `Account locked due to too many failed attempts. Try again in ${minutesLeft} minute${minutesLeft !== 1 ? "s" : ""}.`,
      lockedUntil: user.lockedUntil,
    });
    return;
  }

  const passwordMatch = await bcrypt.compare(password, user.passwordHash);

  if (!passwordMatch) {
    const threshold = user.role === "admin" ? ADMIN_MAX_FAILED_ATTEMPTS : MAX_FAILED_ATTEMPTS;
    const newFailedAttempts = (user.failedLoginAttempts ?? 0) + 1;
    const shouldLock = newFailedAttempts >= threshold;
    const lockedUntil = shouldLock ? new Date(Date.now() + LOCKOUT_DURATION_MS) : null;

    await db.update(usersTable)
      .set({
        failedLoginAttempts: newFailedAttempts,
        lockedUntil: lockedUntil ?? undefined,
      })
      .where(eq(usersTable.id, user.id));

    if (shouldLock) {
      res.status(423).json({
        error: `Too many failed attempts. Account locked for 15 minutes.`,
        lockedUntil,
      });
    } else {
      const attemptsLeft = threshold - newFailedAttempts;
      res.status(401).json({
        error: `Invalid username or password. ${attemptsLeft} attempt${attemptsLeft !== 1 ? "s" : ""} remaining before lockout.`,
      });
    }
    return;
  }

  // Successful login — reset lockout state
  await db.update(usersTable)
    .set({ failedLoginAttempts: 0, lockedUntil: null })
    .where(eq(usersTable.id, user.id));

  req.session.userId = user.id;
  req.session.role = user.role as "barber" | "admin";
  req.session.barberId = user.barberId ?? null;

  res.json({ userId: user.id, role: user.role, barberId: user.barberId });
});

router.post("/auth/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.json({ ok: true });
  });
});

router.get("/auth/me", (req, res) => {
  if (!req.session.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  res.json({
    userId: req.session.userId,
    role: req.session.role,
    barberId: req.session.barberId,
  });
});

export default router;
