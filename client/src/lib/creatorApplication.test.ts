import { describe, expect, it } from "vitest";
import { validateCreatorApplicationDraft } from "./creatorApplication";

const validDraft = {
  displayName: "Storyline Creator",
  requestedSlug: "storyline-creator",
  bio: "Long-form story games with chat.",
  gamerTags: [{ platform: "xbox" as const, handle: "story-tag" }],
  streamLinks: [{ platform: "TikTok", url: "https://tiktok.com/@storyline" }],
  catalog: [{ title: "Red Dead Redemption 2", platform: "xbox" as const }],
};

describe("creator application validation", () => {
  it("accepts a complete draft", () => {
    expect(validateCreatorApplicationDraft(validDraft)).toEqual({});
  });

  it("identifies each incomplete section", () => {
    expect(validateCreatorApplicationDraft({ ...validDraft, displayName: "", requestedSlug: "Not Valid", bio: "", gamerTags: [{ platform: "xbox", handle: "" }], streamLinks: [{ platform: "TikTok", url: "tiktok.com/no-protocol" }], catalog: [{ title: "", platform: "xbox" }] })).toEqual(expect.objectContaining({ displayName: expect.any(String), requestedSlug: expect.any(String), bio: expect.any(String), gamerTags: expect.any(String), streamLinks: expect.any(String), catalog: expect.any(String) }));
  });

  it("requires a full public URL for stream-profile verification", () => {
    expect(validateCreatorApplicationDraft({ ...validDraft, streamLinks: [{ platform: "Twitch", url: "" }] })).toHaveProperty("streamLinks");
  });
});
