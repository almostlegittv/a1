import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { bookingRequests, catalogGames, creatorApplicationChecks, creatorApplicationEvents, creatorApplications, streamerCatalog, streamerProfiles, users } from "../drizzle/schema";
import { validateGamerTag, validatePublicStreamLink } from "../shared/identityValidation";

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
  const ownerBio = "Story-driven stream requests for the next chapter. The streamer reviews every request and decides what fits the schedule.";
  const ownerLinks = JSON.stringify([
    { platform: "TikTok", url: "https://www.tiktok.com/@almostlegittv" },
    { platform: "YouTube", url: "https://youtube.com/@almostlegittv" },
    { platform: "Kick", url: "https://kick.com/almostlegittv" },
    { platform: "Twitch", url: "https://m.twitch.tv/almostlegittv/home" },
    { platform: "Links", url: "https://lnk.bio/almostlegittv" },
  ]);
  const profile = existing[0] ?? (await db.insert(streamerProfiles).values({ ownerUserId: userId, slug: "almostlegittv", displayName: displayName || "AlmostLegitTV", bio: ownerBio, approvalStatus: "approved", gamerTags: JSON.stringify([]), streamLinks: ownerLinks, verifiedAt: new Date(), verifiedByUserId: userId }).then(async (result) => (await db.select().from(streamerProfiles).where(eq(streamerProfiles.id, Number(result[0].insertId))).limit(1))[0]));
  if (!profile) throw new Error("Unable to create owner profile");
  if (!profile.streamLinks) await db.update(streamerProfiles).set({ bio: profile.bio || ownerBio, streamLinks: ownerLinks, gamerTags: profile.gamerTags || JSON.stringify([]), approvalStatus: "approved", verifiedAt: profile.verifiedAt || new Date(), verifiedByUserId: profile.verifiedByUserId || userId }).where(eq(streamerProfiles.id, profile.id));
  const seedGames = [
    { title: "Red Dead Redemption 2", platform: "xbox" as const, genre: "Story-driven western", note: "A long-form frontier story with room for chat to shape the journey." },
    { title: "Kingdom Come: Deliverance II", platform: "xbox" as const, genre: "Story-driven RPG", note: "A grounded medieval journey where choices shape the road ahead." },
    { title: "Grand Theft Auto V", platform: "xbox" as const, genre: "Open-world action", note: "A character-driven crime saga with room for chat to steer the chaos." },
    { title: "S.T.A.L.K.E.R. 2", platform: "xbox" as const, genre: "Story-driven survival FPS", note: "A tense journey through the Zone where every decision carries weight." },
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

export async function listUsersForAdminOnboarding() {
  if (!db) return [];
  return db
    .select({ id: users.id, name: users.name, email: users.email, role: users.role })
    .from(users)
    .orderBy(asc(users.name), asc(users.email));
}

export type CreatorOnboardingInput = {
  ownerUserId: number;
  slug: string;
  displayName: string;
  bio?: string;
  publicTipUrl?: string;
  approvalStatus: "pending" | "approved";
  catalog: Array<{
    title: string;
    platform: "xbox" | "playstation";
    genre?: string;
    note?: string;
  }>;
};

export async function createCreatorOnboarding(input: CreatorOnboardingInput) {
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
      approvalStatus: input.approvalStatus,
    });
    const profileId = Number(profileResult[0].insertId);
    for (const entry of input.catalog) {
      const existingGame = await tx.select().from(catalogGames).where(and(eq(catalogGames.title, entry.title), eq(catalogGames.platform, entry.platform))).limit(1);
      const game = existingGame[0] ?? (await tx.insert(catalogGames).values({
        title: entry.title,
        platform: entry.platform,
        genre: entry.genre || null,
        note: entry.note || null,
      }).then(async (result) => (await tx.select().from(catalogGames).where(eq(catalogGames.id, Number(result[0].insertId))).limit(1))[0]));
      if (!game) continue;
      const existingEntry = await tx.select({ id: streamerCatalog.id }).from(streamerCatalog).where(and(eq(streamerCatalog.streamerProfileId, profileId), eq(streamerCatalog.gameId, game.id))).limit(1);
      if (!existingEntry[0]) await tx.insert(streamerCatalog).values({ streamerProfileId: profileId, gameId: game.id, ownershipStatus: "unconfirmed", isVisible: true });
    }
    return (await tx.select().from(streamerProfiles).where(eq(streamerProfiles.id, profileId)).limit(1))[0];
  });
}

