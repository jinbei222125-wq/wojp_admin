import { v2 as cloudinary } from "cloudinary";
import { createClient } from "@libsql/client";
import { readFileSync } from "fs";

cloudinary.config({
  cloud_name: "dlpyeazaf",
  api_key: "778465168547239",
  api_secret: "gLZOpMWtNXfDouguuyF3eIddRdU",
});

const db = createClient({
  url: "libsql://wojp-db-jinbei222125-wq.aws-ap-northeast-1.turso.io",
  authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NjkzMjQxMDksImlkIjoiNGIwNWQ4YzYtN2ZhOC00YjdjLTllNjItNzhmYjM3NWQ5MzVkIiwicmlkIjoiYTlmODFmYjktOGRjOC00NDgzLTk4MTEtYTVhMWYxMWM1YzI1In0.gL6CiJzZZXHJ-Ji226zRNJNK0H5J6a3XdoH5SoH0oaskGLSxPd2w7DXwIyau3pnlwhVbkZ0ch0djtmHHtlZgCQ",
});

async function main() {
  // 画像をCloudinaryにアップロード
  console.log("Cloudinaryにアップロード中...");
  const imagePath = "/home/ubuntu/wojp_admin/kousien-image.png";
  const result = await cloudinary.uploader.upload(imagePath, {
    folder: "wojp_admin",
    resource_type: "image",
  });
  console.log("アップロード成功:", result.secure_url);

  // kousien記事のthumbnailUrlを更新
  await db.execute({
    sql: "UPDATE news SET thumbnailUrl = ? WHERE slug = 'kousien'",
    args: [result.secure_url],
  });
  console.log("DB更新完了: kousien記事のthumbnailUrlを更新しました");
}

main().catch(console.error);
