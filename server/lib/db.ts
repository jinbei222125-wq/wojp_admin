import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import type { LibSQLDatabase } from "drizzle-orm/libsql";

let _db: LibSQLDatabase | null = null;

/**
 * データベース接続を取得（シングルトン）
 * Turso（SQLite）を使用
 */
export async function getDb(): Promise<LibSQLDatabase | null> {
  if (!_db) {
    const databaseUrl = process.env.DATABASE_URL;
    const authToken = process.env.DATABASE_AUTH_TOKEN;
    
    if (!databaseUrl) {
      console.error("[Database] DATABASE_URL is not set");
      return null;
    }
    
    // プレースホルダーチェック
    if (
      databaseUrl.includes("libsql://") && !authToken
    ) {
      console.warn(
        "[Database] TURSO_AUTH_TOKEN is not set. " +
        "Remote Turso database requires authentication token."
      );
    }
    
    try {
      const client = createClient({
        url: databaseUrl,
        authToken: authToken,
      });
      
      _db = drizzle(client);
      console.log("[Database] Connected to Turso");
    } catch (error: any) {
      console.error("[Database] Failed to connect:", error?.message || error);
      _db = null;
    }
  }
  
  return _db;
}

/**
 * データベース接続をリセット（テスト用）
 */
export function resetDb(): void {
  _db = null;
}
