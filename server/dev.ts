import { spawn } from "node:child_process";
import express from "express";
import { createApiRouter } from "./api";

const apiPort = Number(process.env.API_PORT || 3001);
const vite = spawn("vite", ["--host"], {
  stdio: "inherit",
  env: { ...process.env, API_PORT: String(apiPort) },
});

let apiServer: ReturnType<ReturnType<typeof express>["listen"]> | undefined;
const startApi = () => {
  const api = express();
  api.use("/api", createApiRouter());
  apiServer = api.listen(apiPort, "127.0.0.1", () => console.log(`API server running on http://127.0.0.1:${apiPort}`));
};
setTimeout(startApi, 800);

const shutdown = (code = 0) => {
  vite.kill("SIGTERM");
  if (apiServer) apiServer.close(() => process.exit(code));
  else process.exit(code);
};

vite.on("exit", (code) => shutdown(code ?? 0));
process.on("SIGINT", () => shutdown());
process.on("SIGTERM", () => shutdown());
