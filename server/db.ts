import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { bookingRequests, catalogGames, streamerCatalog, streamerProfiles, users } from "../drizzle/schema";

const pool = process.env.DATABASE_URL ? mysql.createPool(process.env.DATABASE_URL) : null;
export const db = pool ? drizzle(pool) : null;

export async function getUserByOpenId(openId: string) {
  if (!db) return undefined;
  const rows = await db.select({ id: users.id, role: users.role }).from(users).where(eq(users.openId, openId)).limit(1);
  const user = rows[0];
  if (!user) return undefined;
  const profiles = await db.select({ id: streamerProfiles.id }).from(streamerProfiles).where(and(eq(streamerProfiles.ownerUserId, user.id), eq(streamerProfiles.approvalStatus, "approved"))).limit(1);
  return { ...user, streamerProfileId: profiles[0]?.id };
}

export async function upsertUserFromOAuth(input: { openId: string; name?: string; email?: string }) {
  if (!db) throw new Error("Database is not configured");
  const existing = await db.select().from(users).where(eq(users.openId, input.openId)).limit(1);
  if (existing[0]) {
    await db.update(users).set({ name: input.name ?? existing[0].name, email: input.email ?? existing[0].email, lastSignedIn: new Date() }).where(eq(users.id, existing[0].id));
    return getUserById(existing[0].id);
  }
  const result = await db.insert(users).values({ openId: input.openId, name: input.name ?? null, email: input.email ?? null, loginMethod: "manus-oauth", role: input.openId === process.env.OWNER_OPEN_ID ? "admin" : "user" });
  return getUserById(Number(result[0].insertId));
}

export async function ensureOwnerProfile(userId: number, displayName: string) {
  if (!db) throw new Error("Database is not configured");
  const existing = await db.select().from(streamerProfiles).where(eq(streamerProfiles.ownerUserId, userId)).limit(1);
  const profile = existing[0] ?? (await db.insert(streamerProfiles).values({ ownerUserId: userId, slug: "almostlegittv", displayName: displayName || "AlmostLegitTV", approvalStatus: "approved" }).then(async (result) => (await db.select().from(streamerProfiles).where(eq(streamerProfiles.id, Number(result[0].insertId))).limit(1))[0]));
  if (!profile) throw new Error("Unable to create owner profile");
  const seedGames = [
    { title: "Red Dead Redemption 2", platform: "xbox" as const, genre: "Open-world western", note: "Already in rotation." },
    { title: "S.T.A.L.K.E.R. 2", platform: "xbox" as const, genre: "Survival FPS", note: "A high-pressure run." },
    { title: "Elden Ring", platform: "xbox" as const, genre: "Action RPG", note: "Big bosses, bigger maps." },
    { title: "Returnal", platform: "playstation" as const, genre: "Roguelike shooter", note: "A high-pressure PlayStation run." },
    { title: "Ghost of Tsushima", platform: "playstation" as const, genre: "Action adventure", note: "Timing can be coordinated off-platform." },
  ];
  for (const game of seedGames) {
    const existingGame = await db.select().from(catalogGames).where(and(eq(catalogGames.title, game.title), eq(catalogGames.platform, game.platform))).limit(1);
    const catalogGame = existingGame[0] ?? (await db.insert(catalogGames).values(game).then(async (result) => (await db.select().from(catalogGames).where(eq(catalogGames.id, Number(result[0].insertId))).limit(1))[0]));
    if (!catalogGame) continue;
    const existingEntry = await db.select().from(streamerCatalog).where(and(eq(streamerCatalog.streamerProfileId, profile.id), eq(streamerCatalog.gameId, catalogGame.id))).limit(1);
    if (!existingEntry[0]) await db.insert(streamerCatalog).values({ streamerProfileId: profile.id, gameId: catalogGame.id, ownershipStatus: game.title === "Red Dead Redemption 2" || game.title === "Ghost of Tsushima" ? "owned" : "unconfirmed" });
  }
  return profile;
}

export async function getUserById(id: number) {
  if (!db) return undefined;
  const rows = await db.select({ id: users.id, role: users.role }).from(users).where(eq(users.id, id)).limit(1);
  const user = rows[0];
  if (!user) return undefined;
  const profiles = await db.select({ id: streamerProfiles.id }).from(streamerProfiles).where(and(eq(streamerProfiles.ownerUserId, user.id), eq(streamerProfiles.approvalStatus, "approved"))).limit(1);
  return { ...user, streamerProfileId: profiles[0]?.id };
}

