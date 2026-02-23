/**
 * Vercel serverless entry: exports the Express app for Vercel.
 * Static assets are served from public/ by Vercel CDN (see vercel.json).
 */
import { createApp } from "./server/_core/app";

export default createApp();
