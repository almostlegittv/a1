import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { readFileSync } from "node:fs";

const caller = (user: { id: number; role: "user" | "admin"; streamerProfileId?: number } | null) => appRouter.createCaller({ user });

describe("admin onboarding contracts", () => {
  it("rejects anonymous onboarding access", async () => {
    await expect(caller(null).admin.users()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("rejects non-admin onboarding access", async () => {
    await expect(caller({ id: 7, role: "user" }).admin.users()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("does not expose funds, payment, wallet, or gift-code fields", () => {
    const schema = readFileSync(new URL("../drizzle/schema.ts", import.meta.url), "utf8").toLowerCase();
    expect(schema).not.toMatch(/payment|wallet|gift.?code|service.?fee|funds/);
  });

  it("keeps onboarding approval limited to pending or approved at creation", async () => {
    await expect(caller({ id: 1, role: "admin" }).admin.createCreator({
      ownerUserId: 2,
      slug: "creator-test",
      displayName: "Creator Test",
      approvalStatus: "suspended" as never,
      catalog: [],
    })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
