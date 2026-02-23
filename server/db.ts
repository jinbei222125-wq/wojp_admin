import { eq, desc } from "drizzle-orm";
import { admins, news, jobs, auditLogs, users, InsertAdmin, InsertNews, InsertJob, InsertAuditLog, InsertUser } from "../drizzle/schema";
import { getDb } from "./lib/db";

// Re-export getDb for backward compatibility
export { getDb };

// ============================================
// 管理者関連
// ============================================

export async function getAdminByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(admins).where(eq(admins.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAdminById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(admins).where(eq(admins.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createAdmin(data: InsertAdmin) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(admins).values(data);
}

export async function updateAdminLastSignedIn(id: number) {
  const db = await getDb();
  if (!db) return;
  
  await db.update(admins).set({ lastSignedIn: new Date() }).where(eq(admins.id, id));
}

// ============================================
// NEWS記事関連
// ============================================

export async function getAllNews() {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(news).orderBy(desc(news.createdAt));
}

export async function getNewsById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(news).where(eq(news.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createNews(data: InsertNews) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(news).values(data).returning({ id: news.id });
  return result;
}

export async function updateNews(id: number, data: Partial<InsertNews>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(news).set(data).where(eq(news.id, id));
}

export async function deleteNews(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(news).where(eq(news.id, id));
}

// ============================================
// 求人情報関連
// ============================================

export async function getAllJobs() {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(jobs).orderBy(desc(jobs.createdAt));
}

export async function getJobById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createJob(data: InsertJob) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(jobs).values(data).returning({ id: jobs.id });
  return result;
}

export async function updateJob(id: number, data: Partial<InsertJob>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(jobs).set(data).where(eq(jobs.id, id));
}

export async function deleteJob(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(jobs).where(eq(jobs.id, id));
}

// ============================================
// 監査ログ関連
// ============================================

export async function createAuditLog(data: InsertAuditLog) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create audit log: database not available");
    return;
  }
  
  try {
    await db.insert(auditLogs).values(data);
  } catch (error) {
    console.error("[Database] Failed to create audit log:", error);
  }
}

export async function getAllAuditLogs(limit: number = 100) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(limit);
}

export async function getAuditLogsByAdmin(adminId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(auditLogs).where(eq(auditLogs.adminId, adminId)).orderBy(desc(auditLogs.createdAt)).limit(limit);
}

// ============================================
// Manus OAuth用（使用しないが、フレームワークとの互換性のため保持）
// ============================================

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}
