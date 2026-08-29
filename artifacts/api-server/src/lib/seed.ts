import { sql } from "drizzle-orm";
import { randomBytes } from "crypto";
import { db } from "@workspace/db";
import {
  barbersTable,
  usersTable,
  siteContentTable,
} from "@workspace/db/schema";
import bcrypt from "bcryptjs";
import { logger } from "./logger";

export async function seedIfEmpty() {
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(usersTable);

  if (count > 0) return; // already seeded

  logger.info("Database is empty — seeding default data");

  // Barbers
  await db.insert(barbersTable).values([
    {
      id: 1,
      name: "Akeem",
      title: "Co-Owner & Master Barber",
      photoUrl: "/akeem-photo.jpg",
      accentColor: "#DB2100",
      bio: "Co-Owner of Fade Factory ATL with a sharp eye for detail and a smooth hand. Akeem brings energy and precision to every cut, specializing in clean fades, beard grooming, and creative styles that keep clients coming back.",
      specialties: ["Fades", "Beard Grooming", "Head Shave", "Line-Ups"],
      active: true,
      sortOrder: 0,
      walkInsOpen: true,
    },
    {
      id: 2,
      name: "Jeff",
      title: "Co-Owner & Master Barber",
      photoUrl: "/jeff-photo.jpeg",
      accentColor: "#0000EE",
      bio: "Co-Owner of Fade Factory ATL and a precision fade specialist with years of experience crafting sharp, consistent cuts. Jeff's attention to detail and passion for the craft is what built this shop's reputation in West Midtown Atlanta.",
      specialties: ["Fades", "Tapers", "Line-Ups", "Dreadlocks"],
      active: true,
      sortOrder: 1,
      walkInsOpen: true,
    },
    {
      id: 3,
      name: "Naz",
      title: "Barber",
      photoUrl: "/naz-photo-booksy.jpeg",
      accentColor: "#FFFFFF",
      bio: "Naz brings precision and professionalism to every appointment, specializing in full-service cuts, line-ups, kids cuts, and student cuts.",
      specialties: ["Full Service", "Line Ups", "Kids Cuts", "Student Cuts"],
      active: true,
      sortOrder: 2,
      walkInsOpen: true,
    },
  ]);

  // Users — admin and existing barbers use known hashes; Naz gets a unique
  // random one-time password logged once so the admin can share it with him.
  const adminHash = await bcrypt.hash("$FFBarber1186", 10);
  // Naz's initial password is a random token — never logged in plaintext.
  // Admin must set a real password for Naz via the admin panel Users tab.
  const nazHash = await bcrypt.hash(randomBytes(24).toString("base64url"), 10);
  await db.insert(usersTable).values([
    { id: 1, username: "admin",  passwordHash: adminHash,                                                                  role: "admin",  barberId: null },
    { id: 2, username: "akeem",  passwordHash: "$2a$12$Y2pekRnc73r.Qpe4XoucXuDFJrjssWozKUwf4RSSRpKlT2J/LsuQW", role: "barber", barberId: 1 },
    { id: 3, username: "jeff",   passwordHash: "$2a$12$h6sVr/dbHC/MSQbE5ijNKOXykWB3dSTUAZjQFKw5r1ppLK32qj8cO", role: "barber", barberId: 2 },
    { id: 4, username: "naz",    passwordHash: nazHash,                                                                    role: "barber", barberId: 3 },
  ]);
  logger.info("Seed: Naz portal account created — set his password via the admin panel Users tab before sharing login details");

  // Site content
  await db.insert(siteContentTable).values({
    key: "about",
    value:
      "Welcome to Fade Factory ATL, where precision meets style! Our barbers are experts at crafting sharp, consistent fades that make you stand out from the crowd. Located in the heart of West Midtown at My Salon Suites, we invite you to experience our specialized services, including detailed fades, tapers, and line-ups. Open seven days a week, we cater to your schedule with flexible hours and welcome walk-ins, making it easy for you to achieve the fresh look you deserve.",
  });

  // Bump sequences so future inserts don't collide with the seeded IDs
  await db.execute(sql`SELECT setval('barbers_id_seq', (SELECT MAX(id) FROM barbers))`);
  await db.execute(sql`SELECT setval('users_id_seq',   (SELECT MAX(id) FROM users))`);

  logger.info("Seeding complete");
}

