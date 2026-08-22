import { describe, expect, it } from "vitest";
import { getMysqlConnectionConfig } from "./mysql-config";

describe("TiDB MySQL connection config", () => {
  it("converts the TiDB JSON ssl URL hint into a mysql2 TLS object", () => {
    const config = getMysqlConnectionConfig("mysql://user:pass@gateway01.us-west-2.prod.aws.tidbcloud.com:4000/test?ssl=%7B%22rejectUnauthorized%22%3Atrue%7D");
    expect(config).toMatchObject({
      host: "gateway01.us-west-2.prod.aws.tidbcloud.com",
      port: 4000,
      user: "user",
      password: "pass",
      database: "test",
      ssl: { minVersion: "TLSv1.2", rejectUnauthorized: true },
    });
  });

  it("returns no connection config when DATABASE_URL is unavailable", () => {
    expect(getMysqlConnectionConfig(undefined)).toBeNull();
  });
});
