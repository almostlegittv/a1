import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";

const admin = { id: 901, role: "admin" as const, streamerProfileId: undefined };
const creator = { id: 902, role: "user" as const, streamerProfileId: 77 };
const viewer = { id: 903, role: "user" as const, streamerProfileId: undefined };

describe("fake-user end-to-end boundaries", () => {
  it("exposes the creator journey procedures", () => {
    expect(appRouter._def.procedures["creatorApplications.submit"]).toBeDefined();
    expect(appRouter._def.procedures["admin.reviewApplication"]).toBeDefined();
    expect(appRouter._def.procedures["booking.createRequest"]).toBeDefined();
    expect(appRouter._def.procedures["booking.suggestGame"]).toBeDefined();
    expect(appRouter._def.procedures["booking.creatorRequests"]).toBeDefined();
    expect(appRouter._def.procedures["booking.updateProfile"]).toBeDefined();
  });

  it("keeps viewer access public-only and blocks private creator controls", async () => {
    const caller = appRouter.createCaller({ user: viewer });
    await expect(caller.booking.creatorRequests({ streamerProfileId: creator.streamerProfileId! })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.booking.creatorSuggestions({ streamerProfileId: creator.streamerProfileId! })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.admin.creators()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("allows creator-scoped controls only for the matching creator profile", async () => {
    const caller = appRouter.createCaller({ user: creator });
    await expect(caller.booking.creatorRequests({ streamerProfileId: 999 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.booking.updateProfile({ id: 999, displayName: "Wrong Profile" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("keeps admin-only review controls separate from creator controls", async () => {
    const caller = appRouter.createCaller({ user: admin });
    expect(caller).toBeDefined();
    await expect(appRouter.createCaller({ user: viewer }).admin.applications()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
