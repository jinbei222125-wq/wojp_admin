import "dotenv/config";
import express from "express";
import path from "path";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic } from "./vite";
import { adminAppRouter } from "../adminAppRouter";
import { createAdminContext } from "../adminContext";

/**
 * Create and return the Express application.
 * Used by both the Node server (index.ts) and Vercel serverless (server.ts).
 * On Vercel, express.static() is ignored; static assets are served from public/ by CDN.
 */
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

  // Static files: only when not on Vercel (Vercel serves public/ via CDN)
  if (!process.env.VERCEL) {
    serveStatic(app);
  } else {
    // SPA fallback: non-API routes that reach the function return index.html
    app.use((_req, res) => {
      res.sendFile(path.join(process.cwd(), "public", "index.html"));
    });
  }

  return app;
}
