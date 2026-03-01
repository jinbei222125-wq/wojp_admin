import { integer, text, sqliteTable } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

/**
 * 管理者ユーザーテーブル
 * メールアドレス+パスワードによる独自認証を使用
 */
export const admins = sqliteTable("admins", {
  id: integer("id").generatedAlwaysAs(sql`rowid`).notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("passwordHash").notNull(),
  name: text("name").notNull(),
  role: text("role", { enum: ["admin", "super_admin"] }).notNull().default("admin"),
  isActive: integer("isActive", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  lastSignedIn: integer("lastSignedIn", { mode: "timestamp" }),
});

export type Admin = typeof admins.$inferSelect;
export type InsertAdmin = typeof admins.$inferInsert;

/**
 * NEWSカテゴリマスターテーブル
 */
export const newsCategories = sqliteTable("news_categories", {
  id: integer("id").generatedAlwaysAs(sql`rowid`).notNull(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  color: text("color").notNull().default("#6B7280"),
  sortOrder: integer("sortOrder").notNull().default(0),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export type NewsCategory = typeof newsCategories.$inferSelect;
export type InsertNewsCategory = typeof newsCategories.$inferInsert;

/**
 * NEWS記事テーブル
 */
export const news = sqliteTable("news", {
  id: integer("id").generatedAlwaysAs(sql`rowid`).notNull(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  content: text("content").notNull(),
  excerpt: text("excerpt"),
  thumbnailUrl: text("thumbnailUrl"),
  category: text("category").default("お知らせ"),
  isPublished: integer("isPublished", { mode: "boolean" }).notNull().default(false),
  publishedAt: integer("publishedAt", { mode: "timestamp" }),
  authorId: integer("authorId").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export type News = typeof news.$inferSelect;
export type InsertNews = typeof news.$inferInsert;

/**
 * 求人情報テーブル
 */
export const jobs = sqliteTable("jobs", {
  id: integer("id").generatedAlwaysAs(sql`rowid`).notNull(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull(),
  requirements: text("requirements"),
  location: text("location"),
  employmentType: text("employmentType", { enum: ["full_time", "part_time", "contract", "internship"] }).notNull(),
  salaryRange: text("salaryRange"),
  isPublished: integer("isPublished", { mode: "boolean" }).notNull().default(false),
  publishedAt: integer("publishedAt", { mode: "timestamp" }),
  closingDate: integer("closingDate", { mode: "timestamp" }),
  authorId: integer("authorId").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export type Job = typeof jobs.$inferSelect;
export type InsertJob = typeof jobs.$inferInsert;

/**
 * 監査ログテーブル
 * 管理者の操作履歴を記録
 */
export const auditLogs = sqliteTable("audit_logs", {
  id: integer("id").generatedAlwaysAs(sql`rowid`).notNull(),
  adminId: integer("adminId").notNull(),
  adminEmail: text("adminEmail").notNull(),
  action: text("action").notNull(), // 例: "create_news", "update_job", "delete_news"
  resourceType: text("resourceType").notNull(), // 例: "news", "job", "admin"
  resourceId: integer("resourceId"),
  details: text("details"), // JSON形式で詳細情報を保存
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

/**
 * 既存のusersテーブル（Manus OAuth用）
 * このプロジェクトでは使用しないが、スキーマとして保持
 */
export const users = sqliteTable("users", {
  id: integer("id").generatedAlwaysAs(sql`rowid`).notNull(),
  openId: text("openId").notNull().unique(),
  name: text("name"),
  email: text("email"),
  loginMethod: text("loginMethod"),
  role: text("role", { enum: ["user", "admin"] }).notNull().default("user"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  lastSignedIn: integer("lastSignedIn", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
