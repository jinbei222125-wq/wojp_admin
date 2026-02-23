import { TRPCError, initTRPC } from "@trpc/server";
import { z } from "zod";
import superjson from "superjson";
import { AdminContext } from "./adminContext";
import { getAllAuditLogs, getAuditLogsByAdmin } from "./db";

const t = initTRPC.context<AdminContext>().create({
  transformer: superjson,
});

/**
 * 保護されたプロシージャ（認証必須）
 */
const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.admin) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "認証が必要です" });
  }
  return next({
    ctx: {
      ...ctx,
      admin: ctx.admin,
    },
  });
});

/**
 * 監査ログルーター
 */
export const auditRouter = t.router({
  /**
   * 監査ログ一覧を取得
   */
  list: protectedProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(500).default(100),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const limit = input?.limit ?? 100;
      return getAllAuditLogs(limit);
    }),

  /**
   * 特定の管理者の監査ログを取得
   */
  getByAdmin: protectedProcedure
    .input(
      z.object({
        adminId: z.number(),
        limit: z.number().min(1).max(200).default(50),
      })
    )
    .query(async ({ input }) => {
      return getAuditLogsByAdmin(input.adminId, input.limit);
    }),
});
