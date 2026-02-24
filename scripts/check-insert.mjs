import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { integer, text, sqliteTable } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

const client = createClient({
  url: "libsql://wojp-db-jinbei222125-wq.aws-ap-northeast-1.turso.io",
  authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NjkzMjQxMDksImlkIjoiNGIwNWQ4YzYtN2ZhOC00YjdjLTllNjItNzhmYjM3NWQ5MzVkIiwicmlkIjoiYTlmODFmYjktOGRjOC00NDgzLTk4MTEtYTVhMWYxMWM1YzI1In0.gL6CiJzZZXHJ-Ji226zRNJNK0H5J6a3XdoH5SoH0oaskGLSxPd2w7DXwIyau3pnlwhVbkZ0ch0djtmHHtlZgCQ",
});

// 1. RETURNING を使ったINSERTを直接テスト
console.log("=== test INSERT with RETURNING (raw SQL) ===");
try {
  const result = await client.execute({
    sql: `INSERT INTO news (title, slug, content, excerpt, thumbnailUrl, isPublished, publishedAt, authorId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
    args: ["テスト返却", "test-returning", "本文", null, null, 1, null, 1, Date.now(), Date.now()]
  });
  console.log("INSERT with RETURNING success:", result.rows);
  await client.execute({ sql: "DELETE FROM news WHERE slug = ?", args: ["test-returning"] });
} catch (err) {
  console.error("INSERT with RETURNING error:", err.message);
}

// 2. Drizzle経由でINSERTをテスト
console.log("\n=== test INSERT via Drizzle ===");
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

// 生成されるSQLを確認
const insertQuery = db.insert(news).values({
  title: "Drizzleテスト",
  slug: "test-drizzle",
  content: "本文",
  authorId: 1,
  isPublished: false,
}).returning({ id: news.id });

console.log("Generated SQL:", insertQuery.toSQL());

try {
  const result = await insertQuery;
  console.log("Drizzle INSERT success:", result);
  await client.execute({ sql: "DELETE FROM news WHERE slug = ?", args: ["test-drizzle"] });
} catch (err) {
  console.error("Drizzle INSERT error:", err.message);
  console.error("Full error:", err);
}

// 3. isPublished の型を確認（DBは "false" がデフォルト値）
console.log("\n=== isPublished default value check ===");
const schemaResult = await client.execute("PRAGMA table_info(news)");
const isPublishedCol = schemaResult.rows.find(r => r.name === "isPublished");
console.log("isPublished column:", isPublishedCol);