/**
 * Idempotent migration for Naz — runs on every startup so existing databases
 * (seeded before Naz was added) receive his barber and user rows.
 * Barber and user are checked and created independently so a partial failure
 * (e.g. server crash between the two inserts) is automatically repaired on
 * the next startup.
 */
export async function ensureNaz() {
  // ── 1. Ensure barber row ────────────────────────────────────────────────
  const [barberRow] = await db
    .select({
      id: barbersTable.id,
      title: barbersTable.title,
      photoUrl: barbersTable.photoUrl,
      bio: barbersTable.bio,
      specialties: barbersTable.specialties,
    })
    .from(barbersTable)
    .where(sql`lower(${barbersTable.name}) = 'naz'`);

  let nazBarberId: number;

  if (barberRow) {
    nazBarberId = barberRow.id;
    const profileUpdates: Partial<typeof barbersTable.$inferInsert> = {};

    // Fill only placeholder fields so future admin edits are preserved.
    if (barberRow.title === "Entrepreneur") profileUpdates.title = "Barber";
    if (!barberRow.photoUrl) profileUpdates.photoUrl = "/naz-photo-booksy.jpeg";
    if (!barberRow.bio) {
      profileUpdates.bio =
        "Naz brings precision and professionalism to every appointment, specializing in full-service cuts, line-ups, kids cuts, and student cuts.";
    }
    if (barberRow.specialties.length === 0) {
      profileUpdates.specialties = ["Full Service", "Line Ups", "Kids Cuts", "Student Cuts"];
    }

    if (Object.keys(profileUpdates).length > 0) {
      await db
        .update(barbersTable)
        .set(profileUpdates)
        .where(sql`${barbersTable.id} = ${nazBarberId}`);
      logger.info("ensureNaz: completed Naz profile details from Booksy");
    }
  } else {
    logger.info("ensureNaz: inserting Naz barber row");
    const [inserted] = await db
      .insert(barbersTable)
      .values({
        name: "Naz",
        title: "Barber",
        photoUrl: "/naz-photo-booksy.jpeg",
        accentColor: "#FFFFFF",
        bio: "Naz brings precision and professionalism to every appointment, specializing in full-service cuts, line-ups, kids cuts, and student cuts.",
        specialties: ["Full Service", "Line Ups", "Kids Cuts", "Student Cuts"],
        active: true,
        sortOrder: 2,
        walkInsOpen: true,
      })
      .returning({ id: barbersTable.id });
    nazBarberId = inserted.id;
    await db.execute(sql`SELECT setval('barbers_id_seq', (SELECT MAX(id) FROM barbers))`);
  }

  // ── 2. Ensure user row ──────────────────────────────────────────────────
  const [userRow] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(sql`lower(${usersTable.username}) = 'naz'`);

  if (!userRow) {
    logger.info("ensureNaz: inserting Naz user row");
    // Random initial password — never logged in plaintext.
    // Admin must set a real password for Naz via the admin panel Users tab.
    const hash = await bcrypt.hash(randomBytes(24).toString("base64url"), 10);
    await db.insert(usersTable).values({
      username: "naz",
      passwordHash: hash,
      role: "barber",
      barberId: nazBarberId,
    });
    await db.execute(sql`SELECT setval('users_id_seq', (SELECT MAX(id) FROM users))`);
    logger.info("ensureNaz: Naz portal account created — set his password via the admin panel Users tab before sharing login details");
  }
}