export async function listApprovedCatalog(streamerProfileId: number) {
  if (!db) return [];
  return db
    .select({
      id: catalogGames.id,
      title: catalogGames.title,
      platform: catalogGames.platform,
      genre: catalogGames.genre,
      note: catalogGames.note,
      releaseDate: catalogGames.releaseDate,
      popularityScore: catalogGames.popularityScore,
      ownershipStatus: streamerCatalog.ownershipStatus,
      isVisible: streamerCatalog.isVisible,
    })
    .from(streamerCatalog)
    .innerJoin(catalogGames, eq(streamerCatalog.gameId, catalogGames.id))
    .innerJoin(streamerProfiles, eq(streamerCatalog.streamerProfileId, streamerProfiles.id))
    .where(and(eq(streamerCatalog.streamerProfileId, streamerProfileId), eq(streamerProfiles.approvalStatus, "approved"), eq(catalogGames.isActive, true), eq(streamerCatalog.isVisible, true)))
    .orderBy(asc(catalogGames.title));
}

export async function listPublicRequests(streamerProfileId: number) {
  if (!db) return [];
  return db
    .select({
      id: bookingRequests.id,
      gameId: bookingRequests.gameId,
      title: catalogGames.title,
      platform: catalogGames.platform,
      status: bookingRequests.status,
      publicNote: bookingRequests.publicNote,
      createdAt: bookingRequests.createdAt,
    })
    .from(bookingRequests)
    .innerJoin(catalogGames, eq(bookingRequests.gameId, catalogGames.id))
    .where(and(eq(bookingRequests.streamerProfileId, streamerProfileId), inArray(bookingRequests.status, ["requested", "reviewing", "owned", "support_pending", "scheduled"])))
    .orderBy(desc(bookingRequests.createdAt));
}

export async function listCreatorRequests(streamerProfileId: number) {
  if (!db) return [];
  return db
    .select()
    .from(bookingRequests)
    .where(eq(bookingRequests.streamerProfileId, streamerProfileId))
    .orderBy(desc(bookingRequests.createdAt));
}

export async function findActiveRequest(streamerProfileId: number, gameId: number) {
  if (!db) return undefined;
  const rows = await db
    .select()
    .from(bookingRequests)
    .where(and(eq(bookingRequests.streamerProfileId, streamerProfileId), eq(bookingRequests.gameId, gameId), inArray(bookingRequests.status, ["requested", "reviewing", "owned", "support_pending", "scheduled"])))
    .limit(1);
  return rows[0];
}

export async function getStreamerProfileBySlug(slug: string) {
  if (!db) return undefined;
  const rows = await db.select().from(streamerProfiles).where(and(eq(streamerProfiles.slug, slug), eq(streamerProfiles.approvalStatus, "approved"))).limit(1);
  return rows[0];
}

export async function createBookingRequest(input: { streamerProfileId: number; gameId: number; viewerUserId?: number; viewerHandle: string; viewerPlatform: string; publicNote?: string }) {
  if (!db) throw new Error("Database is not configured");
  const existing = await findActiveRequest(input.streamerProfileId, input.gameId);
  if (existing) return { created: false as const, request: existing };
  const result = await db.insert(bookingRequests).values({ ...input, viewerUserId: input.viewerUserId ?? null, publicNote: input.publicNote ?? null });
  const requestId = Number(result[0].insertId);
  const rows = await db.select().from(bookingRequests).where(eq(bookingRequests.id, requestId)).limit(1);
  return { created: true as const, request: rows[0] };
}

export async function updateRequestStatus(id: number, status: "requested" | "reviewing" | "owned" | "support_pending" | "scheduled" | "completed" | "cancelled") {
  if (!db) throw new Error("Database is not configured");
  await db.update(bookingRequests).set({ status }).where(eq(bookingRequests.id, id));
  const rows = await db.select().from(bookingRequests).where(eq(bookingRequests.id, id)).limit(1);
  return rows[0];
}

export async function setCatalogOwnership(id: number, ownershipStatus: "unconfirmed" | "owned") {
  if (!db) throw new Error("Database is not configured");
  await db.update(streamerCatalog).set({ ownershipStatus }).where(eq(streamerCatalog.id, id));
  const rows = await db.select().from(streamerCatalog).where(eq(streamerCatalog.id, id)).limit(1);
  return rows[0];
}
