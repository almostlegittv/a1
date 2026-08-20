export type IdentityValidationStatus = "passed" | "warning" | "failed";
export type IdentityValidationResult = { status: IdentityValidationStatus; note: string };

const supportedStreamHosts: Record<string, string[]> = {
  tiktok: ["tiktok.com", "www.tiktok.com", "m.tiktok.com"],
  twitch: ["twitch.tv", "www.twitch.tv", "m.twitch.tv"],
  youtube: ["youtube.com", "www.youtube.com", "youtu.be", "m.youtube.com"],
  kick: ["kick.com", "www.kick.com"],
};

function hostMatches(host: string, allowed: string[]) { return allowed.some((candidate) => host === candidate || host.endsWith(`.${candidate}`)); }

export function validatePublicStreamLink(platform: string, rawUrl: string): IdentityValidationResult {
  const value = rawUrl.trim();
  if (!value) return { status: "failed", note: "A public profile URL is required." };
  let url: URL;
  try { url = new URL(value); } catch { return { status: "failed", note: "Use a complete public URL beginning with https://." }; }
  if (!["http:", "https:"].includes(url.protocol)) return { status: "failed", note: "Only http:// or https:// links are accepted." };
  if (url.username || url.password) return { status: "failed", note: "Do not submit URLs containing account credentials." };
  const normalizedPlatform = platform.trim().toLowerCase();
  const allowedHosts = Object.entries(supportedStreamHosts).find(([key]) => normalizedPlatform.includes(key))?.[1];
  if (!allowedHosts) return { status: "warning", note: "URL structure looks valid; an admin must manually verify this platform profile." };
  if (!hostMatches(url.hostname.toLowerCase(), allowedHosts)) return { status: "warning", note: `URL is valid, but it does not match the expected ${platform} host. Check the link manually.` };
  if (url.pathname === "/" || url.pathname.length < 2) return { status: "warning", note: "The platform host is valid, but the profile path looks incomplete." };
  return { status: "passed", note: `Valid ${platform} public profile URL format. This does not prove account ownership.` };
}

export function validateGamerTag(platform: "xbox" | "playstation", rawHandle: string): IdentityValidationResult {
  const handle = rawHandle.trim();
  if (!handle) return { status: "failed", note: "A gamer tag is required." };
  if (platform === "playstation") {
    if (!/^[A-Za-z0-9_-]{3,16}$/.test(handle)) return { status: "failed", note: "PlayStation Online IDs must use 3–16 letters, numbers, hyphens, or underscores." };
    return { status: "passed", note: "PlayStation Online ID format looks valid. An admin must still verify the public profile." };
  }
  const [base, suffix] = handle.split("#");
  if (!base || base.length > 12 || (suffix !== undefined && (!/^[A-Za-z0-9]{1,14}$/.test(suffix) || handle.length > 16))) return { status: "failed", note: "Xbox gamertags support a base name up to 12 characters, with an optional # suffix; the length or suffix format is invalid." };
  if (!/^[A-Za-z0-9 ._-]+$/.test(base)) return { status: "warning", note: "This Xbox gamertag uses characters that require manual review; the format check cannot confirm the full Unicode range." };
  return { status: "passed", note: "Xbox gamertag format looks valid. An admin must still verify the public profile." };
}
