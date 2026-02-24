import { createClient } from "@libsql/client";

const client = createClient({
  url: "libsql://wojp-db-jinbei222125-wq.aws-ap-northeast-1.turso.io",
  authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NjkzMjQxMDksImlkIjoiNGIwNWQ4YzYtN2ZhOC00YjdjLTllNjItNzhmYjM3NWQ5MzVkIiwicmlkIjoiYTlmODFmYjktOGRjOC00NDgzLTk4MTEtYTVhMWYxMWM1YzI1In0.gL6CiJzZZXHJ-Ji226zRNJNK0H5J6a3XdoH5SoH0oaskGLSxPd2w7DXwIyau3pnlwhVbkZ0ch0djtmHHtlZgCQ",
});

// 1. newsテーブルのスキーマを確認
console.log("=== news table schema ===");
const schema = await client.execute("PRAGMA table_info(news)");
console.log(JSON.stringify(schema.rows, null, 2));

// 2. 既存データを確認
console.log("\n=== existing news rows ===");
const rows = await client.execute("SELECT id, title, slug FROM news LIMIT 5");
console.log(JSON.stringify(rows.rows, null, 2));

// 3. 実際にINSERTを試みる（エラーメッセージを確認）
console.log("\n=== test INSERT ===");
try {
  const result = await client.execute({
    sql: `INSERT INTO news (title, slug, content, excerpt, thumbnailUrl, isPublished, publishedAt, authorId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: ["テスト", "test-check", "本文", null, null, 1, null, 1, Date.now(), Date.now()]
  });
  console.log("INSERT success:", result);
  
  // クリーンアップ
  await client.execute({ sql: "DELETE FROM news WHERE slug = ?", args: ["test-check"] });
  console.log("Cleanup done");
} catch (err) {
  console.error("INSERT error:", err.message);
  console.error("Full error:", err);
}

// 4. テーブル一覧も確認
console.log("\n=== all tables ===");
const tables = await client.execute("SELECT name FROM sqlite_master WHERE type='table'");
console.log(JSON.stringify(tables.rows, null, 2));
