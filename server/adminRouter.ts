import { TRPCError, initTRPC } from "@trpc/server";
import { z } from "zod";
import superjson from "superjson";
import { AdminContext } from "./adminContext";
import { verifyPassword, generateAdminToken, hashPassword } from "./auth";
import { getAdminByEmail, updateAdminLastSignedIn, createAdmin } from "./db";
import { ADMIN_COOKIE_NAME } from "./adminContext";
import * as cookie from "cookie";
import { ENV } from "./_core/env";

const t = initTRPC.context<AdminContext>().create({
  transformer: superjson,
});

/**
 * 公開プロシージャ（認証不要）
 */
export const publicProcedure = t.procedure;

/**
 * 保護されたプロシージャ（認証必須）
 */
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
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
 * 管理者認証ルーター
 */
export const adminAuthRouter = t.router({
  /**
   * ログイン
   */
  login: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(1, "パスワードを入力してください"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      let admin;
      try {
        admin = await getAdminByEmail(input.email);
      } catch (error: any) {
        console.error("[Auth] Database error:", error);
        if (error?.message?.includes("Invalid URL") || error?.message?.includes("DATABASE_URL")) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "データベース接続エラー: DATABASE_URLが正しく設定されていません。.envファイルを確認してください。",
          });
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "データベース接続エラーが発生しました",
        });
      }

      if (!admin) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "メールアドレスまたはパスワードが正しくありません。管理者アカウントが存在しない可能性があります。",
        });
      }

      if (!admin.isActive) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "このアカウントは無効化されています",
        });
      }

      const isValid = await verifyPassword(input.password, admin.passwordHash);
      if (!isValid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "メールアドレスまたはパスワードが正しくありません",
        });
      }

      await updateAdminLastSignedIn(admin.id);

      const token = await generateAdminToken(admin.id, admin.email);

      // SameSite=Lax + Secure はフロントとAPIが同一ドメイン(Vercel)の場合に最適
      // SameSite=None は異なるドメイン間でのみ必要
      const isSecure = ENV.isProduction;
      const cookieString = [
        `${ADMIN_COOKIE_NAME}=${token}`,
        "HttpOnly",
        isSecure ? "Secure" : "",
        "SameSite=Lax",
        `Max-Age=${7 * 24 * 60 * 60}`,
        "Path=/",
      ].filter(Boolean).join("; ");
      ctx.res.setHeader("Set-Cookie", cookieString);

      return {
        success: true,
        admin: {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          role: admin.role,
        },
      };
    }),

  /**
   * ログアウト
   */
  logout: publicProcedure.mutation(({ ctx }) => {
    const isSecure = ENV.isProduction;
    const cookieString = [
      `${ADMIN_COOKIE_NAME}=`,
      "HttpOnly",
      isSecure ? "Secure" : "",
      "SameSite=Lax",
      "Max-Age=-1",
      "Path=/",
    ].filter(Boolean).join("; ");
    ctx.res.setHeader("Set-Cookie", cookieString);

    return { success: true };
  }),

  /**
   * 現在の管理者情報を取得
   */
  me: publicProcedure.query(({ ctx }) => {
    if (!ctx.admin) {
      return null;
    }

    return {
      id: ctx.admin.id,
      email: ctx.admin.email,
      name: ctx.admin.name,
      role: ctx.admin.role,
    };
  }),

  /**
   * 管理者を作成（開発用）
   * 本番環境では別の方法で管理者を作成することを推奨
   */
  createAdmin: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(1, "パスワードを入力してください"),
        name: z.string().min(1),
        role: z.enum(["admin", "super_admin"]).default("admin"),
      })
    )
    .mutation(async ({ input }) => {
      const existing = await getAdminByEmail(input.email);
      if (existing) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "このメールアドレスは既に使用されています",
        });
      }

      const passwordHash = await hashPassword(input.password);

      await createAdmin({
        email: input.email,
        passwordHash,
        name: input.name,
        role: input.role,
        isActive: true,
      });

      return { success: true };
    }),
});

export type AdminAuthRouter = typeof adminAuthRouter;
