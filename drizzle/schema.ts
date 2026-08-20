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
  gamerTags: text("gamerTags"),
  streamLinks: text("streamLinks"),
  verifiedAt: timestamp("verifiedAt"),
  verifiedByUserId: int("verifiedByUserId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  ownerUserFk: foreignKey({ columns: [table.ownerUserId], foreignColumns: [users.id], name: "streamer_profiles_owner_user_fk" }),
  verifierUserFk: foreignKey({ columns: [table.verifiedByUserId], foreignColumns: [users.id], name: "streamer_profiles_verifier_user_fk" }),
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

export const creatorApplications = mysqlTable("creator_applications", {
  id: int("id").autoincrement().primaryKey(),
  applicantUserId: int("applicantUserId").notNull(),
  displayName: varchar("displayName", { length: 160 }).notNull(),
  requestedSlug: varchar("requestedSlug", { length: 96 }).notNull(),
  bio: text("bio"),
  gamerTags: text("gamerTags").notNull(),
  streamLinks: text("streamLinks").notNull(),
  catalogDraft: text("catalogDraft").notNull(),
  status: mysqlEnum("status", ["pending", "in_review", "needs_changes", "approved", "rejected"]).default("pending").notNull(),
  reviewerNotes: text("reviewerNotes"),
  reviewedByUserId: int("reviewedByUserId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  applicantUserFk: foreignKey({ columns: [table.applicantUserId], foreignColumns: [users.id], name: "creator_applications_applicant_user_fk" }),
  reviewerUserFk: foreignKey({ columns: [table.reviewedByUserId], foreignColumns: [users.id], name: "creator_applications_reviewer_user_fk" }),
}));

export const creatorApplicationChecks = mysqlTable("creator_application_checks", {
  id: int("id").autoincrement().primaryKey(),
  applicationId: int("applicationId").notNull(),
  checkType: mysqlEnum("checkType", ["identity", "stream_profile", "gamer_tag", "catalog", "policy"]).notNull(),
  subject: varchar("subject", { length: 240 }).notNull(),
  evidenceUrl: varchar("evidenceUrl", { length: 512 }),
  status: mysqlEnum("status", ["unreviewed", "verified", "failed", "not_applicable"]).default("unreviewed").notNull(),
  reviewerNote: text("reviewerNote"),
  reviewedByUserId: int("reviewedByUserId"),
  reviewedAt: timestamp("reviewedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  applicationFk: foreignKey({ columns: [table.applicationId], foreignColumns: [creatorApplications.id], name: "creator_application_checks_application_fk" }),
  reviewerUserFk: foreignKey({ columns: [table.reviewedByUserId], foreignColumns: [users.id], name: "creator_application_checks_reviewer_user_fk" }),
}));

export const creatorApplicationEvents = mysqlTable("creator_application_events", {
  id: int("id").autoincrement().primaryKey(),
  applicationId: int("applicationId").notNull(),
  actorUserId: int("actorUserId").notNull(),
  fromStatus: varchar("fromStatus", { length: 40 }),
  toStatus: varchar("toStatus", { length: 40 }).notNull(),
  note: text("note"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  applicationFk: foreignKey({ columns: [table.applicationId], foreignColumns: [creatorApplications.id], name: "creator_application_events_application_fk" }),
  actorUserFk: foreignKey({ columns: [table.actorUserId], foreignColumns: [users.id], name: "creator_application_events_actor_user_fk" }),
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
export type CreatorApplication = typeof creatorApplications.$inferSelect;
export type CreatorApplicationCheck = typeof creatorApplicationChecks.$inferSelect;
export type CreatorApplicationEvent = typeof creatorApplicationEvents.$inferSelect;
