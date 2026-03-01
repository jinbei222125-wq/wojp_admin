import { createClient } from "@libsql/client";

const client = createClient({
  url: "libsql://wojp-db-jinbei222125-wq.aws-ap-northeast-1.turso.io",
  authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NjkzMjQxMDksImlkIjoiNGIwNWQ4YzYtN2ZhOC00YjdjLTllNjItNzhmYjM3NWQ5MzVkIiwicmlkIjoiYTlmODFmYjktOGRjOC00NDgzLTk4MTEtYTVhMWYxMWM1YzI1In0.gL6CiJzZZXHJ-Ji226zRNJNK0H5J6a3XdoH5SoH0oaskGLSxPd2w7DXwIyau3pnlwhVbkZ0ch0djtmHHtlZgCQ",
});

async function main() {
  // まず接続情報を確認
  const tables = await client.execute("SELECT name FROM sqlite_master WHERE type='table'");
  console.log("既存テーブル:", tables.rows.map(r => r.name));

  // news_categoriesテーブルを作成
  await client.execute(`
    CREATE TABLE IF NOT EXISTS news_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      slug TEXT NOT NULL UNIQUE,
      sortOrder INTEGER NOT NULL DEFAULT 0,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    )
  `);
  console.log("news_categoriesテーブル作成完了");

  // 初期カテゴリを投入
  const now = Date.now();
  const categories = [
    { name: "お知らせ", slug: "news", sortOrder: 1 },
    { name: "重要なお知らせ", slug: "important", sortOrder: 2 },
    { name: "プレスリリース", slug: "press-release", sortOrder: 3 },
    { name: "メディア掲載", slug: "media", sortOrder: 4 },
    { name: "イベント", slug: "event", sortOrder: 5 },
  ];

  for (const cat of categories) {
    try {
      await client.execute({
        sql: "INSERT OR IGNORE INTO news_categories (name, slug, sortOrder, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)",
        args: [cat.name, cat.slug, cat.sortOrder, now, now],
      });
      console.log(`カテゴリ追加: ${cat.name}`);
    } catch (e) {
      console.log(`カテゴリ既存: ${cat.name}`);
    }
  }

  // 確認
  const result = await client.execute("SELECT * FROM news_categories ORDER BY sortOrder");
  console.log("登録済みカテゴリ:", result.rows);
}

main().catch(console.error);
