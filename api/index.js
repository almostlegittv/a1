// server/vercel-api.ts
import express2 from "express";

// server/api.ts
import express from "express";

// shared/const.ts
var COOKIE_NAME = "almostlegit_session";
var ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1e3;
var OAUTH_STATE_COOKIE = "__Host-oauth_state";
function decodeOAuthState(value) {
  if (!value) return {};
  try {
    const binary = atob(value);
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    const parsed = JSON.parse(new TextDecoder().decode(bytes));
    if (typeof parsed.redirectUri !== "string") return {};
    return { redirectUri: parsed.redirectUri, nonce: typeof parsed.nonce === "string" ? parsed.nonce : void 0 };
  } catch {
    return {};
  }
}

// server/api.ts
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// server/routers.ts
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { z } from "zod";

// server/db.ts
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { and, asc, desc, eq, inArray } from "drizzle-orm";

// drizzle/schema.ts
import { boolean, foreignKey, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";
var users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull()
});
var streamerProfiles = mysqlTable("streamer_profiles", {
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
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
}, (table) => ({
  ownerUserFk: foreignKey({ columns: [table.ownerUserId], foreignColumns: [users.id], name: "streamer_profiles_owner_user_fk" }),
  verifierUserFk: foreignKey({ columns: [table.verifiedByUserId], foreignColumns: [users.id], name: "streamer_profiles_verifier_user_fk" })
}));
var catalogGames = mysqlTable("catalog_games", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 180 }).notNull(),
  platform: mysqlEnum("platform", ["xbox", "playstation"]).notNull(),
  genre: varchar("genre", { length: 120 }),
  note: text("note"),
  releaseDate: timestamp("releaseDate"),
  popularityScore: int("popularityScore").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var streamerCatalog = mysqlTable("streamer_catalog", {
  id: int("id").autoincrement().primaryKey(),
  streamerProfileId: int("streamerProfileId").notNull(),
  gameId: int("gameId").notNull(),
  ownershipStatus: mysqlEnum("ownershipStatus", ["unconfirmed", "owned"]).default("unconfirmed").notNull(),
  isVisible: boolean("isVisible").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
}, (table) => ({
  streamerProfileFk: foreignKey({ columns: [table.streamerProfileId], foreignColumns: [streamerProfiles.id], name: "streamer_catalog_profile_fk" }),
  catalogGameFk: foreignKey({ columns: [table.gameId], foreignColumns: [catalogGames.id], name: "streamer_catalog_game_fk" })
}));
var creatorApplications = mysqlTable("creator_applications", {
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
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
}, (table) => ({
  applicantUserFk: foreignKey({ columns: [table.applicantUserId], foreignColumns: [users.id], name: "creator_applications_applicant_user_fk" }),
  reviewerUserFk: foreignKey({ columns: [table.reviewedByUserId], foreignColumns: [users.id], name: "creator_applications_reviewer_user_fk" })
}));
var creatorApplicationChecks = mysqlTable("creator_application_checks", {
  id: int("id").autoincrement().primaryKey(),
  applicationId: int("applicationId").notNull(),
  checkType: mysqlEnum("checkType", ["identity", "stream_profile", "gamer_tag", "catalog", "policy"]).notNull(),
  subject: varchar("subject", { length: 240 }).notNull(),
  evidenceUrl: varchar("evidenceUrl", { length: 512 }),
  status: mysqlEnum("status", ["unreviewed", "verified", "failed", "not_applicable"]).default("unreviewed").notNull(),
  automatedStatus: mysqlEnum("automatedStatus", ["not_run", "passed", "warning", "failed"]).default("not_run").notNull(),
  automatedNote: text("automatedNote"),
  reviewerNote: text("reviewerNote"),
  reviewedByUserId: int("reviewedByUserId"),
  reviewedAt: timestamp("reviewedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
}, (table) => ({
  applicationFk: foreignKey({ columns: [table.applicationId], foreignColumns: [creatorApplications.id], name: "creator_application_checks_application_fk" }),
  reviewerUserFk: foreignKey({ columns: [table.reviewedByUserId], foreignColumns: [users.id], name: "creator_application_checks_reviewer_user_fk" })
}));
var creatorApplicationEvents = mysqlTable("creator_application_events", {
  id: int("id").autoincrement().primaryKey(),
  applicationId: int("applicationId").notNull(),
  actorUserId: int("actorUserId").notNull(),
  fromStatus: varchar("fromStatus", { length: 40 }),
  toStatus: varchar("toStatus", { length: 40 }).notNull(),
  note: text("note"),
  createdAt: timestamp("createdAt").defaultNow().notNull()
}, (table) => ({
  applicationFk: foreignKey({ columns: [table.applicationId], foreignColumns: [creatorApplications.id], name: "creator_application_events_application_fk" }),
  actorUserFk: foreignKey({ columns: [table.actorUserId], foreignColumns: [users.id], name: "creator_application_events_actor_user_fk" })
}));
var bookingRequests = mysqlTable("booking_requests", {
  id: int("id").autoincrement().primaryKey(),
  streamerProfileId: int("streamerProfileId").notNull(),
  gameId: int("gameId").notNull(),
  viewerUserId: int("viewerUserId"),
  viewerHandle: varchar("viewerHandle", { length: 160 }).notNull(),
  viewerPlatform: varchar("viewerPlatform", { length: 40 }).notNull(),
  status: mysqlEnum("status", ["requested", "reviewing", "owned", "support_pending", "scheduled", "completed", "cancelled"]).default("requested").notNull(),
  publicNote: text("publicNote"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
}, (table) => ({
  streamerProfileFk: foreignKey({ columns: [table.streamerProfileId], foreignColumns: [streamerProfiles.id], name: "booking_requests_profile_fk" }),
  catalogGameFk: foreignKey({ columns: [table.gameId], foreignColumns: [catalogGames.id], name: "booking_requests_game_fk" }),
  viewerUserFk: foreignKey({ columns: [table.viewerUserId], foreignColumns: [users.id], name: "booking_requests_viewer_user_fk" })
}));

// shared/identityValidation.ts
var supportedStreamHosts = {
  tiktok: ["tiktok.com", "www.tiktok.com", "m.tiktok.com"],
  twitch: ["twitch.tv", "www.twitch.tv", "m.twitch.tv"],
  youtube: ["youtube.com", "www.youtube.com", "youtu.be", "m.youtube.com"],
  kick: ["kick.com", "www.kick.com"]
};
function hostMatches(host, allowed) {
  return allowed.some((candidate) => host === candidate || host.endsWith(`.${candidate}`));
}
function validatePublicStreamLink(platform, rawUrl) {
  const value = rawUrl.trim();
  if (!value) return { status: "failed", note: "A public profile URL is required." };
  let url;
  try {
    url = new URL(value);
  } catch {
    return { status: "failed", note: "Use a complete public URL beginning with https://." };
  }
  if (!["http:", "https:"].includes(url.protocol)) return { status: "failed", note: "Only http:// or https:// links are accepted." };
  if (url.username || url.password) return { status: "failed", note: "Do not submit URLs containing account credentials." };
  const normalizedPlatform = platform.trim().toLowerCase();
  const allowedHosts = Object.entries(supportedStreamHosts).find(([key]) => normalizedPlatform.includes(key))?.[1];
  if (!allowedHosts) return { status: "warning", note: "URL structure looks valid; an admin must manually verify this platform profile." };
  if (!hostMatches(url.hostname.toLowerCase(), allowedHosts)) return { status: "warning", note: `URL is valid, but it does not match the expected ${platform} host. Check the link manually.` };
  if (url.pathname === "/" || url.pathname.length < 2) return { status: "warning", note: "The platform host is valid, but the profile path looks incomplete." };
  return { status: "passed", note: `Valid ${platform} public profile URL format. This does not prove account ownership.` };
}
function validateGamerTag(platform, rawHandle) {
  const handle = rawHandle.trim();
  if (!handle) return { status: "failed", note: "A gamer tag is required." };
  if (platform === "playstation") {
    if (!/^[A-Za-z0-9_-]{3,16}$/.test(handle)) return { status: "failed", note: "PlayStation Online IDs must use 3\u201316 letters, numbers, hyphens, or underscores." };
    return { status: "passed", note: "PlayStation Online ID format looks valid. An admin must still verify the public profile." };
  }
  const [base, suffix] = handle.split("#");
  if (!base || base.length > 12 || suffix !== void 0 && (!/^[A-Za-z0-9]{1,14}$/.test(suffix) || handle.length > 16)) return { status: "failed", note: "Xbox gamertags support a base name up to 12 characters, with an optional # suffix; the length or suffix format is invalid." };
  if (!/^[A-Za-z0-9 ._-]+$/.test(base)) return { status: "warning", note: "This Xbox gamertag uses characters that require manual review; the format check cannot confirm the full Unicode range." };
  return { status: "passed", note: "Xbox gamertag format looks valid. An admin must still verify the public profile." };
}

// server/db.ts
var pool = process.env.DATABASE_URL ? mysql.createPool(process.env.DATABASE_URL) : null;
var db = pool ? drizzle(pool) : null;
async function upsertUserFromOAuth(input) {
  if (!db) throw new Error("Database is not configured");
  const existing = await db.select().from(users).where(eq(users.openId, input.openId)).limit(1);
  if (existing[0]) {
    await db.update(users).set({ name: input.name ?? existing[0].name, email: input.email ?? existing[0].email, lastSignedIn: /* @__PURE__ */ new Date() }).where(eq(users.id, existing[0].id));
    return getUserById(existing[0].id);
  }
  const result = await db.insert(users).values({ openId: input.openId, name: input.name ?? null, email: input.email ?? null, loginMethod: "manus-oauth", role: input.openId === process.env.OWNER_OPEN_ID ? "admin" : "user" });
  return getUserById(Number(result[0].insertId));
}
async function ensureOwnerProfile(userId, displayName) {
  if (!db) throw new Error("Database is not configured");
  const existing = await db.select().from(streamerProfiles).where(eq(streamerProfiles.ownerUserId, userId)).limit(1);
  const ownerBio = "Story-driven stream requests for the next chapter. The streamer reviews every request and decides what fits the schedule.";
  const ownerLinks = JSON.stringify([
    { platform: "TikTok", url: "https://www.tiktok.com/@almostlegittv" },
    { platform: "YouTube", url: "https://youtube.com/@almostlegittv" },
    { platform: "Kick", url: "https://kick.com/almostlegittv" },
    { platform: "Twitch", url: "https://m.twitch.tv/almostlegittv/home" },
    { platform: "Links", url: "https://lnk.bio/almostlegittv" }
  ]);
  const profile = existing[0] ?? await db.insert(streamerProfiles).values({ ownerUserId: userId, slug: "almostlegittv", displayName: displayName || "AlmostLegitTV", bio: ownerBio, approvalStatus: "approved", gamerTags: JSON.stringify([]), streamLinks: ownerLinks, verifiedAt: /* @__PURE__ */ new Date(), verifiedByUserId: userId }).then(async (result) => (await db.select().from(streamerProfiles).where(eq(streamerProfiles.id, Number(result[0].insertId))).limit(1))[0]);
  if (!profile) throw new Error("Unable to create owner profile");
  if (!profile.streamLinks) await db.update(streamerProfiles).set({ bio: profile.bio || ownerBio, streamLinks: ownerLinks, gamerTags: profile.gamerTags || JSON.stringify([]), approvalStatus: "approved", verifiedAt: profile.verifiedAt || /* @__PURE__ */ new Date(), verifiedByUserId: profile.verifiedByUserId || userId }).where(eq(streamerProfiles.id, profile.id));
  const seedGames = [
    { title: "Red Dead Redemption 2", platform: "xbox", genre: "Story-driven western", note: "A long-form frontier story with room for chat to shape the journey." },
    { title: "Kingdom Come: Deliverance II", platform: "xbox", genre: "Story-driven RPG", note: "A grounded medieval journey where choices shape the road ahead." },
    { title: "Grand Theft Auto V", platform: "xbox", genre: "Open-world action", note: "A character-driven crime saga with room for chat to steer the chaos." },
    { title: "S.T.A.L.K.E.R. 2", platform: "xbox", genre: "Story-driven survival FPS", note: "A tense journey through the Zone where every decision carries weight." },
    { title: "Elden Ring", platform: "xbox", genre: "Action RPG", note: "Big bosses, bigger maps." },
    { title: "Returnal", platform: "playstation", genre: "Roguelike shooter", note: "A high-pressure PlayStation run." },
    { title: "Ghost of Tsushima", platform: "playstation", genre: "Action adventure", note: "Timing can be coordinated off-platform." }
  ];
  for (const game of seedGames) {
    const existingGame = await db.select().from(catalogGames).where(and(eq(catalogGames.title, game.title), eq(catalogGames.platform, game.platform))).limit(1);
    const catalogGame = existingGame[0] ?? await db.insert(catalogGames).values(game).then(async (result) => (await db.select().from(catalogGames).where(eq(catalogGames.id, Number(result[0].insertId))).limit(1))[0]);
    if (!catalogGame) continue;
    const existingEntry = await db.select().from(streamerCatalog).where(and(eq(streamerCatalog.streamerProfileId, profile.id), eq(streamerCatalog.gameId, catalogGame.id))).limit(1);
    if (!existingEntry[0]) await db.insert(streamerCatalog).values({ streamerProfileId: profile.id, gameId: catalogGame.id, ownershipStatus: game.title === "Red Dead Redemption 2" || game.title === "Ghost of Tsushima" ? "owned" : "unconfirmed" });
  }
  return profile;
}
async function getUserById(id) {
  if (!db) return void 0;
  const rows = await db.select({ id: users.id, role: users.role }).from(users).where(eq(users.id, id)).limit(1);
  const user = rows[0];
  if (!user) return void 0;
  const profiles = await db.select({ id: streamerProfiles.id }).from(streamerProfiles).where(and(eq(streamerProfiles.ownerUserId, user.id), eq(streamerProfiles.approvalStatus, "approved"))).limit(1);
  return { ...user, streamerProfileId: profiles[0]?.id };
}
async function listApprovedCatalog(streamerProfileId) {
  if (!db) return [];
  return db.select({
    id: catalogGames.id,
    title: catalogGames.title,
    platform: catalogGames.platform,
    genre: catalogGames.genre,
    note: catalogGames.note,
    releaseDate: catalogGames.releaseDate,
    popularityScore: catalogGames.popularityScore,
    ownershipStatus: streamerCatalog.ownershipStatus,
    isVisible: streamerCatalog.isVisible
  }).from(streamerCatalog).innerJoin(catalogGames, eq(streamerCatalog.gameId, catalogGames.id)).innerJoin(streamerProfiles, eq(streamerCatalog.streamerProfileId, streamerProfiles.id)).where(and(eq(streamerCatalog.streamerProfileId, streamerProfileId), eq(streamerProfiles.approvalStatus, "approved"), eq(catalogGames.isActive, true), eq(streamerCatalog.isVisible, true))).orderBy(asc(catalogGames.title));
}
async function listPublicRequests(streamerProfileId) {
  if (!db) return [];
  return db.select({
    id: bookingRequests.id,
    gameId: bookingRequests.gameId,
    title: catalogGames.title,
    platform: catalogGames.platform,
    status: bookingRequests.status,
    publicNote: bookingRequests.publicNote,
    createdAt: bookingRequests.createdAt
  }).from(bookingRequests).innerJoin(catalogGames, eq(bookingRequests.gameId, catalogGames.id)).where(and(eq(bookingRequests.streamerProfileId, streamerProfileId), inArray(bookingRequests.status, ["requested", "reviewing", "owned", "support_pending", "scheduled"]))).orderBy(desc(bookingRequests.createdAt));
}
async function listCreatorRequests(streamerProfileId) {
  if (!db) return [];
  return db.select().from(bookingRequests).where(eq(bookingRequests.streamerProfileId, streamerProfileId)).orderBy(desc(bookingRequests.createdAt));
}
async function findActiveRequest(streamerProfileId, gameId) {
  if (!db) return void 0;
  const rows = await db.select().from(bookingRequests).where(and(eq(bookingRequests.streamerProfileId, streamerProfileId), eq(bookingRequests.gameId, gameId), inArray(bookingRequests.status, ["requested", "reviewing", "owned", "support_pending", "scheduled"]))).limit(1);
  return rows[0];
}
async function getStreamerProfileBySlug(slug) {
  if (!db) return void 0;
  const rows = await db.select().from(streamerProfiles).where(and(eq(streamerProfiles.slug, slug), eq(streamerProfiles.approvalStatus, "approved"))).limit(1);
  return rows[0];
}
async function createBookingRequest(input) {
  if (!db) throw new Error("Database is not configured");
  const existing = await findActiveRequest(input.streamerProfileId, input.gameId);
  if (existing) return { created: false, request: existing };
  const result = await db.insert(bookingRequests).values({ ...input, viewerUserId: input.viewerUserId ?? null, publicNote: input.publicNote ?? null });
  const requestId = Number(result[0].insertId);
  const rows = await db.select().from(bookingRequests).where(eq(bookingRequests.id, requestId)).limit(1);
  return { created: true, request: rows[0] };
}
async function updateRequestStatus(id, status) {
  if (!db) throw new Error("Database is not configured");
  await db.update(bookingRequests).set({ status }).where(eq(bookingRequests.id, id));
  const rows = await db.select().from(bookingRequests).where(eq(bookingRequests.id, id)).limit(1);
  return rows[0];
}
async function setCatalogOwnership(id, ownershipStatus) {
  if (!db) throw new Error("Database is not configured");
  await db.update(streamerCatalog).set({ ownershipStatus }).where(eq(streamerCatalog.id, id));
  const rows = await db.select().from(streamerCatalog).where(eq(streamerCatalog.id, id)).limit(1);
  return rows[0];
}
async function listUsersForAdminOnboarding() {
  if (!db) return [];
  return db.select({ id: users.id, name: users.name, email: users.email, role: users.role }).from(users).orderBy(asc(users.name), asc(users.email));
}
async function createCreatorOnboarding(input) {
  if (!db) throw new Error("Database is not configured");
  const existingSlug = await db.select({ id: streamerProfiles.id }).from(streamerProfiles).where(eq(streamerProfiles.slug, input.slug)).limit(1);
  if (existingSlug[0]) throw new Error("That public creator slug is already in use.");
  const owner = await db.select({ id: users.id }).from(users).where(eq(users.id, input.ownerUserId)).limit(1);
  if (!owner[0]) throw new Error("The selected creator account was not found.");
  return db.transaction(async (tx) => {
    const profileResult = await tx.insert(streamerProfiles).values({
      ownerUserId: input.ownerUserId,
      slug: input.slug,
      displayName: input.displayName,
      bio: input.bio || null,
      publicTipUrl: input.publicTipUrl || null,
      approvalStatus: input.approvalStatus
    });
    const profileId = Number(profileResult[0].insertId);
    for (const entry of input.catalog) {
      const existingGame = await tx.select().from(catalogGames).where(and(eq(catalogGames.title, entry.title), eq(catalogGames.platform, entry.platform))).limit(1);
      const game = existingGame[0] ?? await tx.insert(catalogGames).values({
        title: entry.title,
        platform: entry.platform,
        genre: entry.genre || null,
        note: entry.note || null
      }).then(async (result) => (await tx.select().from(catalogGames).where(eq(catalogGames.id, Number(result[0].insertId))).limit(1))[0]);
      if (!game) continue;
      const existingEntry = await tx.select({ id: streamerCatalog.id }).from(streamerCatalog).where(and(eq(streamerCatalog.streamerProfileId, profileId), eq(streamerCatalog.gameId, game.id))).limit(1);
      if (!existingEntry[0]) await tx.insert(streamerCatalog).values({ streamerProfileId: profileId, gameId: game.id, ownershipStatus: "unconfirmed", isVisible: true });
    }
    return (await tx.select().from(streamerProfiles).where(eq(streamerProfiles.id, profileId)).limit(1))[0];
  });
}
async function listAdminCreatorProfiles() {
  if (!db) return [];
  return db.select({ id: streamerProfiles.id, slug: streamerProfiles.slug, displayName: streamerProfiles.displayName, approvalStatus: streamerProfiles.approvalStatus, ownerUserId: streamerProfiles.ownerUserId }).from(streamerProfiles).orderBy(desc(streamerProfiles.createdAt));
}
async function setCreatorApproval(id, approvalStatus) {
  if (!db) throw new Error("Database is not configured");
  await db.update(streamerProfiles).set({ approvalStatus }).where(eq(streamerProfiles.id, id));
  return (await db.select().from(streamerProfiles).where(eq(streamerProfiles.id, id)).limit(1))[0];
}
async function createCreatorApplication(input) {
  if (!db) throw new Error("Database is not configured");
  const existing = (await db.select().from(creatorApplications).where(and(eq(creatorApplications.applicantUserId, input.applicantUserId), inArray(creatorApplications.status, ["pending", "in_review", "needs_changes"]))).orderBy(desc(creatorApplications.createdAt)).limit(1))[0];
  if (existing && existing.status !== "needs_changes") throw new Error("You already have an application under review.");
  const slugTaken = await db.select({ id: streamerProfiles.id }).from(streamerProfiles).where(eq(streamerProfiles.slug, input.requestedSlug)).limit(1);
  if (slugTaken[0]) throw new Error("That public creator slug is already in use.");
  if (existing) {
    await db.update(creatorApplications).set({ displayName: input.displayName, requestedSlug: input.requestedSlug, bio: input.bio || null, gamerTags: JSON.stringify(input.gamerTags), streamLinks: JSON.stringify(input.streamLinks), catalogDraft: JSON.stringify(input.catalog), status: "pending", reviewerNotes: null, reviewedByUserId: null }).where(eq(creatorApplications.id, existing.id));
    await db.delete(creatorApplicationChecks).where(eq(creatorApplicationChecks.applicationId, existing.id));
    await db.insert(creatorApplicationChecks).values([
      { applicationId: existing.id, checkType: "identity", subject: input.displayName },
      ...input.gamerTags.map((tag) => {
        const result = validateGamerTag(tag.platform, tag.handle);
        return { applicationId: existing.id, checkType: "gamer_tag", subject: `${tag.platform}: ${tag.handle}`, automatedStatus: result.status === "passed" ? "passed" : result.status === "warning" ? "warning" : "failed", automatedNote: result.note };
      }),
      ...input.streamLinks.map((link) => {
        const result = validatePublicStreamLink(link.platform, link.url);
        return { applicationId: existing.id, checkType: "stream_profile", subject: link.platform, evidenceUrl: link.url, automatedStatus: result.status === "passed" ? "passed" : result.status === "warning" ? "warning" : "failed", automatedNote: result.note };
      }),
      { applicationId: existing.id, checkType: "catalog", subject: `${input.catalog.length} submitted catalog entries` },
      { applicationId: existing.id, checkType: "policy", subject: "No-funds and platform-boundary acknowledgement" }
    ]);
    await db.insert(creatorApplicationEvents).values({ applicationId: existing.id, actorUserId: input.applicantUserId, fromStatus: existing.status, toStatus: "pending", note: "Applicant resubmitted after requested changes." });
    return (await db.select().from(creatorApplications).where(eq(creatorApplications.id, existing.id)).limit(1))[0];
  }
  const applicationResult = await db.insert(creatorApplications).values({
    applicantUserId: input.applicantUserId,
    displayName: input.displayName,
    requestedSlug: input.requestedSlug,
    bio: input.bio || null,
    gamerTags: JSON.stringify(input.gamerTags),
    streamLinks: JSON.stringify(input.streamLinks),
    catalogDraft: JSON.stringify(input.catalog),
    status: "pending"
  });
  const applicationId = Number(applicationResult[0].insertId);
  await db.insert(creatorApplicationChecks).values([
    { applicationId, checkType: "identity", subject: input.displayName },
    ...input.gamerTags.map((tag) => {
      const result = validateGamerTag(tag.platform, tag.handle);
      return { applicationId, checkType: "gamer_tag", subject: `${tag.platform}: ${tag.handle}`, automatedStatus: result.status === "passed" ? "passed" : result.status === "warning" ? "warning" : "failed", automatedNote: result.note };
    }),
    ...input.streamLinks.map((link) => {
      const result = validatePublicStreamLink(link.platform, link.url);
      return { applicationId, checkType: "stream_profile", subject: link.platform, evidenceUrl: link.url, automatedStatus: result.status === "passed" ? "passed" : result.status === "warning" ? "warning" : "failed", automatedNote: result.note };
    }),
    { applicationId, checkType: "catalog", subject: `${input.catalog.length} submitted catalog entries` },
    { applicationId, checkType: "policy", subject: "No-funds and platform-boundary acknowledgement" }
  ]);
  await db.insert(creatorApplicationEvents).values({ applicationId, actorUserId: input.applicantUserId, toStatus: "pending", note: "Application submitted." });
  return (await db.select().from(creatorApplications).where(eq(creatorApplications.id, applicationId)).limit(1))[0];
}
async function getCreatorApplicationForUser(applicantUserId) {
  if (!db) return void 0;
  return (await db.select().from(creatorApplications).where(eq(creatorApplications.applicantUserId, applicantUserId)).orderBy(desc(creatorApplications.createdAt)).limit(1))[0];
}
async function listCreatorApplicationChecks(applicationId) {
  if (!db) return [];
  return db.select().from(creatorApplicationChecks).where(eq(creatorApplicationChecks.applicationId, applicationId)).orderBy(asc(creatorApplicationChecks.createdAt));
}
async function listCreatorApplicationEvents(applicationId) {
  if (!db) return [];
  return db.select({ id: creatorApplicationEvents.id, actorUserId: creatorApplicationEvents.actorUserId, fromStatus: creatorApplicationEvents.fromStatus, toStatus: creatorApplicationEvents.toStatus, note: creatorApplicationEvents.note, createdAt: creatorApplicationEvents.createdAt, actorName: users.name }).from(creatorApplicationEvents).innerJoin(users, eq(creatorApplicationEvents.actorUserId, users.id)).where(eq(creatorApplicationEvents.applicationId, applicationId)).orderBy(desc(creatorApplicationEvents.createdAt));
}
async function updateCreatorApplicationCheck(input) {
  if (!db) throw new Error("Database is not configured");
  await db.update(creatorApplicationChecks).set({ status: input.status, reviewerNote: input.reviewerNote || null, reviewedByUserId: input.reviewerUserId, reviewedAt: /* @__PURE__ */ new Date() }).where(eq(creatorApplicationChecks.id, input.id));
  return (await db.select().from(creatorApplicationChecks).where(eq(creatorApplicationChecks.id, input.id)).limit(1))[0];
}
async function listCreatorApplicationsForAdmin() {
  if (!db) return [];
  return db.select({
    id: creatorApplications.id,
    applicantUserId: creatorApplications.applicantUserId,
    applicantName: users.name,
    applicantEmail: users.email,
    displayName: creatorApplications.displayName,
    requestedSlug: creatorApplications.requestedSlug,
    bio: creatorApplications.bio,
    gamerTags: creatorApplications.gamerTags,
    streamLinks: creatorApplications.streamLinks,
    catalogDraft: creatorApplications.catalogDraft,
    status: creatorApplications.status,
    reviewerNotes: creatorApplications.reviewerNotes,
    createdAt: creatorApplications.createdAt,
    updatedAt: creatorApplications.updatedAt
  }).from(creatorApplications).innerJoin(users, eq(creatorApplications.applicantUserId, users.id)).orderBy(desc(creatorApplications.createdAt));
}
async function reviewCreatorApplication(input) {
  if (!db) throw new Error("Database is not configured");
  const application = (await db.select().from(creatorApplications).where(eq(creatorApplications.id, input.id)).limit(1))[0];
  if (!application) throw new Error("Creator application not found.");
  if (input.status !== "approved") {
    await db.update(creatorApplications).set({ status: input.status, reviewerNotes: input.reviewerNotes || null, reviewedByUserId: input.reviewerUserId }).where(eq(creatorApplications.id, input.id));
    await db.insert(creatorApplicationEvents).values({ applicationId: input.id, actorUserId: input.reviewerUserId, fromStatus: application.status, toStatus: input.status, note: input.reviewerNotes || null });
    return (await db.select().from(creatorApplications).where(eq(creatorApplications.id, input.id)).limit(1))[0];
  }
  const existingSlug = await db.select({ id: streamerProfiles.id }).from(streamerProfiles).where(eq(streamerProfiles.slug, application.requestedSlug)).limit(1);
  if (existingSlug[0]) throw new Error("That public creator slug is already in use.");
  let catalog = [];
  try {
    catalog = JSON.parse(application.catalogDraft);
  } catch {
    throw new Error("The application catalog is invalid.");
  }
  return db.transaction(async (tx) => {
    const profileResult = await tx.insert(streamerProfiles).values({ ownerUserId: application.applicantUserId, slug: application.requestedSlug, displayName: application.displayName, bio: application.bio, gamerTags: application.gamerTags, streamLinks: application.streamLinks, verifiedAt: /* @__PURE__ */ new Date(), verifiedByUserId: input.reviewerUserId, approvalStatus: "approved" });
    const profileId = Number(profileResult[0].insertId);
    for (const entry of catalog) {
      const existingGame = await tx.select().from(catalogGames).where(and(eq(catalogGames.title, entry.title), eq(catalogGames.platform, entry.platform))).limit(1);
      const game = existingGame[0] ?? await tx.insert(catalogGames).values({ title: entry.title, platform: entry.platform, genre: entry.genre || null, note: entry.note || null }).then(async (result) => (await tx.select().from(catalogGames).where(eq(catalogGames.id, Number(result[0].insertId))).limit(1))[0]);
      if (game) await tx.insert(streamerCatalog).values({ streamerProfileId: profileId, gameId: game.id, ownershipStatus: "unconfirmed", isVisible: true });
    }
    await tx.update(creatorApplications).set({ status: "approved", reviewerNotes: input.reviewerNotes || null, reviewedByUserId: input.reviewerUserId }).where(eq(creatorApplications.id, input.id));
    await tx.update(creatorApplicationChecks).set({ status: "verified", reviewedByUserId: input.reviewerUserId, reviewedAt: /* @__PURE__ */ new Date() }).where(eq(creatorApplicationChecks.applicationId, input.id));
    await tx.insert(creatorApplicationEvents).values({ applicationId: input.id, actorUserId: input.reviewerUserId, fromStatus: application.status, toStatus: "approved", note: input.reviewerNotes || "Application approved and public profile created." });
    return (await tx.select().from(creatorApplications).where(eq(creatorApplications.id, input.id)).limit(1))[0];
  });
}

// server/routers.ts
var t = initTRPC.context().create({ transformer: superjson });
var publicProcedure = t.procedure;
var protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
  return next();
});
var creatorProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!ctx.user?.streamerProfileId && ctx.user?.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
  return next();
});
var adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user?.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
  return next();
});
var requestStatus = z.enum(["requested", "reviewing", "owned", "support_pending", "scheduled", "completed", "cancelled"]);
var appRouter = t.router({
  auth: t.router({
    me: publicProcedure.query(({ ctx }) => ctx.user)
  }),
  creatorApplications: t.router({
    mine: protectedProcedure.query(({ ctx }) => getCreatorApplicationForUser(ctx.user.id)),
    submit: protectedProcedure.input(z.object({
      displayName: z.string().trim().min(2).max(160),
      requestedSlug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and single hyphens only.").max(96),
      bio: z.string().trim().max(2e3).optional(),
      gamerTags: z.array(z.object({ platform: z.enum(["xbox", "playstation"]), handle: z.string().trim().min(2).max(160) })).min(1).max(4),
      streamLinks: z.array(z.object({ platform: z.string().trim().min(2).max(40), url: z.string().trim().url().max(512) })).min(1).max(8),
      catalog: z.array(z.object({ title: z.string().trim().min(1).max(180), platform: z.enum(["xbox", "playstation"]), genre: z.string().trim().max(120).optional(), note: z.string().trim().max(1e3).optional() })).min(1).max(100)
    })).mutation(({ ctx, input }) => createCreatorApplication({ ...input, applicantUserId: ctx.user.id }))
  }),
  admin: t.router({
    users: adminProcedure.query(() => listUsersForAdminOnboarding()),
    applications: adminProcedure.query(() => listCreatorApplicationsForAdmin()),
    applicationChecks: adminProcedure.input(z.object({ applicationId: z.number().int().positive() })).query(({ input }) => listCreatorApplicationChecks(input.applicationId)),
    applicationEvents: adminProcedure.input(z.object({ applicationId: z.number().int().positive() })).query(({ input }) => listCreatorApplicationEvents(input.applicationId)),
    updateApplicationCheck: adminProcedure.input(z.object({ id: z.number().int().positive(), status: z.enum(["unreviewed", "verified", "failed", "not_applicable"]), reviewerNote: z.string().trim().max(2e3).optional() })).mutation(({ ctx, input }) => updateCreatorApplicationCheck({ ...input, reviewerUserId: ctx.user.id })),
    reviewApplication: adminProcedure.input(z.object({ id: z.number().int().positive(), status: z.enum(["in_review", "needs_changes", "approved", "rejected"]), reviewerNotes: z.string().trim().max(2e3).optional() })).mutation(({ ctx, input }) => reviewCreatorApplication({ ...input, reviewerUserId: ctx.user.id })),
    creators: adminProcedure.query(() => listAdminCreatorProfiles()),
    createCreator: adminProcedure.input(z.object({
      ownerUserId: z.number().int().positive(),
      slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and single hyphens only.").max(96),
      displayName: z.string().trim().min(2).max(160),
      bio: z.string().trim().max(2e3).optional(),
      publicTipUrl: z.string().trim().url().max(512).optional().or(z.literal("")),
      approvalStatus: z.enum(["pending", "approved"]),
      catalog: z.array(z.object({
        title: z.string().trim().min(1).max(180),
        platform: z.enum(["xbox", "playstation"]),
        genre: z.string().trim().max(120).optional(),
        note: z.string().trim().max(1e3).optional()
      })).max(100)
    })).mutation(({ input }) => createCreatorOnboarding(input)),
    setApproval: adminProcedure.input(z.object({ id: z.number().int().positive(), approvalStatus: z.enum(["pending", "approved", "suspended", "archived"]) })).mutation(({ input }) => setCreatorApproval(input.id, input.approvalStatus))
  }),
  booking: t.router({
    profile: publicProcedure.input(z.object({ slug: z.string().trim().min(1).max(96) })).query(({ input }) => getStreamerProfileBySlug(input.slug)),
    catalog: publicProcedure.input(z.object({ streamerProfileId: z.number().int().positive() })).query(({ input }) => listApprovedCatalog(input.streamerProfileId)),
    publicRequests: publicProcedure.input(z.object({ streamerProfileId: z.number().int().positive() })).query(({ input }) => listPublicRequests(input.streamerProfileId)),
    createRequest: protectedProcedure.input(z.object({ streamerProfileId: z.number().int().positive(), gameId: z.number().int().positive(), viewerHandle: z.string().trim().min(1).max(160), viewerPlatform: z.string().trim().min(1).max(40), publicNote: z.string().trim().max(2e3).optional() })).mutation(({ ctx, input }) => createBookingRequest({ ...input, viewerUserId: ctx.user.id })),
    creatorRequests: creatorProcedure.input(z.object({ streamerProfileId: z.number().int().positive() })).query(({ ctx, input }) => {
      if (ctx.user?.role !== "admin" && ctx.user?.streamerProfileId !== input.streamerProfileId) throw new TRPCError({ code: "FORBIDDEN" });
      return listCreatorRequests(input.streamerProfileId);
    }),
    classifyRequest: creatorProcedure.input(z.object({ id: z.number().int().positive(), status: requestStatus })).mutation(({ input }) => updateRequestStatus(input.id, input.status)),
    setOwnership: creatorProcedure.input(z.object({ id: z.number().int().positive(), ownershipStatus: z.enum(["unconfirmed", "owned"]) })).mutation(({ input }) => setCatalogOwnership(input.id, input.ownershipStatus)),
    activeRequest: publicProcedure.input(z.object({ streamerProfileId: z.number().int().positive(), gameId: z.number().int().positive() })).query(({ input }) => findActiveRequest(input.streamerProfileId, input.gameId))
  })
});

