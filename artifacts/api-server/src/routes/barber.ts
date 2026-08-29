import { Router } from "express";
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import { barbersTable, barberHoursTable, usersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { requireBarber } from "../lib/auth";

const router = Router();
router.use(requireBarber);

router.get("/me", async (req, res) => {
  const barberId = req.session.barberId;
  if (!barberId) {
    res.status(400).json({ error: "No barber profile linked to account" });
    return;
  }

  const barber = await db.query.barbersTable.findFirst({
    where: eq(barbersTable.id, barberId),
  });

  if (!barber) {
    res.status(404).json({ error: "Barber not found" });
    return;
  }

  const hours = await db
    .select()
    .from(barberHoursTable)
    .where(eq(barberHoursTable.barberId, barberId));

  res.json({ ...barber, hours });
});

router.put("/hours", async (req, res) => {
  const barberId = req.session.barberId;
  if (!barberId) {
    res.status(400).json({ error: "No barber profile linked to account" });
    return;
  }

  const hours = req.body as { dayOfWeek: number; openTime: string; closeTime: string; isClosed: boolean }[];

  for (const h of hours) {
    await db
      .insert(barberHoursTable)
      .values({ barberId, ...h })
      .onConflictDoUpdate({
        target: [barberHoursTable.barberId, barberHoursTable.dayOfWeek],
        set: { openTime: h.openTime, closeTime: h.closeTime, isClosed: h.isClosed },
      });
  }

  const updated = await db.select().from(barberHoursTable).where(eq(barberHoursTable.barberId, barberId));
  res.json(updated);
});

router.put("/password", async (req, res) => {
  const userId = req.session.userId;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const { currentPassword, newPassword } = req.body as { currentPassword: string; newPassword: string };
  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: "currentPassword and newPassword are required" });
    return;
  }
  if (newPassword.length < 6) {
    res.status(400).json({ error: "New password must be at least 6 characters" });
    return;
  }

  const user = await db.query.usersTable.findFirst({ where: eq(usersTable.id, userId) });
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) {
    res.status(403).json({ error: "Current password is incorrect" });
    return;
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await db.update(usersTable).set({ passwordHash }).where(eq(usersTable.id, userId));
  res.json({ ok: true });
});

router.put("/walk-ins", async (req, res) => {
  const barberId = req.session.barberId;
  if (!barberId) {
    res.status(400).json({ error: "No barber profile linked to account" });
    return;
  }

  const { walkInsOpen } = req.body as { walkInsOpen: boolean };
  const [updated] = await db
    .update(barbersTable)
    .set({ walkInsOpen })
    .where(eq(barbersTable.id, barberId))
    .returning();

  res.json(updated);
});

export default router;
