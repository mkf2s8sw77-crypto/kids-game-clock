import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const children = sqliteTable("children", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  color: text("color").notNull().default("#3b82f6"),
  icon: text("icon").notNull().default("cat"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at").notNull(),
});

export const gameSessions = sqliteTable("game_sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  childId: integer("child_id").notNull(),
  startedAt: text("started_at").notNull(),
  endedAt: text("ended_at"),
  durationSeconds: integer("duration_seconds").notNull().default(0),
  source: text("source").notNull().default("device"),
  note: text("note"),
  createdAt: text("created_at").notNull(),
});

export const weeklyBonuses = sqliteTable("weekly_bonuses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  weekStartDate: text("week_start_date").notNull(),
  minutes: integer("minutes").notNull(),
  reason: text("reason").notNull().default(""),
  createdAt: text("created_at").notNull(),
});

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export type Child = typeof children.$inferSelect;
export type NewChild = typeof children.$inferInsert;
export type GameSession = typeof gameSessions.$inferSelect;
export type NewGameSession = typeof gameSessions.$inferInsert;
export type WeeklyBonus = typeof weeklyBonuses.$inferSelect;
export type NewWeeklyBonus = typeof weeklyBonuses.$inferInsert;
