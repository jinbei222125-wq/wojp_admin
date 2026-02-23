// server/_core/app.ts
import "dotenv/config";
import express2 from "express";
import path3 from "path";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// shared/const.ts
var COOKIE_NAME = "app_session_id";
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
var AXIOS_TIMEOUT_MS = 3e4;
var UNAUTHED_ERR_MSG = "Please login (10001)";
var NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";

// server/db.ts
import { eq, desc } from "drizzle-orm";

// drizzle/schema.ts
import { integer, text, sqliteTable } from "drizzle-orm/sqlite-core";
var admins = sqliteTable("admins", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  passwordHash: text("passwordHash").notNull(),
  name: text("name").notNull(),
  role: text("role", { enum: ["admin", "super_admin"] }).notNull().default("admin"),
  isActive: integer("isActive", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date()),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date()),
  lastSignedIn: integer("lastSignedIn", { mode: "timestamp" })
});
var news = sqliteTable("news", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  content: text("content").notNull(),
  excerpt: text("excerpt"),
  thumbnailUrl: text("thumbnailUrl"),
  isPublished: integer("isPublished", { mode: "boolean" }).notNull().default(false),
  publishedAt: integer("publishedAt", { mode: "timestamp" }),
  authorId: integer("authorId").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date()),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date())
});
var jobs = sqliteTable("jobs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull(),
  requirements: text("requirements"),
  location: text("location"),
  employmentType: text("employmentType", { enum: ["full_time", "part_time", "contract", "internship"] }).notNull(),
  salaryRange: text("salaryRange"),
  isPublished: integer("isPublished", { mode: "boolean" }).notNull().default(false),
  publishedAt: integer("publishedAt", { mode: "timestamp" }),
  closingDate: integer("closingDate", { mode: "timestamp" }),
  authorId: integer("authorId").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date()),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date())
});
var auditLogs = sqliteTable("audit_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  adminId: integer("adminId").notNull(),
  adminEmail: text("adminEmail").notNull(),
  action: text("action").notNull(),
  // 例: "create_news", "update_job", "delete_news"
  resourceType: text("resourceType").notNull(),
  // 例: "news", "job", "admin"
  resourceId: integer("resourceId"),
  details: text("details"),
  // JSON形式で詳細情報を保存
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date())
});
var users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  openId: text("openId").notNull().unique(),
  name: text("name"),
  email: text("email"),
  loginMethod: text("loginMethod"),
  role: text("role", { enum: ["user", "admin"] }).notNull().default("user"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date()),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date()),
  lastSignedIn: integer("lastSignedIn", { mode: "timestamp" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date())
});

// server/lib/db.ts
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
var _db = null;
async function getDb() {
  if (!_db) {
    const databaseUrl = process.env.DATABASE_URL;
    const authToken = process.env.DATABASE_AUTH_TOKEN;
    if (!databaseUrl) {
      console.error("[Database] DATABASE_URL is not set");
      return null;
    }
    if (databaseUrl.includes("libsql://") && !authToken) {
      console.warn(
        "[Database] TURSO_AUTH_TOKEN is not set. Remote Turso database requires authentication token."
      );
    }
    try {
      const client = createClient({
        url: databaseUrl,
        authToken
      });
      _db = drizzle(client);
      console.log("[Database] Connected to Turso");
    } catch (error) {
      console.error("[Database] Failed to connect:", error?.message || error);
      _db = null;
    }
  }
  return _db;
}

// server/db.ts
async function getAdminByEmail(email) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(admins).where(eq(admins.email, email)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function getAdminById(id) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(admins).where(eq(admins.id, id)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function createAdmin(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(admins).values(data);
}
async function updateAdminLastSignedIn(id) {
  const db = await getDb();
  if (!db) return;
  await db.update(admins).set({ lastSignedIn: /* @__PURE__ */ new Date() }).where(eq(admins.id, id));
}
async function getAllNews() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(news).orderBy(desc(news.createdAt));
}
async function getNewsById(id) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(news).where(eq(news.id, id)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function createNews(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(news).values(data).returning({ id: news.id });
  return result;
}
async function updateNews(id, data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(news).set(data).where(eq(news.id, id));
}
async function deleteNews(id) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(news).where(eq(news.id, id));
}
async function getAllJobs() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(jobs).orderBy(desc(jobs.createdAt));
}
async function getJobById(id) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function createJob(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(jobs).values(data).returning({ id: jobs.id });
  return result;
}
async function updateJob(id, data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(jobs).set(data).where(eq(jobs.id, id));
}
async function deleteJob(id) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(jobs).where(eq(jobs.id, id));
}
async function createAuditLog(data) {
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
async function getAllAuditLogs(limit = 100) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(limit);
}
async function getAuditLogsByAdmin(adminId, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(auditLogs).where(eq(auditLogs.adminId, adminId)).orderBy(desc(auditLogs.createdAt)).limit(limit);
}
async function upsertUser(user) {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  try {
    const values = {
      openId: user.openId
    };
    const updateSet = {};
    const textFields = ["name", "email", "loginMethod"];
    const assignNullable = (field) => {
      const value = user[field];
      if (value === void 0) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== void 0) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== void 0) {
      values.role = user.role;
      updateSet.role = user.role;
    }
    if (!values.lastSignedIn) {
      values.lastSignedIn = /* @__PURE__ */ new Date();
    }
    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = /* @__PURE__ */ new Date();
    }
    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}
