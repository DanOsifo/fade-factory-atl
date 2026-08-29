import { db } from "@workspace/db";
import {
  barbersTable,
  barberHoursTable,
  siteContentTable,
  galleryImagesTable,
  usersTable,
} from "@workspace/db/schema";
import bcrypt from "bcryptjs";

const DAY_LABELS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const DEFAULT_HOURS = [
  { dayOfWeek: 0, openTime: "11:00", closeTime: "17:00", isClosed: false },
  { dayOfWeek: 1, openTime: "09:00", closeTime: "19:00", isClosed: false },
  { dayOfWeek: 2, openTime: "09:00", closeTime: "19:00", isClosed: false },
  { dayOfWeek: 3, openTime: "09:00", closeTime: "19:00", isClosed: false },
  { dayOfWeek: 4, openTime: "09:00", closeTime: "19:00", isClosed: false },
  { dayOfWeek: 5, openTime: "09:00", closeTime: "19:00", isClosed: false },
  { dayOfWeek: 6, openTime: "09:00", closeTime: "18:00", isClosed: false },
];

const DEFAULT_GALLERY = [
  "/fade-factory-site/shop-1.jpg",
  "/fade-factory-site/shop-2.jpg",
  "/fade-factory-site/shop-3.jpg",
  "/fade-factory-site/shop-4.jpg",
  "/fade-factory-site/shop-5.jpg",
  "/fade-factory-site/shop-6.jpg",
  "/fade-factory-site/shop-7.jpg",
  "/fade-factory-site/shop-8.jpg",
  "/fade-factory-site/shop-9.jpg",
  "/fade-factory-site/shop-10.jpg",
];

async function seed() {
  console.log("🌱 Seeding Fade Factory ATL...");

  // ── Barbers ──────────────────────────────────────────────────────────────
  const existingBarbers = await db.select().from(barbersTable);
  let akeemId: number;
  let jeffId: number;

  if (existingBarbers.length === 0) {
    console.log("  Creating barbers...");
    const [akeem] = await db
      .insert(barbersTable)
      .values({
        name: "Akeem",
        title: "Co-Owner & Master Barber",
        bio: "Co-Owner of Fade Factory ATL with a sharp eye for detail and a smooth hand. Akeem brings energy and precision to every cut, specializing in clean fades, beard grooming, and creative styles that keep clients coming back.",
        photoUrl: "/fade-factory-site/akeem-photo.jpg",
        specialties: ["Fades", "Beard Grooming", "Head Shave", "Line-Ups"],
        accentColor: "#DB2100",
        sortOrder: 0,
        active: true,
      })
      .returning();

    const [jeff] = await db
      .insert(barbersTable)
      .values({
        name: "Jeff",
        title: "Co-Owner & Master Barber",
        bio: "Co-Owner of Fade Factory ATL and a precision fade specialist with years of experience crafting sharp, consistent cuts. Jeff's attention to detail and passion for the craft is what built this shop's reputation in West Midtown Atlanta.",
        photoUrl: "/fade-factory-site/jeff-photo.jpeg",
        specialties: ["Fades", "Tapers", "Line-Ups", "Dreadlocks"],
        accentColor: "#0000EE",
        sortOrder: 1,
        active: true,
      })
      .returning();

    akeemId = akeem!.id;
    jeffId = jeff!.id;
    console.log(`  Created Akeem (id=${akeemId}), Jeff (id=${jeffId})`);
  } else {
    akeemId = existingBarbers.find((b) => b.name === "Akeem")?.id ?? existingBarbers[0]!.id;
    jeffId = existingBarbers.find((b) => b.name === "Jeff")?.id ?? existingBarbers[1]?.id ?? akeemId;
    console.log("  Barbers already exist, skipping.");
  }

  // ── Barber Hours ─────────────────────────────────────────────────────────
  for (const barberId of [akeemId, jeffId]) {
    for (const h of DEFAULT_HOURS) {
      await db
        .insert(barberHoursTable)
        .values({ barberId, ...h })
        .onConflictDoNothing();
    }
  }
  console.log("  Hours seeded.");

  // ── Site Content ─────────────────────────────────────────────────────────
  await db
    .insert(siteContentTable)
    .values({
      key: "about",
      value:
        "Welcome to Fade Factory ATL, where precision meets style! Our barbers are experts at crafting sharp, consistent fades that make you stand out from the crowd. Located in the heart of West Midtown at My Salon Suites, we invite you to experience our specialized services, including detailed fades, tapers, and line-ups. Open seven days a week, we cater to your schedule with flexible hours and welcome walk-ins, making it easy for you to achieve the fresh look you deserve.",
    })
    .onConflictDoNothing();
  console.log("  Site content seeded.");

  // ── Gallery ───────────────────────────────────────────────────────────────
  for (let i = 0; i < DEFAULT_GALLERY.length; i++) {
    await db
      .insert(galleryImagesTable)
      .values({ slot: i + 1, url: DEFAULT_GALLERY[i]!, alt: "Fade Factory ATL" })
      .onConflictDoNothing();
  }
  console.log("  Gallery seeded.");

  // ── Users ─────────────────────────────────────────────────────────────────
  const existingUsers = await db.select().from(usersTable);
  if (existingUsers.length === 0) {
    console.log("  Creating users (CHANGE THESE PASSWORDS AFTER FIRST LOGIN)...");

    const adminHash = await bcrypt.hash("admin123", 12);
    await db.insert(usersTable).values({
      username: "admin",
      passwordHash: adminHash,
      role: "admin",
      barberId: null,
    });

    const akeemHash = await bcrypt.hash("akeem123", 12);
    await db.insert(usersTable).values({
      username: "akeem",
      passwordHash: akeemHash,
      role: "barber",
      barberId: akeemId,
    });

    const jeffHash = await bcrypt.hash("jeff123", 12);
    await db.insert(usersTable).values({
      username: "jeff",
      passwordHash: jeffHash,
      role: "barber",
      barberId: jeffId,
    });

    console.log("  Users: admin/admin123, akeem/akeem123, jeff/jeff123");
  } else {
    console.log("  Users already exist, skipping.");
  }

  console.log("✅ Seed complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
