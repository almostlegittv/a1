import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { appRouter } from "./routers";

const caller = (user: { id: number; role: "user" | "admin"; streamerProfileId?: number } | null) => appRouter.createCaller({ user });

describe("creator application contracts", () => {
  it("requires sign-in to submit an application", async () => {
    await expect(caller(null).creatorApplications.submit({
      displayName: "Test Creator",
      requestedSlug: "test-creator",
      gamerTags: [{ platform: "xbox", handle: "test-tag" }],
      streamLinks: [{ platform: "TikTok", url: "https://tiktok.com/@test" }],
      catalog: [{ title: "Test Game", platform: "xbox" }],
    })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("keeps the admin application queue restricted to admins", async () => {
    await expect(caller({ id: 3, role: "user" }).admin.applications()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("rejects malformed public slugs and empty catalog submissions", async () => {
    await expect(caller({ id: 3, role: "user" }).creatorApplications.submit({
      displayName: "Test Creator",
      requestedSlug: "Not A Valid Slug",
      gamerTags: [{ platform: "xbox", handle: "test-tag" }],
      streamLinks: [{ platform: "TikTok", url: "https://tiktok.com/@test" }],
      catalog: [],
    })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("does not introduce funds, payment, wallet, or gift-code application fields", () => {
    const schema = readFileSync(new URL("../drizzle/schema.ts", import.meta.url), "utf8").toLowerCase();
    const applicationSection = schema.slice(schema.indexOf("creatorapplications"), schema.indexOf("export const bookingrequests"));
    expect(applicationSection).not.toMatch(/payment|wallet|gift.?code|service.?fee|funds/);
  });
});
