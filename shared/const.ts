export const COOKIE_NAME = "almostlegit_session";
export const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;
export const OAUTH_STATE_COOKIE = "__Host-oauth_state";

export type OAuthState = { redirectUri: string; nonce?: string };

export function encodeOAuthState(state: OAuthState) {
  const bytes = new TextEncoder().encode(JSON.stringify(state));
  let binary = "";
  for (let index = 0; index < bytes.length; index += 1) binary += String.fromCharCode(bytes[index]);
  return btoa(binary);
}

export function decodeOAuthState(value: string | null | undefined): Partial<OAuthState> {
  if (!value) return {};
  try {
    const binary = atob(value);
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    const parsed = JSON.parse(new TextDecoder().decode(bytes)) as Partial<OAuthState>;
    if (typeof parsed.redirectUri !== "string") return {};
    return { redirectUri: parsed.redirectUri, nonce: typeof parsed.nonce === "string" ? parsed.nonce : undefined };
  } catch {
    return {};
  }
}