export async function listAdminCreatorProfiles() {
  if (!db) return [];
  return db
    .select({ id: streamerProfiles.id, slug: streamerProfiles.slug, displayName: streamerProfiles.displayName, approvalStatus: streamerProfiles.approvalStatus, ownerUserId: streamerProfiles.ownerUserId })
    .from(streamerProfiles)
    .orderBy(desc(streamerProfiles.createdAt));
}

export async function setCreatorApproval(id: number, approvalStatus: "pending" | "approved" | "suspended" | "archived") {
  if (!db) throw new Error("Database is not configured");
  await db.update(streamerProfiles).set({ approvalStatus }).where(eq(streamerProfiles.id, id));
  return (await db.select().from(streamerProfiles).where(eq(streamerProfiles.id, id)).limit(1))[0];
}

export type CreatorApplicationInput = {
  applicantUserId: number;
  displayName: string;
  requestedSlug: string;
  bio?: string;
  gamerTags: Array<{ platform: "xbox" | "playstation"; handle: string }>;
  streamLinks: Array<{ platform: string; url: string }>;
  catalog: Array<{ title: string; platform: "xbox" | "playstation"; genre?: string; note?: string }>;
};

export async function createCreatorApplication(input: CreatorApplicationInput) {
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
      ...input.gamerTags.map((tag) => { const result = validateGamerTag(tag.platform, tag.handle); return { applicationId: existing.id, checkType: "gamer_tag" as const, subject: `${tag.platform}: ${tag.handle}`, automatedStatus: result.status === "passed" ? "passed" as const : result.status === "warning" ? "warning" as const : "failed" as const, automatedNote: result.note }; }),
      ...input.streamLinks.map((link) => { const result = validatePublicStreamLink(link.platform, link.url); return { applicationId: existing.id, checkType: "stream_profile" as const, subject: link.platform, evidenceUrl: link.url, automatedStatus: result.status === "passed" ? "passed" as const : result.status === "warning" ? "warning" as const : "failed" as const, automatedNote: result.note }; }),
      { applicationId: existing.id, checkType: "catalog" as const, subject: `${input.catalog.length} submitted catalog entries` },
      { applicationId: existing.id, checkType: "policy" as const, subject: "No-funds and platform-boundary acknowledgement" },
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
    status: "pending",
  });
  const applicationId = Number(applicationResult[0].insertId);
  await db.insert(creatorApplicationChecks).values([
    { applicationId, checkType: "identity", subject: input.displayName },
    ...input.gamerTags.map((tag) => { const result = validateGamerTag(tag.platform, tag.handle); return { applicationId, checkType: "gamer_tag" as const, subject: `${tag.platform}: ${tag.handle}`, automatedStatus: result.status === "passed" ? "passed" as const : result.status === "warning" ? "warning" as const : "failed" as const, automatedNote: result.note }; }),
    ...input.streamLinks.map((link) => { const result = validatePublicStreamLink(link.platform, link.url); return { applicationId, checkType: "stream_profile" as const, subject: link.platform, evidenceUrl: link.url, automatedStatus: result.status === "passed" ? "passed" as const : result.status === "warning" ? "warning" as const : "failed" as const, automatedNote: result.note }; }),
    { applicationId, checkType: "catalog", subject: `${input.catalog.length} submitted catalog entries` },
    { applicationId, checkType: "policy", subject: "No-funds and platform-boundary acknowledgement" },
  ]);
  await db.insert(creatorApplicationEvents).values({ applicationId, actorUserId: input.applicantUserId, toStatus: "pending", note: "Application submitted." });
  return (await db.select().from(creatorApplications).where(eq(creatorApplications.id, applicationId)).limit(1))[0];
}

export async function getCreatorApplicationForUser(applicantUserId: number) {
  if (!db) return undefined;
  return (await db.select().from(creatorApplications).where(eq(creatorApplications.applicantUserId, applicantUserId)).orderBy(desc(creatorApplications.createdAt)).limit(1))[0];
}

