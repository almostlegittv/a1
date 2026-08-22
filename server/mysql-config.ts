import type { ConnectionOptions } from "mysql2";

export function getMysqlConnectionConfig(url = process.env.DATABASE_URL): ConnectionOptions | null {
  if (!url) return null;

  const parsed = new URL(url);
  const database = decodeURIComponent(parsed.pathname.replace(/^\//, ""));
  const isTiDbCloud = parsed.hostname.endsWith(".tidbcloud.com");

  const config: ConnectionOptions = {
    host: parsed.hostname,
    port: Number(parsed.port || 3306),
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: database || undefined,
  };

  if (isTiDbCloud || parsed.searchParams.has("ssl") || parsed.searchParams.has("sslaccept")) {
    config.ssl = { minVersion: "TLSv1.2", rejectUnauthorized: true };
  }

  return config;
}