// server/auth.ts
import { jwtVerify, SignJWT } from "jose";
function readCookie(header, name) {
  if (!header) return void 0;
  for (const part of header.split(";")) {
    const separator = part.indexOf("=");
    if (separator < 0) continue;
    const key = part.slice(0, separator).trim();
    if (key === name) return decodeURIComponent(part.slice(separator + 1).trim());
  }
  return void 0;
}
function claimUserId(payload) {
  const candidate = payload.userId ?? payload.user_id ?? payload.sub;
  const id = typeof candidate === "number" ? candidate : typeof candidate === "string" ? Number(candidate) : NaN;
  return Number.isInteger(id) && id > 0 ? id : void 0;
}
async function createSessionToken(userId) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("Session signing is not configured");
  return new SignJWT({ userId }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("1y").sign(new TextEncoder().encode(secret));
}
async function getSessionUserFromToken(token) {
  const secret = process.env.JWT_SECRET;
  if (!token || !secret) return null;
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    const userId = claimUserId(payload);
    if (!userId) return null;
    const user = await getUserById(userId);
    return user ?? null;
  } catch {
    return null;
  }
}
async function getSessionUser(request) {
  return getSessionUserFromToken(readCookie(request.headers.cookie, COOKIE_NAME));
}

// server/oauth.ts
async function exchangeOAuthCode(input) {
  const baseUrl = process.env.OAUTH_SERVER_URL?.replace(/\/+$/, "");
  const appId = process.env.VITE_APP_ID;
  if (!baseUrl || !appId) throw new Error("OAuth is not configured");
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code: input.code,
    state: input.state,
    redirect_uri: input.redirectUri,
    client_id: appId,
    app_id: appId
  });
  const response = await fetch(`${baseUrl}/oauth/token`, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json" }, body });
  if (!response.ok) throw new Error(`OAuth token exchange failed (${response.status})`);
  const payload = await response.json();
  const identity = payload.user ?? payload.profile ?? payload;
  const openId = identity.openId ?? identity.open_id ?? identity.id?.toString() ?? identity.sub;
  if (!openId) throw new Error("OAuth response did not include a stable user identity");
  return { openId, name: identity.name, email: identity.email };
}

