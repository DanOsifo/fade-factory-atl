import { pgTable, serial, text, integer } from "drizzle-orm/pg-core";

export const galleryImagesTable = pgTable("gallery_images", {
  id: serial("id").primaryKey(),
  slot: integer("slot").notNull().unique(),
  url: text("url").notNull(),
  alt: text("alt").notNull().default("Fade Factory ATL"),
});

export type GalleryImage = typeof galleryImagesTable.$inferSelect;
