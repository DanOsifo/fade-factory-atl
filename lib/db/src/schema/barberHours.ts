import { pgTable, serial, text, boolean, integer, uniqueIndex } from "drizzle-orm/pg-core";
import { barbersTable } from "./barbers";

export const barberHoursTable = pgTable(
  "barber_hours",
  {
    id: serial("id").primaryKey(),
    barberId: integer("barber_id")
      .notNull()
      .references(() => barbersTable.id, { onDelete: "cascade" }),
    dayOfWeek: integer("day_of_week").notNull(),
    openTime: text("open_time").notNull().default("09:00"),
    closeTime: text("close_time").notNull().default("17:00"),
    isClosed: boolean("is_closed").notNull().default(false),
  },
  (t) => [uniqueIndex("barber_hours_barber_day_idx").on(t.barberId, t.dayOfWeek)],
);

export type BarberHours = typeof barberHoursTable.$inferSelect;