// server/api.ts
function createApiRouter() {
  const router = express.Router();
  router.use(express.json());
  router.get("/oauth/callback", async (req, res) => {
    const code = typeof req.query.code === "string" ? req.query.code : void 0;
    const rawState = typeof req.query.state === "string" ? req.query.state : void 0;
    const decodedState = decodeOAuthState(rawState);
    const expectedNonce = readCookie(req.headers.cookie, OAUTH_STATE_COOKIE);
    if (!code || !rawState || !decodedState.redirectUri || !decodedState.nonce || decodedState.nonce !== expectedNonce) {
      res.status(403).send("Invalid OAuth state");
      return;
    }
    try {
      const identity = await exchangeOAuthCode({ code, state: rawState, redirectUri: decodedState.redirectUri });
      const user = await upsertUserFromOAuth(identity);
      if (!user) throw new Error("Unable to create session user");
      if (identity.openId === process.env.OWNER_OPEN_ID && user.role === "admin") await ensureOwnerProfile(user.id, identity.name ?? "AlmostLegitTV");
      const session = await createSessionToken(user.id);
      const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
      res.setHeader("Set-Cookie", [`${COOKIE_NAME}=${encodeURIComponent(session)}; Path=/; Max-Age=${Math.floor(ONE_YEAR_MS / 1e3)}; HttpOnly; SameSite=Lax${secure}`, `${OAUTH_STATE_COOKIE}=; Path=/; Max-Age=0; SameSite=None; Secure`]);
      res.redirect("/");
    } catch (error) {
      console.error("OAuth callback failed", error);
      res.status(502).send("Unable to complete sign-in");
    }
  });
  router.post("/auth/logout", (_req, res) => {
    const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
    res.setHeader("Set-Cookie", `${COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${secure}`);
    res.status(204).end();
  });
  router.use("/trpc", createExpressMiddleware({ router: appRouter, createContext: async ({ req }) => ({ user: await getSessionUser(req) }) }));
  return router;
}

// server/vercel-api.ts
var app = express2();
app.use("/api", createApiRouter());
var vercel_api_default = app;
export {
  vercel_api_default as default
};
