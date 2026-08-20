import express from "express";
import { createApiRouter } from "../server/api";

const app = express();

// Vercel forwards /api/* requests to this function. Mounting the existing
// router at /api preserves the local Express paths: /api/trpc/*,
// /api/oauth/callback, and /api/auth/logout.
app.use("/api", createApiRouter());

export default app;
