/**
 * Vercel serverless entry: all /api/* requests are routed here via rewrites.
 * Built to api/server.js by build:api so api/ contains only build output (no .ts).
 *
 * vercel.json rewrites /api/:path* → /api/server?path=:path*
 * Vercel injects the matched path as req.query.path (string | string[]).
 * We reconstruct req.url so Express can route to /api/admin/*, /api/trpc/*, etc.
 */
import { createApp } from "../../server/_core/app";
import type { IncomingMessage, ServerResponse } from "http";

const app = createApp();

export default function handler(
  req: IncomingMessage & { query?: Record<string, string | string[]> },
  res: ServerResponse
) {
  // Vercel injects path segments from the rewrite rule "/api/:path*" → "?path=:path*"
  // e.g. /api/admin/auth.me  →  req.query.path = "admin/auth.me"
  const pathSegments = req.query?.path;
  const pathStr = Array.isArray(pathSegments)
    ? pathSegments.join("/")
    : typeof pathSegments === "string"
    ? pathSegments
    : "";

  // req.url looks like: /api/server?path=admin%2Fauth.me&batch=1&input=...
  // Strip the injected "path" param and rebuild as: /api/admin/auth.me?batch=1&input=...
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

  // Let Express handle the request
  (app as any)(req, res);
}
