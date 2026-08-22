import { defineConfig } from "drizzle-kit";
import { getMysqlConnectionConfig } from "./server/mysql-config";

const connection = getMysqlConnectionConfig();

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle/migrations",
  dialect: "mysql",
  dbCredentials: connection ?? {
    url: "mysql://placeholder:placeholder@localhost:3306/placeholder",
  },
});
