import { createClient } from "@libsql/client";

const client = createClient({
  url: "libsql://wojp-db-jinbei222125-wq.aws-ap-northeast-1.turso.io",
  authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NjkzMjQxMDksImlkIjoiNGIwNWQ4YzYtN2ZhOC00YjdjLTllNjItNzhmYjM3NWQ5MzVkIiwicmlkIjoiYTlmODFmYjktOGRjOC00NDgzLTk4MTEtYTVhMWYxMWM1YzI1In0.gL6CiJzZZXHJ-Ji226zRNJNK0H5J6a3XdoH5SoH0oaskGLSxPd2w7DXwIyau3pnlwhVbkZ0ch0djtmHHtlZgCQ",
});

async function main() {
  // 1. categoryカラムを追加（既に存在する場合はエラーを無視）
  try {
    await client.execute(`ALTER TABLE news ADD COLUMN category TEXT DEFAULT 'お知らせ'`);
    console.log("✅ categoryカラムを追加しました");
  } catch (err) {
    if (err.message && err.message.includes("duplicate column")) {
      console.log("ℹ️  categoryカラムは既に存在します");
    } else {
      console.log("⚠️  ALTER TABLE:", err.message);
    }
  }

  // 2. 既存記事のcategoryをデフォルト値「お知らせ」に更新
  const result = await client.execute(
    `UPDATE news SET category = 'お知らせ' WHERE category IS NULL OR category = ''`
  );
  console.log(`✅ ${result.rowsAffected}件の記事のcategoryを「お知らせ」に更新しました`);

  // 3. 確認
  const rows = await client.execute(`SELECT id, title, category FROM news ORDER BY id`);
  console.log("\n📋 更新後のnewsテーブル:");
  rows.rows.forEach(row => {
    console.log(`  ID:${row.id} category:'${row.category}' title:'${row.title}'`);
  });
}

main().catch(console.error);
