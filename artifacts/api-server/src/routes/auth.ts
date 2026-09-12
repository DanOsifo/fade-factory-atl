import { Router } from "express";
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { allowLoginAttempt, clearLoginLockout, isLoginLocked, recordFailedLoginAttempt } from "../lib/auth";

const router = Router();

const DUMMY_PASSWORD_HASH = "$2a$12$Y2pekRnc73r.Qpe4XoucXuDFJrjssWozKUwf4RSSRpKlT2J/LsuQW";

import rateLimit from "express-rate-limit";

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts. Try again shortly." },
});

router.post("/auth/login", loginLimiter, async (req, res) => {
  const { username, password } = req.body as { username?: string; password?: string };

  if (!username || !password) {
    res.status(400).json({ error: "Username and password required" });
    return;
  }

  const clientIp = req.ip ?? req.socket.remoteAddress ?? "unknown";
  if (!allowLoginAttempt(clientIp)) {
    res.status(429).json({ error: "Too many login attempts. Try again shortly." });
    return;
  }

  const user = await db.query.usersTable.findFirst({
    where: eq(usersTable.username, username),
  });

  if (!user || isLoginLocked(user)) {
    await bcrypt.compare(password, user ? user.passwordHash : DUMMY_PASSWORD_HASH);
    res.status(401).json({ error: "Invalid username or password" });
    return;
  }

  const passwordMatch = await bcrypt.compare(password, user.passwordHash);

  if (!passwordMatch) {
    await recordFailedLoginAttempt(user.id, user.role as "barber" | "admin");
    res.status(401).json({ error: "Invalid username or password" });
    return;
  }

  await clearLoginLockout(user.id);

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