type OAuthIdentity = { openId?: string; open_id?: string; id?: string | number; sub?: string; name?: string; email?: string };

type OAuthTokenResponse = OAuthIdentity & {
  access_token?: string;
  id_token?: string;
  user?: OAuthIdentity;
  profile?: OAuthIdentity;
};

export async function exchangeOAuthCode(input: { code: string; state: string; redirectUri: string }) {
  const baseUrl = process.env.OAUTH_SERVER_URL?.replace(/\/+$/, "");
  const appId = process.env.VITE_APP_ID;
  if (!baseUrl || !appId) throw new Error("OAuth is not configured");

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code: input.code,
    state: input.state,
    redirect_uri: input.redirectUri,
    client_id: appId,
    app_id: appId,
  });
  const response = await fetch(`${baseUrl}/oauth/token`, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json" }, body });
  if (!response.ok) throw new Error(`OAuth token exchange failed (${response.status})`);

  const payload = (await response.json()) as OAuthTokenResponse;
  const identity = payload.user ?? payload.profile ?? payload;
  const openId = identity.openId ?? identity.open_id ?? identity.id?.toString() ?? identity.sub;
  if (!openId) throw new Error("OAuth response did not include a stable user identity");
  return { openId, name: identity.name, email: identity.email };
}
