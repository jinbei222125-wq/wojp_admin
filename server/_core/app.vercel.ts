/**
 * Vercel-specific Express app factory.
 * This file intentionally does NOT import ./vite to prevent vite and its plugins
 * from being bundled into the serverless function (api/server.js).
 *
 * Used only by src/api-entry/server.ts → built to api/server.js.
 * The local dev server (server/_core/index.ts) uses app.ts which imports vite.
 */
import "dotenv/config";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { adminAppRouter } from "../adminAppRouter";
import { createAdminContext } from "../adminContext";
import { getDb } from "../lib/db";

export function createApp() {
  const app = express();

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  registerOAuthRoutes(app);

  app.use(
    "/api/admin",
    createExpressMiddleware({
      router: adminAppRouter,
      createContext: ({ req, res }) => createAdminContext(req, res),
    })
  );

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  // 一時デバッグ用: DB接続先とアカウント確認
  app.get("/api/debug/db", async (_req, res) => {
    const url = process.env.DATABASE_URL ?? "(not set)";
    const token = process.env.DATABASE_AUTH_TOKEN ?? "(not set)";
    const maskedToken =
      token.length > 20 ? token.slice(0, 10) + "..." + token.slice(-10) : token;
    try {
      const db = await getDb();
      if (!db) {
        return res.json({ status: "DB null - getDb() returned null", url, token: maskedToken });
      }
      // 直接 libsql で admins を取得
      const { createClient } = await import("@libsql/client");
      const client = createClient({ url, authToken: token });
      const result = await client.execute(
        "SELECT id, email, name, isActive FROM admins;"
      );
      return res.json({
        status: "connected",
        url,
        token: maskedToken,
        admins: result.rows,
      });
    } catch (e: any) {
      return res.json({ status: "error", error: e.message, url, token: maskedToken });
    }
  });

  // On Vercel, static assets are served by CDN from public/.
  // Any non-API request that reaches this function returns a minimal 404
  // (the SPA is served by Vercel CDN, not this function).
  app.use((_req, res) => {
    res.status(404).json({ error: "Not found" });
  });

  return app;
}
