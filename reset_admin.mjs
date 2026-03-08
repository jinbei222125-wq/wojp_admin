import { createClient } from "@libsql/client";
import bcrypt from "bcryptjs";

const client = createClient({
  url: "libsql://wojp-db-jinbei222125-wq.aws-ap-northeast-1.turso.io",
  authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NjkzMjQxMDksImlkIjoiNGIwNWQ4YzYtN2ZhOC00YjdjLTllNjItNzhmYjM3NWQ5MzVkIiwicmlkIjoiYTlmODFmYjktOGRjOC00NDgzLTk4MTEtYTVhMWYxMWM1YzI1In0.gL6CiJzZZXHJ-Ji226zRNJNK0H5J6a3XdoH5SoH0oaskGLSxPd2w7DXwIyau3pnlwhVbkZ0ch0djtmHHtlZgCQ",
});

async function main() {
  // 現在のハッシュを確認
  const before = await client.execute("SELECT id, email, passwordHash FROM admins WHERE id = 1;");
  console.log("=== 更新前 ===");
  console.log("email:", before.rows[0].email);
  console.log("passwordHash:", before.rows[0].passwordHash);

  // 新しいハッシュを生成
  const newHash = await bcrypt.hash("test", 10);
  console.log("\n=== 新しいハッシュ ===");
  console.log(newHash);

  // DB更新
  await client.execute({
    sql: "UPDATE admins SET passwordHash = ? WHERE id = 1",
    args: [newHash],
  });

  // 更新後を確認
  const after = await client.execute("SELECT id, email, passwordHash FROM admins WHERE id = 1;");
  console.log("\n=== 更新後 ===");
  console.log("email:", after.rows[0].email);
  console.log("passwordHash:", after.rows[0].passwordHash);

  // 照合テスト
  const match = await bcrypt.compare("test", after.rows[0].passwordHash);
  console.log("\n✅ 'test' パスワード照合:", match ? "一致" : "❌ 不一致");
}

main().catch(console.error);
