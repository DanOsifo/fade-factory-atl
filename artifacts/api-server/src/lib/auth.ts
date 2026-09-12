import type { Request, Response, NextFunction } from "express";

declare module "express-session" {
  interface SessionData {
    userId: number;
    role: "barber" | "admin";
    barberId: number | null;
  }
}

const LOGIN_WINDOW_MS = 60 * 1000;
const LOGIN_MAX_ATTEMPTS_PER_IP = 20;
const loginAttempts = new Map<string, { count: number; windowStartedAt: number }>();

export function allowLoginAttempt(ip: string): boolean {
  const now = Date.now();
  if (loginAttempts.size > 10_000) {
    for (const [key, attempt] of loginAttempts) {
      if (now - attempt.windowStartedAt >= LOGIN_WINDOW_MS) loginAttempts.delete(key);
    }
  }
  const current = loginAttempts.get(ip);
  if (!current || now - current.windowStartedAt >= LOGIN_WINDOW_MS) {
    loginAttempts.set(ip, { count: 1, windowStartedAt: now });
    return true;
  }
  if (current.count >= LOGIN_MAX_ATTEMPTS_PER_IP) {
    return false;
  }
  current.count += 1;
  return true;
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.session.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.session.userId || req.session.role !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  next();
}

export function requireBarber(req: Request, res: Response, next: NextFunction): void {
  if (!req.session.userId || req.session.role !== "barber") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  next();
}
