/**
 * Vercel serverless entry: all /api/* requests are routed here via rewrites.
 * Exports the Express app which handles /api/admin, /api/trpc, /api/oauth, etc.
 */
import { createApp } from "../server/_core/app";

export default createApp();
