import type { Request, Response, NextFunction } from "express";

declare module "express-session" {
  interface SessionData {
    userId: number;
    role: "barber" | "admin";
    barberId: number | null;
  }
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
