import { describe, expect, it } from "vitest";
import { validateGamerTag, validatePublicStreamLink } from "./identityValidation";

describe("identity validation", () => {
  it("accepts supported public stream profile URLs without proving ownership", () => {
    expect(validatePublicStreamLink("TikTok", "https://www.tiktok.com/@creator")).toMatchObject({ status: "passed" });
    expect(validatePublicStreamLink("Twitch", "https://twitch.tv/creator").note).toContain("does not prove account ownership");
  });

  it("warns when an otherwise valid URL uses an unexpected host or platform", () => {
    expect(validatePublicStreamLink("TikTok", "https://example.com/creator").status).toBe("warning");
    expect(validatePublicStreamLink("Other", "https://example.com/creator").status).toBe("warning");
  });

  it("rejects credentials and malformed URLs", () => {
    expect(validatePublicStreamLink("Twitch", "https://user:password@twitch.tv/creator").status).toBe("failed");
    expect(validatePublicStreamLink("Twitch", "creator").status).toBe("failed");
  });

  it("checks conservative Xbox and PlayStation tag formats", () => {
    expect(validateGamerTag("xbox", "AlmostLegit#123").status).toBe("passed");
    expect(validateGamerTag("xbox", "bad#suffix-too-long").status).toBe("failed");
    expect(validateGamerTag("playstation", "creator_tag-1").status).toBe("passed");
    expect(validateGamerTag("playstation", "no spaces allowed").status).toBe("failed");
  });
});
