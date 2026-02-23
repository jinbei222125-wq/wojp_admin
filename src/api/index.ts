/**
 * Vercel serverless entry: all /api/* requests are routed here via rewrites.
 * Built to api/index.js by build:api so runtime does not need server/ on disk.
 */
import { createApp } from "../../server/_core/app";

export default createApp();