async function getUserByOpenId(openId) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return void 0;
  }
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}

// server/_core/cookies.ts
function isSecureRequest(req) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getSessionCookieOptions(req) {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: isSecureRequest(req)
  };
}

// shared/_core/errors.ts
var HttpError = class extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = "HttpError";
  }
};
var ForbiddenError = (msg) => new HttpError(403, msg);

// server/_core/sdk.ts
import axios from "axios";
import { parse as parseCookieHeader } from "cookie";
import { SignJWT, jwtVerify } from "jose";

// server/_core/env.ts
var ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  jwtSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? ""
};

// server/_core/sdk.ts
var isNonEmptyString = (value) => typeof value === "string" && value.length > 0;
var EXCHANGE_TOKEN_PATH = `/webdev.v1.WebDevAuthPublicService/ExchangeToken`;
var GET_USER_INFO_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfo`;
var GET_USER_INFO_WITH_JWT_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfoWithJwt`;
var OAuthService = class {
  constructor(client) {
    this.client = client;
    console.log("[OAuth] Initialized with baseURL:", ENV.oAuthServerUrl);
    if (!ENV.oAuthServerUrl) {
      console.error(
        "[OAuth] ERROR: OAUTH_SERVER_URL is not configured! Set OAUTH_SERVER_URL environment variable."
      );
    }
  }
  decodeState(state) {
    const redirectUri = atob(state);
    return redirectUri;
  }
  async getTokenByCode(code, state) {
    const payload = {
      clientId: ENV.appId,
      grantType: "authorization_code",
      code,
      redirectUri: this.decodeState(state)
    };
    const { data } = await this.client.post(
      EXCHANGE_TOKEN_PATH,
      payload
    );
    return data;
  }
  async getUserInfoByToken(token) {
    const { data } = await this.client.post(
      GET_USER_INFO_PATH,
      {
        accessToken: token.accessToken
      }
    );
    return data;
  }
};
var createOAuthHttpClient = () => axios.create({
  baseURL: ENV.oAuthServerUrl,
  timeout: AXIOS_TIMEOUT_MS
});
var SDKServer = class {
  client;
  oauthService;
  constructor(client = createOAuthHttpClient()) {
    this.client = client;
    this.oauthService = new OAuthService(this.client);
  }
  deriveLoginMethod(platforms, fallback) {
    if (fallback && fallback.length > 0) return fallback;
    if (!Array.isArray(platforms) || platforms.length === 0) return null;
    const set = new Set(
      platforms.filter((p) => typeof p === "string")
    );
    if (set.has("REGISTERED_PLATFORM_EMAIL")) return "email";
    if (set.has("REGISTERED_PLATFORM_GOOGLE")) return "google";
    if (set.has("REGISTERED_PLATFORM_APPLE")) return "apple";
    if (set.has("REGISTERED_PLATFORM_MICROSOFT") || set.has("REGISTERED_PLATFORM_AZURE"))
      return "microsoft";
    if (set.has("REGISTERED_PLATFORM_GITHUB")) return "github";
    const first = Array.from(set)[0];
    return first ? first.toLowerCase() : null;
  }
  /**
   * Exchange OAuth authorization code for access token
   * @example
   * const tokenResponse = await sdk.exchangeCodeForToken(code, state);
   */
  async exchangeCodeForToken(code, state) {
    return this.oauthService.getTokenByCode(code, state);
  }
  /**
   * Get user information using access token
   * @example
   * const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
   */
  async getUserInfo(accessToken) {
    const data = await this.oauthService.getUserInfoByToken({
      accessToken
    });
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  parseCookies(cookieHeader) {
    if (!cookieHeader) {
      return /* @__PURE__ */ new Map();
    }
    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }
  getSessionSecret() {
    const secret = ENV.cookieSecret;
    return new TextEncoder().encode(secret);
  }
  /**
   * Create a session token for a Manus user openId
   * @example
   * const sessionToken = await sdk.createSessionToken(userInfo.openId);
   */
  async createSessionToken(openId, options = {}) {
    return this.signSession(
      {
        openId,
        appId: ENV.appId,
        name: options.name || ""
      },
      options
    );
  }
  async signSession(payload, options = {}) {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1e3);
    const secretKey = this.getSessionSecret();
    return new SignJWT({
      openId: payload.openId,
      appId: payload.appId,
      name: payload.name
    }).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setExpirationTime(expirationSeconds).sign(secretKey);
  }
  async verifySession(cookieValue) {
    if (!cookieValue) {
      console.warn("[Auth] Missing session cookie");
      return null;
    }
    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"]
      });
      const { openId, appId, name } = payload;
      if (!isNonEmptyString(openId) || !isNonEmptyString(appId) || !isNonEmptyString(name)) {
        console.warn("[Auth] Session payload missing required fields");
        return null;
      }
      return {
        openId,
        appId,
        name
      };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }
  async getUserInfoWithJwt(jwtToken) {
    const payload = {
      jwtToken,
      projectId: ENV.appId
    };
    const { data } = await this.client.post(
      GET_USER_INFO_WITH_JWT_PATH,
      payload
    );
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  async authenticateRequest(req) {
    const cookies = this.parseCookies(req.headers.cookie);
    const sessionCookie = cookies.get(COOKIE_NAME);
    const session = await this.verifySession(sessionCookie);
    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }
    const sessionUserId = session.openId;
    const signedInAt = /* @__PURE__ */ new Date();
    let user = await getUserByOpenId(sessionUserId);
    if (!user) {
      try {
        const userInfo = await this.getUserInfoWithJwt(sessionCookie ?? "");
        await upsertUser({
          openId: userInfo.openId,
          name: userInfo.name || null,
          email: userInfo.email ?? null,
          loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
          lastSignedIn: signedInAt
        });
        user = await getUserByOpenId(userInfo.openId);
      } catch (error) {
        console.error("[Auth] Failed to sync user from OAuth:", error);
        throw ForbiddenError("Failed to sync user info");
      }
    }
    if (!user) {
      throw ForbiddenError("User not found");
    }
    await upsertUser({
      openId: user.openId,
      lastSignedIn: signedInAt
    });
    return user;
  }
};
var sdk = new SDKServer();

