import { Request, Response } from "express";
import cookie from "cookie";
import { verifyAdminToken } from "./auth";
import { getAdminById } from "./db";
import { Admin } from "../drizzle/schema";

export const ADMIN_COOKIE_NAME = "wojp_admin_session";

export type AdminContext = {
  admin: Admin | null;
  req: Request;
  res: Response;
};

/**
 * 管理者認証コンテキストを作成
 */
export async function createAdminContext(req: Request, res: Response): Promise<AdminContext> {
  const cookies = cookie.parse(req.headers.cookie || "");
  const token = cookies[ADMIN_COOKIE_NAME];

  if (!token) {
    return { admin: null, req, res };
  }

  const payload = await verifyAdminToken(token);
  if (!payload) {
    return { admin: null, req, res };
  }

  const admin = await getAdminById(payload.adminId);
  if (!admin || !admin.isActive) {
    return { admin: null, req, res };
  }

  return { admin, req, res };
}
