import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { z } from "zod";
import { createBookingRequest, createCreatorApplication, createCreatorOnboarding, createGameSuggestion, findActiveRequest, getCreatorApplicationForUser, getStreamerProfileBySlug, listAdminCreatorProfiles, listCreatorApplicationChecks, listCreatorApplicationEvents, listCreatorApplicationsForAdmin, listApprovedCatalog, listCreatorRequests, listGameSuggestions, listPublicRequests, listUsersForAdminOnboarding, reviewCreatorApplication, setCatalogOwnership, setCreatorApproval, updateCreatorApplicationCheck, updateGameSuggestionStatus, updateRequestStatus } from "./db";

export type AppUser = { id: number; role: "user" | "admin"; streamerProfileId?: number } | null;
export type AppContext = { user: AppUser };

const t = initTRPC.context<AppContext>().create({ transformer: superjson });
const publicProcedure = t.procedure;
const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
  return next();
});
const creatorProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!ctx.user?.streamerProfileId && ctx.user?.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
  return next();
});
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user?.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
  return next();
});

const requestStatus = z.enum(["requested", "reviewing", "owned", "support_pending", "scheduled", "completed", "cancelled"]);

export const appRouter = t.router({
  auth: t.router({
    me: publicProcedure.query(({ ctx }) => ctx.user),
  }),
  creatorApplications: t.router({
    mine: protectedProcedure.query(({ ctx }) => getCreatorApplicationForUser(ctx.user!.id)),
    submit: protectedProcedure.input(z.object({
      displayName: z.string().trim().min(2).max(160),
      requestedSlug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and single hyphens only.").max(96),
      bio: z.string().trim().max(2000).optional(),
      gamerTags: z.array(z.object({ platform: z.enum(["xbox", "playstation"]), handle: z.string().trim().min(2).max(160) })).min(1).max(4),
      streamLinks: z.array(z.object({ platform: z.string().trim().min(2).max(40), url: z.string().trim().url().max(512) })).min(1).max(8),
      catalog: z.array(z.object({ title: z.string().trim().min(1).max(180), platform: z.enum(["xbox", "playstation"]), genre: z.string().trim().max(120).optional(), note: z.string().trim().max(1000).optional() })).min(1).max(100),
    })).mutation(({ ctx, input }) => createCreatorApplication({ ...input, applicantUserId: ctx.user!.id })),
  }),
  admin: t.router({
    users: adminProcedure.query(() => listUsersForAdminOnboarding()),
    applications: adminProcedure.query(() => listCreatorApplicationsForAdmin()),
    applicationChecks: adminProcedure.input(z.object({ applicationId: z.number().int().positive() })).query(({ input }) => listCreatorApplicationChecks(input.applicationId)),
    applicationEvents: adminProcedure.input(z.object({ applicationId: z.number().int().positive() })).query(({ input }) => listCreatorApplicationEvents(input.applicationId)),
    updateApplicationCheck: adminProcedure.input(z.object({ id: z.number().int().positive(), status: z.enum(["unreviewed", "verified", "failed", "not_applicable"]), reviewerNote: z.string().trim().max(2000).optional() })).mutation(({ ctx, input }) => updateCreatorApplicationCheck({ ...input, reviewerUserId: ctx.user!.id })),
    reviewApplication: adminProcedure.input(z.object({ id: z.number().int().positive(), status: z.enum(["in_review", "needs_changes", "approved", "rejected"]), reviewerNotes: z.string().trim().max(2000).optional() })).mutation(({ ctx, input }) => reviewCreatorApplication({ ...input, reviewerUserId: ctx.user!.id })),
    creators: adminProcedure.query(() => listAdminCreatorProfiles()),
    createCreator: adminProcedure.input(z.object({
      ownerUserId: z.number().int().positive(),
      slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and single hyphens only.").max(96),
      displayName: z.string().trim().min(2).max(160),
      bio: z.string().trim().max(2000).optional(),
      publicTipUrl: z.string().trim().url().max(512).optional().or(z.literal("")),
      approvalStatus: z.enum(["pending", "approved"]),
      catalog: z.array(z.object({
        title: z.string().trim().min(1).max(180),
        platform: z.enum(["xbox", "playstation"]),
        genre: z.string().trim().max(120).optional(),
        note: z.string().trim().max(1000).optional(),
      })).max(100),
    })).mutation(({ input }) => createCreatorOnboarding(input)),
    setApproval: adminProcedure.input(z.object({ id: z.number().int().positive(), approvalStatus: z.enum(["pending", "approved", "suspended", "archived"]) })).mutation(({ input }) => setCreatorApproval(input.id, input.approvalStatus)),
  }),
  booking: t.router({
    profile: publicProcedure.input(z.object({ slug: z.string().trim().min(1).max(96) })).query(({ input }) => getStreamerProfileBySlug(input.slug)),
    catalog: publicProcedure.input(z.object({ streamerProfileId: z.number().int().positive() })).query(({ input }) => listApprovedCatalog(input.streamerProfileId)),
    publicRequests: publicProcedure.input(z.object({ streamerProfileId: z.number().int().positive() })).query(({ input }) => listPublicRequests(input.streamerProfileId)),
    createRequest: protectedProcedure.input(z.object({ streamerProfileId: z.number().int().positive(), gameId: z.number().int().positive(), viewerHandle: z.string().trim().min(1).max(160), viewerPlatform: z.string().trim().min(1).max(40), publicNote: z.string().trim().max(2000).optional() })).mutation(({ ctx, input }) => createBookingRequest({ ...input, viewerUserId: ctx.user!.id })),
    creatorRequests: creatorProcedure.input(z.object({ streamerProfileId: z.number().int().positive() })).query(({ ctx, input }) => { if (ctx.user?.role !== "admin" && ctx.user?.streamerProfileId !== input.streamerProfileId) throw new TRPCError({ code: "FORBIDDEN" }); return listCreatorRequests(input.streamerProfileId); }),
    classifyRequest: creatorProcedure.input(z.object({ id: z.number().int().positive(), status: requestStatus })).mutation(({ input }) => updateRequestStatus(input.id, input.status)),
    setOwnership: creatorProcedure.input(z.object({ id: z.number().int().positive(), ownershipStatus: z.enum(["unconfirmed", "owned"]) })).mutation(({ input }) => setCatalogOwnership(input.id, input.ownershipStatus)),
    activeRequest: publicProcedure.input(z.object({ streamerProfileId: z.number().int().positive(), gameId: z.number().int().positive() })).query(({ input }) => findActiveRequest(input.streamerProfileId, input.gameId)),
    suggestGame: protectedProcedure.input(z.object({ streamerProfileId: z.number().int().positive(), title: z.string().trim().min(2).max(180), platform: z.enum(["xbox", "playstation"]), note: z.string().trim().max(1000).optional() })).mutation(({ ctx, input }) => createGameSuggestion({ ...input, submittedByUserId: ctx.user!.id })),
    creatorSuggestions: creatorProcedure.input(z.object({ streamerProfileId: z.number().int().positive() })).query(({ ctx, input }) => { if (ctx.user?.role !== "admin" && ctx.user?.streamerProfileId !== input.streamerProfileId) throw new TRPCError({ code: "FORBIDDEN" }); return listGameSuggestions(input.streamerProfileId); }),
    updateSuggestion: creatorProcedure.input(z.object({ id: z.number().int().positive(), status: z.enum(["pending", "reviewed", "accepted", "declined"]) })).mutation(({ input }) => updateGameSuggestionStatus(input.id, input.status)),
  }),
});

export type AppRouter = typeof appRouter;
