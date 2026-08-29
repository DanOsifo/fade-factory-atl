import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { barbersTable } from "./barbers";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["barber", "admin"] }).notNull().default("barber"),
  barberId: integer("barber_id").references(() => barbersTable.id),
  failedLoginAttempts: integer("failed_login_attempts").notNull().default(0),
  lockedUntil: timestamp("locked_until"),
});

export type User = typeof usersTable.$inferSelect;