export async function listCreatorApplicationChecks(applicationId: number) {
  if (!db) return [];
  return db.select().from(creatorApplicationChecks).where(eq(creatorApplicationChecks.applicationId, applicationId)).orderBy(asc(creatorApplicationChecks.createdAt));
}

export async function listCreatorApplicationEvents(applicationId: number) {
  if (!db) return [];
  return db.select({ id: creatorApplicationEvents.id, actorUserId: creatorApplicationEvents.actorUserId, fromStatus: creatorApplicationEvents.fromStatus, toStatus: creatorApplicationEvents.toStatus, note: creatorApplicationEvents.note, createdAt: creatorApplicationEvents.createdAt, actorName: users.name }).from(creatorApplicationEvents).innerJoin(users, eq(creatorApplicationEvents.actorUserId, users.id)).where(eq(creatorApplicationEvents.applicationId, applicationId)).orderBy(desc(creatorApplicationEvents.createdAt));
}

export async function updateCreatorApplicationCheck(input: { id: number; reviewerUserId: number; status: "unreviewed" | "verified" | "failed" | "not_applicable"; reviewerNote?: string }) {
  if (!db) throw new Error("Database is not configured");
  await db.update(creatorApplicationChecks).set({ status: input.status, reviewerNote: input.reviewerNote || null, reviewedByUserId: input.reviewerUserId, reviewedAt: new Date() }).where(eq(creatorApplicationChecks.id, input.id));
  return (await db.select().from(creatorApplicationChecks).where(eq(creatorApplicationChecks.id, input.id)).limit(1))[0];
}

export async function listCreatorApplicationsForAdmin() {
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
    updatedAt: creatorApplications.updatedAt,
  }).from(creatorApplications).innerJoin(users, eq(creatorApplications.applicantUserId, users.id)).orderBy(desc(creatorApplications.createdAt));
}

export async function reviewCreatorApplication(input: { id: number; reviewerUserId: number; status: "in_review" | "needs_changes" | "approved" | "rejected"; reviewerNotes?: string }) {
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
  let catalog: Array<{ title: string; platform: "xbox" | "playstation"; genre?: string; note?: string }> = [];
  try { catalog = JSON.parse(application.catalogDraft) as typeof catalog; } catch { throw new Error("The application catalog is invalid."); }
  return db.transaction(async (tx) => {
    const profileResult = await tx.insert(streamerProfiles).values({ ownerUserId: application.applicantUserId, slug: application.requestedSlug, displayName: application.displayName, bio: application.bio, gamerTags: application.gamerTags, streamLinks: application.streamLinks, verifiedAt: new Date(), verifiedByUserId: input.reviewerUserId, approvalStatus: "approved" });
    const profileId = Number(profileResult[0].insertId);
    for (const entry of catalog) {
      const existingGame = await tx.select().from(catalogGames).where(and(eq(catalogGames.title, entry.title), eq(catalogGames.platform, entry.platform))).limit(1);
      const game = existingGame[0] ?? (await tx.insert(catalogGames).values({ title: entry.title, platform: entry.platform, genre: entry.genre || null, note: entry.note || null }).then(async (result) => (await tx.select().from(catalogGames).where(eq(catalogGames.id, Number(result[0].insertId))).limit(1))[0]));
      if (game) await tx.insert(streamerCatalog).values({ streamerProfileId: profileId, gameId: game.id, ownershipStatus: "unconfirmed", isVisible: true });
    }
    await tx.update(creatorApplications).set({ status: "approved", reviewerNotes: input.reviewerNotes || null, reviewedByUserId: input.reviewerUserId }).where(eq(creatorApplications.id, input.id));
    await tx.update(creatorApplicationChecks).set({ status: "verified", reviewedByUserId: input.reviewerUserId, reviewedAt: new Date() }).where(eq(creatorApplicationChecks.applicationId, input.id));
    await tx.insert(creatorApplicationEvents).values({ applicationId: input.id, actorUserId: input.reviewerUserId, fromStatus: application.status, toStatus: "approved", note: input.reviewerNotes || "Application approved and public profile created." });
    return (await tx.select().from(creatorApplications).where(eq(creatorApplications.id, input.id)).limit(1))[0];
  });
}