// server/_core/oauth.ts
function getQueryParam(req, key) {
  const value = req.query[key];
  return typeof value === "string" ? value : void 0;
}
function registerOAuthRoutes(app2) {
  app2.get("/api/oauth/callback", async (req, res) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }
    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }
      await upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: /* @__PURE__ */ new Date()
      });
      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}

// server/_core/systemRouter.ts
import { z } from "zod";

// server/_core/notification.ts
import { TRPCError } from "@trpc/server";
var TITLE_MAX_LENGTH = 1200;
var CONTENT_MAX_LENGTH = 2e4;
var trimValue = (value) => value.trim();
var isNonEmptyString2 = (value) => typeof value === "string" && value.trim().length > 0;
var buildEndpointUrl = (baseUrl) => {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(
    "webdevtoken.v1.WebDevService/SendNotification",
    normalizedBase
  ).toString();
};
var validatePayload = (input) => {
  if (!isNonEmptyString2(input.title)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required."
    });
  }
  if (!isNonEmptyString2(input.content)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required."
    });
  }
  const title = trimValue(input.title);
  const content = trimValue(input.content);
  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`
    });
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`
    });
  }
  return { title, content };
};
async function notifyOwner(payload) {
  const { title, content } = validatePayload(payload);
  if (!ENV.forgeApiUrl) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service URL is not configured."
    });
  }
  if (!ENV.forgeApiKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service API key is not configured."
    });
  }
  const endpoint = buildEndpointUrl(ENV.forgeApiUrl);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1"
      },
      body: JSON.stringify({ title, content })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Notification] Failed to notify owner (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
      );
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notification] Error calling notification service:", error);
    return false;
  }
}

// server/_core/trpc.ts
import { initTRPC, TRPCError as TRPCError2 } from "@trpc/server";
import superjson from "superjson";
var t = initTRPC.context().create({
  transformer: superjson
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError2({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});
var protectedProcedure = t.procedure.use(requireUser);
var adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError2({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    });
  })
);

// server/_core/systemRouter.ts
var systemRouter = router({
  health: publicProcedure.input(
    z.object({
      timestamp: z.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  })),
  notifyOwner: adminProcedure.input(
    z.object({
      title: z.string().min(1, "title is required"),
      content: z.string().min(1, "content is required")
    })
  ).mutation(async ({ input }) => {
    const delivered = await notifyOwner(input);
    return {
      success: delivered
    };
  })
});

// server/routers.ts
var appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true
      };
    })
  })
});

// server/_core/context.ts
async function createContext(opts) {
  let user = null;
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    user = null;
  }
  return {
    req: opts.req,
    res: opts.res,
    user
  };
}

// server/_core/vite.ts
import express from "express";
import fs from "fs";
import { nanoid } from "nanoid";
import path2 from "path";
import { createServer as createViteServer } from "vite";

