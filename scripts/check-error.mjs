import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { integer, text, sqliteTable } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

const client = createClient({
  url: "libsql://wojp-db-jinbei222125-wq.aws-ap-northeast-1.turso.io",
  authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NjkzMjQxMDksImlkIjoiNGIwNWQ4YzYtN2ZhOC00YjdjLTllNjItNzhmYjM3NWQ5MzVkIiwicmlkIjoiYTlmODFmYjktOGRjOC00NDgzLTk4MTEtYTVhMWYxMWM1YzI1In0.gL6CiJzZZXHJ-Ji226zRNJNK0H5J6a3XdoH5SoH0oaskGLSxPd2w7DXwIyau3pnlwhVbkZ0ch0djtmHHtlZgCQ",
});
const db = drizzle(client);

const news = sqliteTable("news", {
  id: integer("id").generatedAlwaysAs(sql`rowid`),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  content: text("content").notNull(),
  excerpt: text("excerpt"),
  thumbnailUrl: text("thumbnailUrl"),
  isPublished: integer("isPublished", { mode: "boolean" }).notNull().default(false),
  publishedAt: integer("publishedAt", { mode: "timestamp" }),
  authorId: integer("authorId").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// ユーザーが送信したのと同じデータで試す
const testData = {
  title: "会社設立への思い",
  slug: "test",  // ← これが既存のslugと重複している可能性！
  content: "本文テスト",
  excerpt: "会社設立への思いをお伝えします",
  thumbnailUrl: null,
  isPublished: true,
  publishedAt: new Date(1771930972 * 1000),
  authorId: 1,
};

// まず既存データを確認
console.log("=== existing slugs ===");
const existing = await client.execute("SELECT id, slug FROM news");
console.log(existing.rows);

// slugが重複しているか確認
const slugCheck = await client.execute({
  sql: "SELECT id, slug FROM news WHERE slug = ?",
  args: [testData.slug]
});
console.log(`\n=== slug '${testData.slug}' exists? ===`, slugCheck.rows);

// INSERT試行
console.log("\n=== attempting INSERT with test data ===");
const insertQuery = db.insert(news).values(testData).returning({ id: news.id });
console.log("SQL:", insertQuery.toSQL());

try {
  const result = await insertQuery;
  console.log("Success:", result);
  // クリーンアップ（testスラッグが新規作成された場合）
  if (result[0]?.id) {
    await client.execute({ sql: "DELETE FROM news WHERE id = ?", args: [result[0].id] });
    console.log("Cleaned up");
  }
} catch (err) {
  console.error("Error:", err.message);
  console.error("Error code:", err.code);
}
