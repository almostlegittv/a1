export type CreatorApplicationPlatform = "xbox" | "playstation";
export type CreatorApplicationTag = { platform: CreatorApplicationPlatform; handle: string };
export type CreatorApplicationLink = { platform: string; url: string };
export type CreatorApplicationGame = { title: string; platform: CreatorApplicationPlatform; genre?: string; note?: string };
export type CreatorApplicationDraft = { displayName: string; requestedSlug: string; bio: string; gamerTags: CreatorApplicationTag[]; streamLinks: CreatorApplicationLink[]; catalog: CreatorApplicationGame[] };
export type CreatorApplicationErrors = Record<string, string>;

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function validateCreatorApplicationDraft(draft: CreatorApplicationDraft): CreatorApplicationErrors {
  const errors: CreatorApplicationErrors = {};
  if (draft.displayName.trim().length < 2) errors.displayName = "Use at least 2 characters for your public name.";
  if (!slugPattern.test(draft.requestedSlug.trim())) errors.requestedSlug = "Use lowercase letters, numbers, and single hyphens.";
  if (!draft.bio.trim()) errors.bio = "Add a short introduction so viewers know what to expect.";
  if (!draft.gamerTags.length || draft.gamerTags.some((tag) => !tag.handle.trim())) errors.gamerTags = "Add at least one gamer tag and complete every row.";
  if (!draft.streamLinks.length || draft.streamLinks.some((link) => !link.url.trim() || !/^https?:\/\//i.test(link.url.trim()))) errors.streamLinks = "Add at least one full public profile URL beginning with https://.";
  if (!draft.catalog.some((entry) => entry.title.trim())) errors.catalog = "Add at least one game to start your approved request catalog.";
  return errors;
}
