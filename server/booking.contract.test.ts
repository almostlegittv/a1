import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { bookingRequests, catalogGames, streamerCatalog, streamerProfiles } from "../drizzle/schema";

describe("booking contract", () => {
  it("keeps public catalog and request procedures available", () => {
    expect(appRouter._def.procedures["booking.catalog"]).toBeDefined();
    expect(appRouter._def.procedures["booking.publicRequests"]).toBeDefined();
    expect(appRouter._def.procedures["booking.createRequest"]).toBeDefined();
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

  it("contains no on-site money, payment, wallet, code, or fee fields", () => {
    const fields = [
      ...Object.keys(streamerProfiles),
      ...Object.keys(catalogGames),
      ...Object.keys(streamerCatalog),
      ...Object.keys(bookingRequests),
    ].join(" ").toLowerCase();
    expect(fields).not.toMatch(/payment|wallet|balance|giftcode|gift_code|fee|amount|currency|transaction/);
  });
});
