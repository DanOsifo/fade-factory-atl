import { pgTable, text } from "drizzle-orm/pg-core";

export const siteContentTable = pgTable("site_content", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export type SiteContent = typeof siteContentTable.$inferSelect;
