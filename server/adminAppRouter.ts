import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import { AdminContext } from "./adminContext";
import { adminAuthRouter } from "./adminRouter";
import { newsRouter, jobsRouter } from "./contentRouter";
import { auditRouter } from "./auditRouter";

const t = initTRPC.context<AdminContext>().create({
  transformer: superjson,
});

/**
 * 管理者用のメインルーター
 */
export const adminAppRouter = t.router({
  auth: adminAuthRouter,
  news: newsRouter,
  jobs: jobsRouter,
  audit: auditRouter,
});

export type AdminAppRouter = typeof adminAppRouter;
