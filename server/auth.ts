import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { ENV } from "./_core/env";

const JWT_SECRET = new TextEncoder().encode(ENV.jwtSecret);
const SALT_ROUNDS = 10;

/**
 * パスワードをハッシュ化
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * パスワードを検証
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * 管理者用JWTトークンを生成
 */
export async function generateAdminToken(adminId: number, email: string): Promise<string> {
  return new SignJWT({ adminId, email, type: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

/**
 * 管理者用JWTトークンを検証
 */
export async function verifyAdminToken(token: string): Promise<{ adminId: number; email: string } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (payload.type !== "admin") {
      return null;
    }
    return {
      adminId: payload.adminId as number,
      email: payload.email as string,
    };
  } catch {
    return null;
  }
}
