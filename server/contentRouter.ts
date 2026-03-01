import { TRPCError, initTRPC } from "@trpc/server";
import { z } from "zod";
import superjson from "superjson";
import { AdminContext } from "./adminContext";
import {
  getAllNews,
  getNewsById,
  getNewsBySlug,
  createNews,
  updateNews,
  deleteNews,
  getAllJobs,
  getJobById,
  getJobBySlug,
  createJob,
  updateJob,
  deleteJob,
  getAllNewsCategories,
  getNewsCategoryById,
  createNewsCategory,
  updateNewsCategory,
  deleteNewsCategory,
} from "./db";
import { createAuditLog } from "./db";

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
 * 監査ログを記録するヘルパー
 */
async function logAudit(
  ctx: AdminContext,
  action: string,
  resourceType: string,
  resourceId: number | null,
  details?: string
) {
  if (!ctx.admin) return;

  await createAuditLog({
    adminId: ctx.admin.id,
    adminEmail: ctx.admin.email,
    action,
    resourceType,
    resourceId,
    details,
    ipAddress: ctx.req.ip || ctx.req.socket.remoteAddress || null,
    userAgent: ctx.req.headers["user-agent"] || null,
  });
}

/**
 * NEWS記事ルーター
 */
export const newsRouter = t.router({
  /**
   * NEWS記事一覧を取得
   */
  list: protectedProcedure.query(async () => {
    return getAllNews();
  }),

  /**
   * NEWS記事詳細を取得
   */
  getById: protectedProcedure.input(z.number()).query(async ({ input }) => {
    const article = await getNewsById(input);
    if (!article) {
      throw new TRPCError({ code: "NOT_FOUND", message: "記事が見つかりません" });
    }
    return article;
  }),

  /**
   * NEWS記事を作成
   */
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1, "タイトルは必須です").max(200, "タイトルは200文字以内で入力してください"),
        slug: z.string().min(1, "スラッグは必須です").max(100, "スラッグは100文字以内で入力してください").regex(/^[a-z0-9-]+$/, "スラッグは半角英小文字・数字・ハイフンのみ使用できます"),
        content: z.string().min(1, "本文は必須です"),
        excerpt: z.string().max(500, "抽出は500文字以内で入力してください").optional(),
        thumbnailUrl: z.string().url("有効なURLを入力してください").optional().or(z.literal("")),
        category: z.string().optional().default("お知らせ"),
        isPublished: z.boolean().default(false),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const result = await createNews({
        ...input,
        authorId: ctx.admin.id,
        publishedAt: input.isPublished ? new Date() : null,
      });

      const insertId = Number(result[0]!.id);

      await logAudit(
        ctx,
        "create_news",
        "news",
        insertId,
        JSON.stringify({ title: input.title })
      );

      return { success: true, id: insertId };
    }),

  /**
   * NEWS記事を更新
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().min(1, "タイトルは必須です").max(200, "タイトルは200文字以内で入力してください").optional(),
        slug: z.string().min(1, "スラッグは必須です").max(100, "スラッグは100文字以内で入力してください").regex(/^[a-z0-9-]+$/, "スラッグは半角英小文字・数字・ハイフンのみ使用できます").optional(),
        content: z.string().min(1, "本文は必須です").optional(),
        excerpt: z.string().max(500, "抽出は500文字以内で入力してください").optional(),
        thumbnailUrl: z.string().url("有効なURLを入力してください").optional().or(z.literal("")),
        category: z.string().optional(),
        isPublished: z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;

      const existing = await getNewsById(id);
      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "記事が見つかりません" });
      }

      const updateData: any = { ...data };
      
      // 公開ステータスが変更された場合、publishedAtを更新
      if (data.isPublished !== undefined && data.isPublished !== existing.isPublished) {
        updateData.publishedAt = data.isPublished ? new Date() : null;
      }

      await updateNews(id, updateData);

      await logAudit(
        ctx,
        "update_news",
        "news",
        id,
        JSON.stringify({ title: existing.title, changes: data })
      );

      return { success: true };
    }),

  /**
   * NEWS記事を削除
   */
  delete: protectedProcedure
    .input(z.number())
    .mutation(async ({ input, ctx }) => {
      const existing = await getNewsById(input);
      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "記事が見つかりません" });
      }

      await deleteNews(input);

      await logAudit(
        ctx,
        "delete_news",
        "news",
        input,
        JSON.stringify({ title: existing.title })
      );

      return { success: true };
    }),

  /**
   * NEWS記事のslug重複チェック
   */
  checkSlug: protectedProcedure
    .input(
      z.object({
        slug: z.string(),
        excludeId: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      if (!input.slug || !/^[a-z0-9-]+$/.test(input.slug)) {
        return { available: false, reason: "invalid" };
      }
      const existing = await getNewsBySlug(input.slug, input.excludeId);
      return { available: !existing, reason: existing ? "duplicate" : null };
    }),

  /**
   * NEWS記事の公開/非公開を切り替え
   */
  togglePublish: protectedProcedure
    .input(z.number())
    .mutation(async ({ input, ctx }) => {
      const existing = await getNewsById(input);
      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "記事が見つかりません" });
      }

      const newStatus = !existing.isPublished;
      await updateNews(input, {
        isPublished: newStatus,
        publishedAt: newStatus ? new Date() : null,
      });

      await logAudit(
        ctx,
        newStatus ? "publish_news" : "unpublish_news",
        "news",
        input,
        JSON.stringify({ title: existing.title })
      );

      return { success: true, isPublished: newStatus };
    }),
});

