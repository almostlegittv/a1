import express from "express";
import { COOKIE_NAME, decodeOAuthState, OAUTH_STATE_COOKIE, ONE_YEAR_MS } from "../shared/const";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "./routers";
import { createSessionToken, getSessionUser, readCookie } from "./auth";
import { exchangeOAuthCode } from "./oauth";
import { ensureOwnerProfile, upsertUserFromOAuth } from "./db";

export function createApiRouter() {
  const router = express.Router();
  router.use(express.json());

  router.get("/oauth/callback", async (req, res) => {
    const code = typeof req.query.code === "string" ? req.query.code : undefined;
    const rawState = typeof req.query.state === "string" ? req.query.state : undefined;
    const decodedState = decodeOAuthState(rawState);
    const expectedNonce = readCookie(req.headers.cookie, OAUTH_STATE_COOKIE);
    if (!code || !rawState || !decodedState.redirectUri || !decodedState.nonce || decodedState.nonce !== expectedNonce) {
      res.status(403).send("Invalid OAuth state");
      return;
    }
    try {
      const identity = await exchangeOAuthCode({ code, state: rawState, redirectUri: decodedState.redirectUri });
      const user = await upsertUserFromOAuth(identity);
      if (!user) throw new Error("Unable to create session user");
      if (identity.openId === process.env.OWNER_OPEN_ID && user.role === "admin") await ensureOwnerProfile(user.id, identity.name ?? "AlmostLegitTV");
      const session = await createSessionToken(user.id);
      const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
      res.setHeader("Set-Cookie", [`${COOKIE_NAME}=${encodeURIComponent(session)}; Path=/; Max-Age=${Math.floor(ONE_YEAR_MS / 1000)}; HttpOnly; SameSite=Lax${secure}`, `${OAUTH_STATE_COOKIE}=; Path=/; Max-Age=0; SameSite=None; Secure`]);
      res.redirect("/");
    } catch (error) {
      console.error("OAuth callback failed", error);
      res.status(502).send("Unable to complete sign-in");
    }
  });

  router.post("/auth/logout", (_req, res) => {
    const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
    res.setHeader("Set-Cookie", `${COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${secure}`);
    res.status(204).end();
  });

  router.use("/trpc", createExpressMiddleware({ router: appRouter, createContext: async ({ req }) => ({ user: await getSessionUser(req) }) }));
  return router;
}
