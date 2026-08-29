import { pgTable, serial, text, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const barbersTable = pgTable("barbers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  title: text("title").notNull(),
  bio: text("bio").notNull().default(""),
  photoUrl: text("photo_url").notNull().default(""),
  specialties: text("specialties").array().notNull().default([]),
  accentColor: text("accent_color").notNull().default("#DB2100"),
  active: boolean("active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  walkInsOpen: boolean("walk_ins_open").notNull().default(true),
});

export const insertBarberSchema = createInsertSchema(barbersTable).omit({ id: true });
export const selectBarberSchema = createSelectSchema(barbersTable);
export type InsertBarber = z.infer<typeof insertBarberSchema>;
export type Barber = typeof barbersTable.$inferSelect;
