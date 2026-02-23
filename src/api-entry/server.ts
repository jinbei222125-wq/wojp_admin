/**
 * Vercel serverless entry: all /api/* requests are routed here via rewrites.
 * Built to api/server.js by build:api so api/ contains only build output (no .ts).
 */
import { createApp } from "../../server/_core/app";

export default createApp();
