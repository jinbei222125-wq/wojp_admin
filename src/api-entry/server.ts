import type { IncomingMessage, ServerResponse } from "http";

const errors: string[] = [];
const loaded: string[] = [];

// どのimportが失敗するか特定するため段階的にテスト
async function initApp() {
  try {
    await import("express");
    loaded.push("express");
  } catch (e) { errors.push(`express: ${e}`); }

  try {
    await import("@libsql/client/web");
    loaded.push("@libsql/client/web");
  } catch (e) { errors.push(`@libsql/client/web: ${e}`); }

  try {
    await import("drizzle-orm/libsql");
    loaded.push("drizzle-orm/libsql");
  } catch (e) { errors.push(`drizzle-orm/libsql: ${e}`); }

  try {
    await import("cloudinary");
    loaded.push("cloudinary");
  } catch (e) { errors.push(`cloudinary: ${e}`); }

  try {
    await import("bcryptjs");
    loaded.push("bcryptjs");
  } catch (e) { errors.push(`bcryptjs: ${e}`); }

  try {
    await import("multer");
    loaded.push("multer");
  } catch (e) { errors.push(`multer: ${e}`); }

  try {
    await import("superjson");
    loaded.push("superjson");
  } catch (e) { errors.push(`superjson: ${e}`); }
}

const initPromise = initApp();

export default async function handler(
  _req: IncomingMessage,
  res: ServerResponse
) {
  await initPromise;
  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({ loaded, errors }, null, 2));
}