/**
 * 求人情報ルーター
 */
export const jobsRouter = t.router({
  /**
   * 求人情報一覧を取得
   */
  list: protectedProcedure.query(async () => {
    return getAllJobs();
  }),

  /**
   * 求人情報詳細を取得
   */
  getById: protectedProcedure.input(z.number()).query(async ({ input }) => {
    const job = await getJobById(input);
    if (!job) {
      throw new TRPCError({ code: "NOT_FOUND", message: "求人情報が見つかりません" });
    }
    return job;
  }),

  /**
   * 求人情報を作成
   */
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1, "タイトルは必須です").max(200, "タイトルは200文字以内で入力してください"),
        slug: z.string().min(1, "スラッグは必須です").max(100, "スラッグは100文字以内で入力してください").regex(/^[a-z0-9-]+$/, "スラッグは半角英小文字・数字・ハイフンのみ使用できます"),
        description: z.string().min(1, "説明は必須です"),
        requirements: z.string().optional(),
        location: z.string().max(100, "勤務地は100文字以内で入力してください").optional(),
        employmentType: z.enum(["full_time", "part_time", "contract", "internship"]),
        salaryRange: z.string().max(100, "給与は100文字以内で入力してください").optional(),
        isPublished: z.boolean().default(false),
        closingDate: z.date().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const result = await createJob({
        ...input,
        authorId: ctx.admin.id,
        publishedAt: input.isPublished ? new Date() : null,
      });

      const insertId = Number(result[0]!.id);

      await logAudit(
        ctx,
        "create_job",
        "job",
        insertId,
        JSON.stringify({ title: input.title })
      );

      return { success: true, id: insertId };
    }),

  /**
   * 求人情報を更新
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().min(1, "タイトルは必須です").max(200, "タイトルは200文字以内で入力してください").optional(),
        slug: z.string().min(1, "スラッグは必須です").max(100, "スラッグは100文字以内で入力してください").regex(/^[a-z0-9-]+$/, "スラッグは半角英小文字・数字・ハイフンのみ使用できます").optional(),
        description: z.string().min(1, "説明は必須です").optional(),
        requirements: z.string().optional(),
        location: z.string().max(100, "勤務地は100文字以内で入力してください").optional(),
        employmentType: z.enum(["full_time", "part_time", "contract", "internship"]).optional(),
        salaryRange: z.string().max(100, "給与は100文字以内で入力してください").optional(),
        isPublished: z.boolean().optional(),
        closingDate: z.date().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;

      const existing = await getJobById(id);
      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "求人情報が見つかりません" });
      }

      const updateData: any = { ...data };
      
      // 公開ステータスが変更された場合、publishedAtを更新
      if (data.isPublished !== undefined && data.isPublished !== existing.isPublished) {
        updateData.publishedAt = data.isPublished ? new Date() : null;
      }

      await updateJob(id, updateData);

      await logAudit(
        ctx,
        "update_job",
        "job",
        id,
        JSON.stringify({ title: existing.title, changes: data })
      );

      return { success: true };
    }),

  /**
   * 求人情報を削除
   */
  delete: protectedProcedure
    .input(z.number())
    .mutation(async ({ input, ctx }) => {
      const existing = await getJobById(input);
      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "求人情報が見つかりません" });
      }

      await deleteJob(input);

      await logAudit(
        ctx,
        "delete_job",
        "job",
        input,
        JSON.stringify({ title: existing.title })
      );

      return { success: true };
    }),

  /**
   * 求人情報のslug重複チェック
   */
  checkSlug: protectedProcedure
    .input(
      z.object({
        slug: z.string(),
        excludeId: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      if (!input.slug || !/^[a-z0-9-]+$/.test(input.slug)) {
        return { available: false, reason: "invalid" };
      }
      const existing = await getJobBySlug(input.slug, input.excludeId);
      return { available: !existing, reason: existing ? "duplicate" : null };
    }),

  /**
   * 求人情報の公開/非公開を切り替え
   */
  togglePublish: protectedProcedure
    .input(z.number())
    .mutation(async ({ input, ctx }) => {
      const existing = await getJobById(input);
      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "求人情報が見つかりません" });
      }

      const newStatus = !existing.isPublished;
      await updateJob(input, {
        isPublished: newStatus,
        publishedAt: newStatus ? new Date() : null,
      });

      await logAudit(
        ctx,
        newStatus ? "publish_job" : "unpublish_job",
        "job",
        input,
        JSON.stringify({ title: existing.title })
      );

      return { success: true, isPublished: newStatus };
    }),
});

