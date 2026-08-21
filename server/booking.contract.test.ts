import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { bookingRequests, catalogGames, gameSuggestions, streamerCatalog, streamerProfiles } from "../drizzle/schema";

describe("booking contract", () => {
  it("keeps public catalog and request procedures available", () => {
    expect(appRouter._def.procedures["booking.catalog"]).toBeDefined();
    expect(appRouter._def.procedures["booking.publicRequests"]).toBeDefined();
    expect(appRouter._def.procedures["booking.createRequest"]).toBeDefined();
    expect(appRouter._def.procedures["booking.suggestGame"]).toBeDefined();
    expect(appRouter._def.procedures["booking.creatorSuggestions"]).toBeDefined();
    expect(appRouter._def.procedures["booking.myProfile"]).toBeDefined();
    expect(appRouter._def.procedures["booking.updateProfile"]).toBeDefined();
  });

  it("requires an authenticated user to create a booking request", async () => {
    const caller = appRouter.createCaller({ user: null });
    await expect(caller.booking.createRequest({
      streamerProfileId: 1,
      gameId: 1,
      viewerHandle: "@viewer",
      viewerPlatform: "TikTok",
    })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("requires an authenticated user to suggest a game", async () => {
    const caller = appRouter.createCaller({ user: null });
    await expect(caller.booking.suggestGame({ streamerProfileId: 1, title: "A new story", platform: "xbox" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("requires creator authorization to edit a profile", async () => {
    const caller = appRouter.createCaller({ user: null });
    await expect(caller.booking.updateProfile({ id: 1, displayName: "Test Creator" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("contains no on-site money, payment, wallet, code, or fee fields", () => {
    const fields = [
      ...Object.keys(streamerProfiles),
      ...Object.keys(catalogGames),
      ...Object.keys(streamerCatalog),
      ...Object.keys(bookingRequests),
      ...Object.keys(gameSuggestions),
    ].join(" ").toLowerCase();
    expect(fields).not.toMatch(/payment|wallet|balance|giftcode|gift_code|fee|amount|currency|transaction/);
  });
});
