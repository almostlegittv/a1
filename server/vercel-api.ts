import express from "express";
import { createApiRouter } from "./api";

const app = express();

// Vercel invokes this bundled handler for /api/* requests. Mounting the
// existing router at /api preserves /api/trpc/* and OAuth/logout routes.
app.use("/api", createApiRouter());

export default app;