// ============================================
// NEWSカテゴリルーター
// ============================================

export const categoryRouter = t.router({
  // カテゴリ一覧取得（認証不要 - NEWS作成フォームでも使用）
  list: t.procedure.query(async () => {
    return getAllNewsCategories();
  }),

  // カテゴリ作成
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, "カテゴリ名は必須です").max(50),
        slug: z.string().min(1, "スラッグは必須です").max(50).regex(/^[a-z0-9-]+$/, "スラッグは英小文字・数字・ハイフンのみ使用できます"),
        sortOrder: z.number().int().default(0),
      })
    )
    .mutation(async ({ input }) => {
      await createNewsCategory({
        name: input.name,
        slug: input.slug,
        sortOrder: input.sortOrder,
      });
      return { success: true };
    }),

  // カテゴリ更新
  update: protectedProcedure
    .input(
      z.object({
        id: z.number().int(),
        name: z.string().min(1).max(50).optional(),
        slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/).optional(),
        sortOrder: z.number().int().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const existing = await getNewsCategoryById(id);
      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "カテゴリが見つかりません" });
      }
      await updateNewsCategory(id, data);
      return { success: true };
    }),

  // カテゴリ削除
  delete: protectedProcedure
    .input(z.number().int())
    .mutation(async ({ input: id }) => {
      const existing = await getNewsCategoryById(id);
      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "カテゴリが見つかりません" });
      }
      await deleteNewsCategory(id);
      return { success: true };
    }),
});