// vite.config.ts
import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";
import { vitePluginManusRuntime } from "vite-plugin-manus-runtime";
var plugins = [react(), tailwindcss(), jsxLocPlugin(), vitePluginManusRuntime()];
var vite_config_default = defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    host: true,
    allowedHosts: [
      ".manuspre.computer",
      ".manus.computer",
      ".manus-asia.computer",
      ".manuscomputer.ai",
      ".manusvm.computer",
      "localhost",
      "127.0.0.1"
    ],
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/_core/vite.ts
function serveStatic(app2) {
  const distPath = process.env.NODE_ENV === "development" ? path2.resolve(import.meta.dirname, "../..", "dist", "public") : path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/adminAppRouter.ts
import { initTRPC as initTRPC5 } from "@trpc/server";
import superjson5 from "superjson";

// server/adminRouter.ts
import { TRPCError as TRPCError3, initTRPC as initTRPC2 } from "@trpc/server";
import { z as z2 } from "zod";
import superjson2 from "superjson";

// server/auth.ts
import bcrypt from "bcryptjs";
import { SignJWT as SignJWT2, jwtVerify as jwtVerify2 } from "jose";
var JWT_SECRET = new TextEncoder().encode(ENV.jwtSecret);
var SALT_ROUNDS = 10;
async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}
async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}
async function generateAdminToken(adminId, email) {
  return new SignJWT2({ adminId, email, type: "admin" }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("7d").sign(JWT_SECRET);
}
async function verifyAdminToken(token) {
  try {
    const { payload } = await jwtVerify2(token, JWT_SECRET);
    if (payload.type !== "admin") {
      return null;
    }
    return {
      adminId: payload.adminId,
      email: payload.email
    };
  } catch {
    return null;
  }
}

// server/adminContext.ts
import cookie from "cookie";
var ADMIN_COOKIE_NAME = "wojp_admin_session";
async function createAdminContext(req, res) {
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

// server/adminRouter.ts
var t2 = initTRPC2.context().create({
  transformer: superjson2
});
var publicProcedure2 = t2.procedure;
var protectedProcedure2 = t2.procedure.use(({ ctx, next }) => {
  if (!ctx.admin) {
    throw new TRPCError3({ code: "UNAUTHORIZED", message: "\u8A8D\u8A3C\u304C\u5FC5\u8981\u3067\u3059" });
  }
  return next({
    ctx: {
      ...ctx,
      admin: ctx.admin
    }
  });
});
var adminAuthRouter = t2.router({
  /**
   * ログイン
   */
  login: publicProcedure2.input(
    z2.object({
      email: z2.string().email(),
      password: z2.string().min(6)
    })
  ).mutation(async ({ input, ctx }) => {
    let admin;
    try {
      admin = await getAdminByEmail(input.email);
    } catch (error) {
      console.error("[Auth] Database error:", error);
      if (error?.message?.includes("Invalid URL") || error?.message?.includes("DATABASE_URL")) {
        throw new TRPCError3({
          code: "INTERNAL_SERVER_ERROR",
          message: "\u30C7\u30FC\u30BF\u30D9\u30FC\u30B9\u63A5\u7D9A\u30A8\u30E9\u30FC: DATABASE_URL\u304C\u6B63\u3057\u304F\u8A2D\u5B9A\u3055\u308C\u3066\u3044\u307E\u305B\u3093\u3002.env\u30D5\u30A1\u30A4\u30EB\u3092\u78BA\u8A8D\u3057\u3066\u304F\u3060\u3055\u3044\u3002"
        });
      }
      throw new TRPCError3({
        code: "INTERNAL_SERVER_ERROR",
        message: "\u30C7\u30FC\u30BF\u30D9\u30FC\u30B9\u63A5\u7D9A\u30A8\u30E9\u30FC\u304C\u767A\u751F\u3057\u307E\u3057\u305F"
      });
    }
    if (!admin) {
      throw new TRPCError3({
        code: "UNAUTHORIZED",
        message: "\u30E1\u30FC\u30EB\u30A2\u30C9\u30EC\u30B9\u307E\u305F\u306F\u30D1\u30B9\u30EF\u30FC\u30C9\u304C\u6B63\u3057\u304F\u3042\u308A\u307E\u305B\u3093\u3002\u7BA1\u7406\u8005\u30A2\u30AB\u30A6\u30F3\u30C8\u304C\u5B58\u5728\u3057\u306A\u3044\u53EF\u80FD\u6027\u304C\u3042\u308A\u307E\u3059\u3002"
      });
    }
    if (!admin.isActive) {
      throw new TRPCError3({
        code: "UNAUTHORIZED",
        message: "\u3053\u306E\u30A2\u30AB\u30A6\u30F3\u30C8\u306F\u7121\u52B9\u5316\u3055\u308C\u3066\u3044\u307E\u3059"
      });
    }
    const isValid = await verifyPassword(input.password, admin.passwordHash);
    if (!isValid) {
      throw new TRPCError3({
        code: "UNAUTHORIZED",
        message: "\u30E1\u30FC\u30EB\u30A2\u30C9\u30EC\u30B9\u307E\u305F\u306F\u30D1\u30B9\u30EF\u30FC\u30C9\u304C\u6B63\u3057\u304F\u3042\u308A\u307E\u305B\u3093"
      });
    }
    await updateAdminLastSignedIn(admin.id);
    const token = await generateAdminToken(admin.id, admin.email);
    const cookieOptions = {
      httpOnly: true,
      secure: !ENV.isProduction ? false : true,
      sameSite: !ENV.isProduction ? "lax" : "none",
      maxAge: 7 * 24 * 60 * 60,
      // 7日
      path: "/"
    };
    const cookieString = `${ADMIN_COOKIE_NAME}=${token}; HttpOnly; ${cookieOptions.secure ? "Secure;" : ""} SameSite=${cookieOptions.sameSite}; Max-Age=${cookieOptions.maxAge}; Path=${cookieOptions.path}`;
    ctx.res.setHeader("Set-Cookie", cookieString);
    return {
      success: true,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role
      }
    };
  }),
  /**
   * ログアウト
   */
  logout: publicProcedure2.mutation(({ ctx }) => {
    const cookieOptions = {
      httpOnly: true,
      secure: !ENV.isProduction ? false : true,
      sameSite: !ENV.isProduction ? "lax" : "none",
      maxAge: -1,
      path: "/"
    };
    const cookieString = `${ADMIN_COOKIE_NAME}=; HttpOnly; ${cookieOptions.secure ? "Secure;" : ""} SameSite=${cookieOptions.sameSite}; Max-Age=${cookieOptions.maxAge}; Path=${cookieOptions.path}`;
    ctx.res.setHeader("Set-Cookie", cookieString);
    return { success: true };
  }),
  /**
   * 現在の管理者情報を取得
   */
  me: publicProcedure2.query(({ ctx }) => {
    if (!ctx.admin) {
      return null;
    }
    return {
      id: ctx.admin.id,
      email: ctx.admin.email,
      name: ctx.admin.name,
      role: ctx.admin.role
    };
  }),
  /**
   * 管理者を作成（開発用）
   * 本番環境では別の方法で管理者を作成することを推奨
   */
  createAdmin: publicProcedure2.input(
    z2.object({
      email: z2.string().email(),
      password: z2.string().min(6),
      name: z2.string().min(1),
      role: z2.enum(["admin", "super_admin"]).default("admin")
    })
  ).mutation(async ({ input }) => {
    const existing = await getAdminByEmail(input.email);
    if (existing) {
      throw new TRPCError3({
        code: "BAD_REQUEST",
        message: "\u3053\u306E\u30E1\u30FC\u30EB\u30A2\u30C9\u30EC\u30B9\u306F\u65E2\u306B\u4F7F\u7528\u3055\u308C\u3066\u3044\u307E\u3059"
      });
    }
    const passwordHash = await hashPassword(input.password);
    await createAdmin({
      email: input.email,
      passwordHash,
      name: input.name,
      role: input.role,
      isActive: true
    });
    return { success: true };
  })
});

// server/contentRouter.ts
import { TRPCError as TRPCError4, initTRPC as initTRPC3 } from "@trpc/server";
import { z as z3 } from "zod";
import superjson3 from "superjson";
var t3 = initTRPC3.context().create({
  transformer: superjson3
});
var protectedProcedure3 = t3.procedure.use(({ ctx, next }) => {
  if (!ctx.admin) {
    throw new TRPCError4({ code: "UNAUTHORIZED", message: "\u8A8D\u8A3C\u304C\u5FC5\u8981\u3067\u3059" });
  }
  return next({
    ctx: {
      ...ctx,
      admin: ctx.admin
    }
  });
});
async function logAudit(ctx, action, resourceType, resourceId, details) {
  if (!ctx.admin) return;
  await createAuditLog({
    adminId: ctx.admin.id,
    adminEmail: ctx.admin.email,
    action,
    resourceType,
    resourceId,
    details,
    ipAddress: ctx.req.ip || ctx.req.socket.remoteAddress || null,
    userAgent: ctx.req.headers["user-agent"] || null
  });
}
var newsRouter = t3.router({
  /**
   * NEWS記事一覧を取得
   */
  list: protectedProcedure3.query(async () => {
    return getAllNews();
  }),
  /**
   * NEWS記事詳細を取得
   */
  getById: protectedProcedure3.input(z3.number()).query(async ({ input }) => {
    const article = await getNewsById(input);
    if (!article) {
      throw new TRPCError4({ code: "NOT_FOUND", message: "\u8A18\u4E8B\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093" });
    }
    return article;
  }),
  /**
   * NEWS記事を作成
   */
  create: protectedProcedure3.input(
    z3.object({
      title: z3.string().min(1, "\u30BF\u30A4\u30C8\u30EB\u306F\u5FC5\u9808\u3067\u3059").max(200, "\u30BF\u30A4\u30C8\u30EB\u306F200\u6587\u5B57\u4EE5\u5185\u3067\u5165\u529B\u3057\u3066\u304F\u3060\u3055\u3044"),
      slug: z3.string().min(1, "\u30B9\u30E9\u30C3\u30B0\u306F\u5FC5\u9808\u3067\u3059").max(100, "\u30B9\u30E9\u30C3\u30B0\u306F100\u6587\u5B57\u4EE5\u5185\u3067\u5165\u529B\u3057\u3066\u304F\u3060\u3055\u3044").regex(/^[a-z0-9-]+$/, "\u30B9\u30E9\u30C3\u30B0\u306F\u534A\u89D2\u82F1\u5C0F\u6587\u5B57\u30FB\u6570\u5B57\u30FB\u30CF\u30A4\u30D5\u30F3\u306E\u307F\u4F7F\u7528\u3067\u304D\u307E\u3059"),
      content: z3.string().min(1, "\u672C\u6587\u306F\u5FC5\u9808\u3067\u3059"),
      excerpt: z3.string().max(500, "\u62BD\u51FA\u306F500\u6587\u5B57\u4EE5\u5185\u3067\u5165\u529B\u3057\u3066\u304F\u3060\u3055\u3044").optional(),
      thumbnailUrl: z3.string().url("\u6709\u52B9\u306AURL\u3092\u5165\u529B\u3057\u3066\u304F\u3060\u3055\u3044").optional().or(z3.literal("")),
      isPublished: z3.boolean().default(false)
    })
  ).mutation(async ({ input, ctx }) => {
    const result = await createNews({
      ...input,
      authorId: ctx.admin.id,
      publishedAt: input.isPublished ? /* @__PURE__ */ new Date() : null
    });
    const insertId = Number(result[0].id);
    await logAudit(
      ctx,
      "create_news",
      "news",
      insertId,
      JSON.stringify({ title: input.title })
    );
    return { success: true, id: insertId };
  }),
  /**
   * NEWS記事を更新
   */
  update: protectedProcedure3.input(
    z3.object({
      id: z3.number(),
      title: z3.string().min(1, "\u30BF\u30A4\u30C8\u30EB\u306F\u5FC5\u9808\u3067\u3059").max(200, "\u30BF\u30A4\u30C8\u30EB\u306F200\u6587\u5B57\u4EE5\u5185\u3067\u5165\u529B\u3057\u3066\u304F\u3060\u3055\u3044").optional(),
      slug: z3.string().min(1, "\u30B9\u30E9\u30C3\u30B0\u306F\u5FC5\u9808\u3067\u3059").max(100, "\u30B9\u30E9\u30C3\u30B0\u306F100\u6587\u5B57\u4EE5\u5185\u3067\u5165\u529B\u3057\u3066\u304F\u3060\u3055\u3044").regex(/^[a-z0-9-]+$/, "\u30B9\u30E9\u30C3\u30B0\u306F\u534A\u89D2\u82F1\u5C0F\u6587\u5B57\u30FB\u6570\u5B57\u30FB\u30CF\u30A4\u30D5\u30F3\u306E\u307F\u4F7F\u7528\u3067\u304D\u307E\u3059").optional(),
      content: z3.string().min(1, "\u672C\u6587\u306F\u5FC5\u9808\u3067\u3059").optional(),
      excerpt: z3.string().max(500, "\u62BD\u51FA\u306F500\u6587\u5B57\u4EE5\u5185\u3067\u5165\u529B\u3057\u3066\u304F\u3060\u3055\u3044").optional(),
      thumbnailUrl: z3.string().url("\u6709\u52B9\u306AURL\u3092\u5165\u529B\u3057\u3066\u304F\u3060\u3055\u3044").optional().or(z3.literal("")),
      isPublished: z3.boolean().optional()
    })
  ).mutation(async ({ input, ctx }) => {
    const { id, ...data } = input;
    const existing = await getNewsById(id);
    if (!existing) {
      throw new TRPCError4({ code: "NOT_FOUND", message: "\u8A18\u4E8B\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093" });
    }
    const updateData = { ...data };
    if (data.isPublished !== void 0 && data.isPublished !== existing.isPublished) {
      updateData.publishedAt = data.isPublished ? /* @__PURE__ */ new Date() : null;
    }
    await updateNews(id, updateData);
    await logAudit(
      ctx,
      "update_news",
      "news",
      id,
      JSON.stringify({ title: existing.title, changes: data })
    );
    return { success: true };
  }),
  /**
   * NEWS記事を削除
   */
  delete: protectedProcedure3.input(z3.number()).mutation(async ({ input, ctx }) => {
    const existing = await getNewsById(input);
    if (!existing) {
      throw new TRPCError4({ code: "NOT_FOUND", message: "\u8A18\u4E8B\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093" });
    }
    await deleteNews(input);
    await logAudit(
      ctx,
      "delete_news",
      "news",
      input,
      JSON.stringify({ title: existing.title })
    );
    return { success: true };
  }),
  /**
   * NEWS記事の公開/非公開を切り替え
   */
  togglePublish: protectedProcedure3.input(z3.number()).mutation(async ({ input, ctx }) => {
    const existing = await getNewsById(input);
    if (!existing) {
      throw new TRPCError4({ code: "NOT_FOUND", message: "\u8A18\u4E8B\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093" });
    }
    const newStatus = !existing.isPublished;
    await updateNews(input, {
      isPublished: newStatus,
      publishedAt: newStatus ? /* @__PURE__ */ new Date() : null
    });
    await logAudit(
      ctx,
      newStatus ? "publish_news" : "unpublish_news",
      "news",
      input,
      JSON.stringify({ title: existing.title })
    );
    return { success: true, isPublished: newStatus };
  })
});
var jobsRouter = t3.router({
  /**
   * 求人情報一覧を取得
   */
  list: protectedProcedure3.query(async () => {
    return getAllJobs();
  }),
  /**
   * 求人情報詳細を取得
   */
  getById: protectedProcedure3.input(z3.number()).query(async ({ input }) => {
    const job = await getJobById(input);
    if (!job) {
      throw new TRPCError4({ code: "NOT_FOUND", message: "\u6C42\u4EBA\u60C5\u5831\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093" });
    }
    return job;
  }),
  /**
   * 求人情報を作成
   */
  create: protectedProcedure3.input(
    z3.object({
      title: z3.string().min(1, "\u30BF\u30A4\u30C8\u30EB\u306F\u5FC5\u9808\u3067\u3059").max(200, "\u30BF\u30A4\u30C8\u30EB\u306F200\u6587\u5B57\u4EE5\u5185\u3067\u5165\u529B\u3057\u3066\u304F\u3060\u3055\u3044"),
      slug: z3.string().min(1, "\u30B9\u30E9\u30C3\u30B0\u306F\u5FC5\u9808\u3067\u3059").max(100, "\u30B9\u30E9\u30C3\u30B0\u306F100\u6587\u5B57\u4EE5\u5185\u3067\u5165\u529B\u3057\u3066\u304F\u3060\u3055\u3044").regex(/^[a-z0-9-]+$/, "\u30B9\u30E9\u30C3\u30B0\u306F\u534A\u89D2\u82F1\u5C0F\u6587\u5B57\u30FB\u6570\u5B57\u30FB\u30CF\u30A4\u30D5\u30F3\u306E\u307F\u4F7F\u7528\u3067\u304D\u307E\u3059"),
      description: z3.string().min(1, "\u8AAC\u660E\u306F\u5FC5\u9808\u3067\u3059"),
      requirements: z3.string().optional(),
      location: z3.string().max(100, "\u52E4\u52D9\u5730\u306F100\u6587\u5B57\u4EE5\u5185\u3067\u5165\u529B\u3057\u3066\u304F\u3060\u3055\u3044").optional(),
      employmentType: z3.enum(["full_time", "part_time", "contract", "internship"]),
      salaryRange: z3.string().max(100, "\u7D66\u4E0E\u306F100\u6587\u5B57\u4EE5\u5185\u3067\u5165\u529B\u3057\u3066\u304F\u3060\u3055\u3044").optional(),
      isPublished: z3.boolean().default(false),
      closingDate: z3.date().optional()
    })
  ).mutation(async ({ input, ctx }) => {
    const result = await createJob({
      ...input,
      authorId: ctx.admin.id,
      publishedAt: input.isPublished ? /* @__PURE__ */ new Date() : null
    });
    const insertId = Number(result[0].id);
    await logAudit(
      ctx,
      "create_job",
      "job",
      insertId,
      JSON.stringify({ title: input.title })
    );
    return { success: true, id: insertId };
  }),
  /**
   * 求人情報を更新
   */
  update: protectedProcedure3.input(
    z3.object({
      id: z3.number(),
      title: z3.string().min(1, "\u30BF\u30A4\u30C8\u30EB\u306F\u5FC5\u9808\u3067\u3059").max(200, "\u30BF\u30A4\u30C8\u30EB\u306F200\u6587\u5B57\u4EE5\u5185\u3067\u5165\u529B\u3057\u3066\u304F\u3060\u3055\u3044").optional(),
      slug: z3.string().min(1, "\u30B9\u30E9\u30C3\u30B0\u306F\u5FC5\u9808\u3067\u3059").max(100, "\u30B9\u30E9\u30C3\u30B0\u306F100\u6587\u5B57\u4EE5\u5185\u3067\u5165\u529B\u3057\u3066\u304F\u3060\u3055\u3044").regex(/^[a-z0-9-]+$/, "\u30B9\u30E9\u30C3\u30B0\u306F\u534A\u89D2\u82F1\u5C0F\u6587\u5B57\u30FB\u6570\u5B57\u30FB\u30CF\u30A4\u30D5\u30F3\u306E\u307F\u4F7F\u7528\u3067\u304D\u307E\u3059").optional(),
      description: z3.string().min(1, "\u8AAC\u660E\u306F\u5FC5\u9808\u3067\u3059").optional(),
      requirements: z3.string().optional(),
      location: z3.string().max(100, "\u52E4\u52D9\u5730\u306F100\u6587\u5B57\u4EE5\u5185\u3067\u5165\u529B\u3057\u3066\u304F\u3060\u3055\u3044").optional(),
      employmentType: z3.enum(["full_time", "part_time", "contract", "internship"]).optional(),
      salaryRange: z3.string().max(100, "\u7D66\u4E0E\u306F100\u6587\u5B57\u4EE5\u5185\u3067\u5165\u529B\u3057\u3066\u304F\u3060\u3055\u3044").optional(),
      isPublished: z3.boolean().optional(),
      closingDate: z3.date().optional()
    })
  ).mutation(async ({ input, ctx }) => {
    const { id, ...data } = input;
    const existing = await getJobById(id);
    if (!existing) {
      throw new TRPCError4({ code: "NOT_FOUND", message: "\u6C42\u4EBA\u60C5\u5831\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093" });
    }
    const updateData = { ...data };
    if (data.isPublished !== void 0 && data.isPublished !== existing.isPublished) {
      updateData.publishedAt = data.isPublished ? /* @__PURE__ */ new Date() : null;
    }
    await updateJob(id, updateData);
    await logAudit(
      ctx,
      "update_job",
      "job",
      id,
      JSON.stringify({ title: existing.title, changes: data })
    );
    return { success: true };
  }),
  /**
   * 求人情報を削除
   */
  delete: protectedProcedure3.input(z3.number()).mutation(async ({ input, ctx }) => {
    const existing = await getJobById(input);
    if (!existing) {
      throw new TRPCError4({ code: "NOT_FOUND", message: "\u6C42\u4EBA\u60C5\u5831\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093" });
    }
    await deleteJob(input);
    await logAudit(
      ctx,
      "delete_job",
      "job",
      input,
      JSON.stringify({ title: existing.title })
    );
    return { success: true };
  }),
  /**
   * 求人情報の公開/非公開を切り替え
   */
  togglePublish: protectedProcedure3.input(z3.number()).mutation(async ({ input, ctx }) => {
    const existing = await getJobById(input);
    if (!existing) {
      throw new TRPCError4({ code: "NOT_FOUND", message: "\u6C42\u4EBA\u60C5\u5831\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093" });
    }
    const newStatus = !existing.isPublished;
    await updateJob(input, {
      isPublished: newStatus,
      publishedAt: newStatus ? /* @__PURE__ */ new Date() : null
    });
    await logAudit(
      ctx,
      newStatus ? "publish_job" : "unpublish_job",
      "job",
      input,
      JSON.stringify({ title: existing.title })
    );
    return { success: true, isPublished: newStatus };
  })
});

// server/auditRouter.ts
import { TRPCError as TRPCError5, initTRPC as initTRPC4 } from "@trpc/server";
import { z as z4 } from "zod";
import superjson4 from "superjson";
var t4 = initTRPC4.context().create({
  transformer: superjson4
});
var protectedProcedure4 = t4.procedure.use(({ ctx, next }) => {
  if (!ctx.admin) {
    throw new TRPCError5({ code: "UNAUTHORIZED", message: "\u8A8D\u8A3C\u304C\u5FC5\u8981\u3067\u3059" });
  }
  return next({
    ctx: {
      ...ctx,
      admin: ctx.admin
    }
  });
});
var auditRouter = t4.router({
  /**
   * 監査ログ一覧を取得
   */
  list: protectedProcedure4.input(
    z4.object({
      limit: z4.number().min(1).max(500).default(100)
    }).optional()
  ).query(async ({ input }) => {
    const limit = input?.limit ?? 100;
    return getAllAuditLogs(limit);
  }),
  /**
   * 特定の管理者の監査ログを取得
   */
  getByAdmin: protectedProcedure4.input(
    z4.object({
      adminId: z4.number(),
      limit: z4.number().min(1).max(200).default(50)
    })
  ).query(async ({ input }) => {
    return getAuditLogsByAdmin(input.adminId, input.limit);
  })
});

// server/adminAppRouter.ts
var t5 = initTRPC5.context().create({
  transformer: superjson5
});
var adminAppRouter = t5.router({
  auth: adminAuthRouter,
  news: newsRouter,
  jobs: jobsRouter,
  audit: auditRouter
});

// server/_core/app.ts
function createApp() {
  const app2 = express2();
  app2.use(express2.json({ limit: "50mb" }));
  app2.use(express2.urlencoded({ limit: "50mb", extended: true }));
  registerOAuthRoutes(app2);
  app2.use(
    "/api/admin",
    createExpressMiddleware({
      router: adminAppRouter,
      createContext: ({ req, res }) => createAdminContext(req, res)
    })
  );
  app2.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext
    })
  );
  if (!process.env.VERCEL) {
    serveStatic(app2);
  } else {
    app2.use((_req, res) => {
      res.sendFile(path3.join(process.cwd(), "public", "index.html"));
    });
  }
  return app2;
}

// src/api-entry/server.ts
var app = createApp();
function handler(req, res) {
  const pathSegments = req.query?.path;
  const pathStr = Array.isArray(pathSegments) ? pathSegments.join("/") : typeof pathSegments === "string" ? pathSegments : "";
  const rawUrl = req.url ?? "";
  const qIdx = rawUrl.indexOf("?");
  if (qIdx !== -1) {
    const params = new URLSearchParams(rawUrl.slice(qIdx + 1));
    params.delete("path");
    const remaining = params.toString();
    req.url = `/api/${pathStr}${remaining ? "?" + remaining : ""}`;
  } else {
    req.url = `/api/${pathStr}`;
  }
  app(req, res);
}
export {
  handler as default
};
