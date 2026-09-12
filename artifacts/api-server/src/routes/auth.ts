import { Router } from "express";
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { eq, sql } from "drizzle-orm";
import { allowLoginAttempt } from "../lib/auth";

const router = Router();

const MAX_FAILED_ATTEMPTS = 5;
const ADMIN_MAX_FAILED_ATTEMPTS = 10; // admins get a higher threshold
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const DUMMY_PASSWORD_HASH = "$2a$12$Y2pekRnc73r.Qpe4XoucXuDFJrjssWozKUwf4RSSRpKlT2J/LsuQW";

router.post("/auth/login", async (req, res) => {
  const { username, password } = req.body as { username?: string; password?: string };

  if (!username || !password) {
    res.status(400).json({ error: "Username and password required" });
    return;
  }

  if (!allowLoginAttempt(req.ip ?? "unknown")) {
    res.status(429).json({ error: "Too many login attempts. Try again shortly." });
    return;
  }

  const user = await db.query.usersTable.findFirst({
    where: eq(usersTable.username, username),
  });

  if (!user) {
    await bcrypt.compare(password, DUMMY_PASSWORD_HASH);
    res.status(401).json({ error: "Invalid username or password" });
    return;
  }

  // Check if account is currently locked
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    await bcrypt.compare(password, user.passwordHash);
    res.status(401).json({ error: "Invalid username or password" });
    return;
  }

  const passwordMatch = await bcrypt.compare(password, user.passwordHash);

  if (!passwordMatch) {
    const threshold = user.role === "admin" ? ADMIN_MAX_FAILED_ATTEMPTS : MAX_FAILED_ATTEMPTS;
    const [updatedUser] = await db
      .update(usersTable)
      .set({ failedLoginAttempts: sql`${usersTable.failedLoginAttempts} + 1` })
      .where(eq(usersTable.id, user.id))
      .returning({ failedLoginAttempts: usersTable.failedLoginAttempts });
    const newFailedAttempts = updatedUser?.failedLoginAttempts ?? user.failedLoginAttempts + 1;
    const shouldLock = newFailedAttempts >= threshold;
    const lockedUntil = shouldLock ? new Date(Date.now() + LOCKOUT_DURATION_MS) : null;

    if (shouldLock) {
      await db.update(usersTable)
        .set({ lockedUntil })
        .where(eq(usersTable.id, user.id));
    }

    if (shouldLock) {
      res.status(401).json({ error: "Invalid username or password" });
    } else {
      res.status(401).json({ error: "Invalid username or password" });
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
