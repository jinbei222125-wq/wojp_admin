import { createClient } from "@libsql/client";

const client = createClient({
  url: "libsql://wojp-db-jinbei222125-wq.aws-ap-northeast-1.turso.io",
  authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NjkzMjQxMDksImlkIjoiNGIwNWQ4YzYtN2ZhOC00YjdjLTllNjItNzhmYjM3NWQ5MzVkIiwicmlkIjoiYTlmODFmYjktOGRjOC00NDgzLTk4MTEtYTVhMWYxMWM1YzI1In0.gL6CiJzZZXHJ-Ji226zRNJNK0H5J6a3XdoH5SoH0oaskGLSxPd2w7DXwIyau3pnlwhVbkZ0ch0djtmHHtlZgCQ",
});

async function main() {
  console.log("=== テーブル一覧 ===");
  const tables = await client.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;");
  console.log(tables.rows.map(r => r.name).join(", ") || "テーブルなし");

  console.log("\n=== admins テーブル確認 ===");
  try {
    const admins = await client.execute("SELECT id, email, name, role, isActive FROM admins;");
    if (admins.rows.length === 0) {
      console.log("❌ admins テーブルは存在しますが、レコードが0件です（管理者アカウントがありません）");
    } else {
      console.log(`✅ ${admins.rows.length}件の管理者アカウントが存在します:`);
      admins.rows.forEach(r => {
        console.log(`  - id:${r.id} | email:${r.email} | name:${r.name} | role:${r.role} | isActive:${r.isActive}`);
      });
    }
  } catch (e) {
    console.log("❌ admins テーブルが存在しません:", e.message);
  }
}

main().catch(console.error);
