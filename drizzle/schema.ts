import { boolean, foreignKey, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const streamerProfiles = mysqlTable("streamer_profiles", {
  id: int("id").autoincrement().primaryKey(),
  ownerUserId: int("ownerUserId").notNull(),
  slug: varchar("slug", { length: 96 }).notNull().unique(),
  displayName: varchar("displayName", { length: 160 }).notNull(),
  bio: text("bio"),
  approvalStatus: mysqlEnum("approvalStatus", ["pending", "approved", "suspended", "archived"]).default("pending").notNull(),
  publicTipUrl: varchar("publicTipUrl", { length: 512 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  ownerUserFk: foreignKey({ columns: [table.ownerUserId], foreignColumns: [users.id], name: "streamer_profiles_owner_user_fk" }),
}));

export const catalogGames = mysqlTable("catalog_games", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 180 }).notNull(),
  platform: mysqlEnum("platform", ["xbox", "playstation"]).notNull(),
  genre: varchar("genre", { length: 120 }),
  note: text("note"),
  releaseDate: timestamp("releaseDate"),
  popularityScore: int("popularityScore").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const streamerCatalog = mysqlTable("streamer_catalog", {
  id: int("id").autoincrement().primaryKey(),
  streamerProfileId: int("streamerProfileId").notNull(),
  gameId: int("gameId").notNull(),
  ownershipStatus: mysqlEnum("ownershipStatus", ["unconfirmed", "owned"]).default("unconfirmed").notNull(),
  isVisible: boolean("isVisible").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  streamerProfileFk: foreignKey({ columns: [table.streamerProfileId], foreignColumns: [streamerProfiles.id], name: "streamer_catalog_profile_fk" }),
  catalogGameFk: foreignKey({ columns: [table.gameId], foreignColumns: [catalogGames.id], name: "streamer_catalog_game_fk" }),
}));

export const bookingRequests = mysqlTable("booking_requests", {
  id: int("id").autoincrement().primaryKey(),
  streamerProfileId: int("streamerProfileId").notNull(),
  gameId: int("gameId").notNull(),
  viewerUserId: int("viewerUserId"),
  viewerHandle: varchar("viewerHandle", { length: 160 }).notNull(),
  viewerPlatform: varchar("viewerPlatform", { length: 40 }).notNull(),
  status: mysqlEnum("status", ["requested", "reviewing", "owned", "support_pending", "scheduled", "completed", "cancelled"]).default("requested").notNull(),
  publicNote: text("publicNote"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  streamerProfileFk: foreignKey({ columns: [table.streamerProfileId], foreignColumns: [streamerProfiles.id], name: "booking_requests_profile_fk" }),
  catalogGameFk: foreignKey({ columns: [table.gameId], foreignColumns: [catalogGames.id], name: "booking_requests_game_fk" }),
  viewerUserFk: foreignKey({ columns: [table.viewerUserId], foreignColumns: [users.id], name: "booking_requests_viewer_user_fk" }),
}));

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type StreamerProfile = typeof streamerProfiles.$inferSelect;
export type CatalogGame = typeof catalogGames.$inferSelect;
export type StreamerCatalogEntry = typeof streamerCatalog.$inferSelect;
export type BookingRequest = typeof bookingRequests.$inferSelect;
