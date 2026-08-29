import { Router } from "express";
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import {
  barbersTable,
  barberHoursTable,
  siteContentTable,
  galleryImagesTable,
  usersTable,
} from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "../lib/auth";

const router = Router();
router.use(requireAdmin);

router.get("/barbers", async (_req, res) => {
  const barbers = await db.select().from(barbersTable);
  res.json(barbers);
});

router.post("/barbers", async (req, res) => {
  const { name, title, bio, photoUrl, specialties, accentColor, sortOrder } =
    req.body as {
      name: string;
      title: string;
      bio?: string;
      photoUrl?: string;
      specialties?: string[];
      accentColor?: string;
      sortOrder?: number;
    };

  const [barber] = await db
    .insert(barbersTable)
    .values({
      name,
      title,
      bio: bio ?? "",
      photoUrl: photoUrl ?? "",
      specialties: specialties ?? [],
      accentColor: accentColor ?? "#DB2100",
      sortOrder: sortOrder ?? 0,
    })
    .returning();

  res.status(201).json(barber);
});

router.put("/barbers/:id", async (req, res) => {
  const id = Number(req.params["id"]);
  const { name, title, bio, photoUrl, specialties, accentColor, active, sortOrder, walkInsOpen } =
    req.body as {
      name?: string;
      title?: string;
      bio?: string;
      photoUrl?: string;
      specialties?: string[];
      accentColor?: string;
      active?: boolean;
      sortOrder?: number;
      walkInsOpen?: boolean;
    };

  const updates: Partial<typeof barbersTable.$inferInsert> = {};
  if (name !== undefined) updates.name = name;
  if (title !== undefined) updates.title = title;
  if (bio !== undefined) updates.bio = bio;
  if (photoUrl !== undefined) updates.photoUrl = photoUrl;
  if (specialties !== undefined) updates.specialties = specialties;
  if (accentColor !== undefined) updates.accentColor = accentColor;
  if (active !== undefined) updates.active = active;
  if (sortOrder !== undefined) updates.sortOrder = sortOrder;
  if (walkInsOpen !== undefined) updates.walkInsOpen = walkInsOpen;

  const [updated] = await db.update(barbersTable).set(updates).where(eq(barbersTable.id, id)).returning();
  if (!updated) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(updated);
});

router.delete("/barbers/:id", async (req, res) => {
  const id = Number(req.params["id"]);
  await db.delete(usersTable).where(eq(usersTable.barberId, id));
  await db.delete(barbersTable).where(eq(barbersTable.id, id));
  res.json({ ok: true });
});

router.get("/barbers/:id/hours", async (req, res) => {
  const id = Number(req.params["id"]);
  const hours = await db
    .select()
    .from(barberHoursTable)
    .where(eq(barberHoursTable.barberId, id));
  res.json(hours);
});

router.put("/barbers/:id/hours", async (req, res) => {
  const barberId = Number(req.params["id"]);
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

router.put("/content/:key", async (req, res) => {
  const { value } = req.body as { value: string };
  await db
    .insert(siteContentTable)
    .values({ key: req.params["key"]!, value })
    .onConflictDoUpdate({ target: siteContentTable.key, set: { value } });
  res.json({ key: req.params["key"], value });
});

router.get("/gallery", async (_req, res) => {
  const images = await db.select().from(galleryImagesTable).orderBy(galleryImagesTable.slot);
  res.json(images);
});

router.put("/gallery/:slot", async (req, res) => {
  const slot = Number(req.params["slot"]);
  const { url, alt } = req.body as { url: string; alt?: string };

  await db
    .insert(galleryImagesTable)
    .values({ slot, url, alt: alt ?? "Fade Factory ATL" })
    .onConflictDoUpdate({
      target: galleryImagesTable.slot,
      set: { url, alt: alt ?? "Fade Factory ATL" },
    });

  res.json({ slot, url });
});

router.delete("/gallery/:slot", async (req, res) => {
  const slot = Number(req.params["slot"]);
  await db.delete(galleryImagesTable).where(eq(galleryImagesTable.slot, slot));
  res.json({ ok: true });
});

router.get("/users", async (_req, res) => {
  const users = await db.select({
    id: usersTable.id,
    username: usersTable.username,
    role: usersTable.role,
    barberId: usersTable.barberId,
    failedLoginAttempts: usersTable.failedLoginAttempts,
    lockedUntil: usersTable.lockedUntil,
  }).from(usersTable);
  res.json(users);
});

router.post("/users", async (req, res) => {
  const { username, password, role, barberId } = req.body as {
    username: string;
    password: string;
    role: "barber" | "admin";
    barberId?: number;
  };
  const passwordHash = await bcrypt.hash(password, 12);
  const [user] = await db
    .insert(usersTable)
    .values({ username, passwordHash, role, barberId: barberId ?? null })
    .returning({ id: usersTable.id, username: usersTable.username, role: usersTable.role, barberId: usersTable.barberId, failedLoginAttempts: usersTable.failedLoginAttempts, lockedUntil: usersTable.lockedUntil });
  res.status(201).json(user);
});

// SECURITY: This endpoint intentionally updates ONLY the password hash.
// It must NEVER reset failedLoginAttempts or lockedUntil.
// Resetting lockout state here would let an attacker use a social-engineered
// password change to bypass an active lockout and immediately retry logins.
// Use POST /users/:id/unlock (below) as the sole mechanism for clearing lockouts.
router.put("/users/:id/password", async (req, res) => {
  const id = Number(req.params["id"]);
  const { password } = req.body as { password: string };
  const passwordHash = await bcrypt.hash(password, 12);
  // Only passwordHash is set — lockout fields are deliberately left untouched.
  await db.update(usersTable).set({ passwordHash }).where(eq(usersTable.id, id));
  res.json({ ok: true });
});

// SECURITY: This is the ONLY endpoint that may clear lockout state.
// It intentionally updates ONLY failedLoginAttempts and lockedUntil.
// It must NEVER touch the password hash — combine it with a password reset
// only via two separate, explicit admin actions so each change is auditable.
router.post("/users/:id/unlock", async (req, res) => {
  const id = Number(req.params["id"]);
  // Only lockout fields are cleared — password is deliberately left untouched.
  const [user] = await db
    .update(usersTable)
    .set({ failedLoginAttempts: 0, lockedUntil: null })
    .where(eq(usersTable.id, id))
    .returning({ id: usersTable.id, username: usersTable.username, role: usersTable.role, barberId: usersTable.barberId, failedLoginAttempts: usersTable.failedLoginAttempts, lockedUntil: usersTable.lockedUntil });
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(user);
});

router.delete("/users/:id", async (req, res) => {
  const id = Number(req.params["id"]);
  await db.delete(usersTable).where(eq(usersTable.id, id));
  res.json({ ok: true });
});

export default router;
