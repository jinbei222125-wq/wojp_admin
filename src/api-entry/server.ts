/**
 * Vercel Serverless Function entry point.
 *
 * vercel.json rewrites /api/:path* → /api/server?path=:path*
 * This handler reconstructs the original URL and passes it to Express.
 */
import { createApp } from "../../server/_core/app.vercel";

const app = createApp();

export default function handler(req: any, res: any) {
  // Reconstruct the original URL from the path query parameter.
  // Vercel passes the matched path segment as ?path=admin/auth.login (without leading slash).
  const pathParam = req.query?.path;
  if (pathParam) {
    const pathStr = Array.isArray(pathParam) ? pathParam.join("/") : pathParam;
    // Remove the 'path' param from the query string and rebuild req.url
    const { path: _removed, ...restQuery } = req.query;
    const queryStr = new URLSearchParams(
      Object.entries(restQuery).flatMap(([k, v]) =>
        Array.isArray(v) ? v.map(val => [k, val]) : [[k, String(v ?? "")]]
      )
    ).toString();
    req.url = `/api/${pathStr}${queryStr ? `?${queryStr}` : ""}`;
  }

  return app(req, res);
}
