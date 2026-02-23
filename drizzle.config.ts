import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";
import path from "path";

config({ path: path.resolve(process.cwd(), ".env") });

const url = process.env.DATABASE_URL;
const authToken = process.env.DATABASE_AUTH_TOKEN;

if (!url) throw new Error("DATABASE_URL is required to run drizzle commands");
if (!authToken)
  throw new Error("DATABASE_AUTH_TOKEN is required to run drizzle commands");

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle",
  dialect: "turso",
  dbCredentials: {
    url,
    authToken,
  },
});
