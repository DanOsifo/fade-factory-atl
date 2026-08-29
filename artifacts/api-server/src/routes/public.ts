import { Router } from "express";
import { db } from "@workspace/db";
import { barbersTable, barberHoursTable, galleryImagesTable, siteContentTable } from "@workspace/db/schema";
import { eq, asc } from "drizzle-orm";

const router = Router();

router.get("/barbers", async (req, res) => {
  const barbers = await db
    .select()
    .from(barbersTable)
    .where(eq(barbersTable.active, true))
    .orderBy(asc(barbersTable.sortOrder));

  const barberIds = barbers.map((b) => b.id);

  const hours =
    barberIds.length > 0
      ? await db
          .select()
          .from(barberHoursTable)
          .orderBy(asc(barberHoursTable.dayOfWeek))
      : [];

  const result = barbers.map((b) => ({
    ...b,
    hours: hours.filter((h) => h.barberId === b.id),
  }));

  res.json(result);
});

router.get("/gallery", async (_req, res) => {
  const images = await db
    .select()
    .from(galleryImagesTable)
    .orderBy(asc(galleryImagesTable.slot));
  res.json(images);
});

router.get("/site-content/:key", async (req, res) => {
  const row = await db.query.siteContentTable.findFirst({
    where: eq(siteContentTable.key, req.params["key"]!),
  });
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(row);
});

export default router;
