/**
 * Simple in-memory sliding window rate limiter for Next.js API routes.
 *
 * Keyed on client IP address. Uses a Map with periodic cleanup.
 *
 * @limitation **Serverless / multi-instance**: This store is per-process.
 * On Vercel (serverless) or any horizontally-scaled deployment, each cold
 * start gets a fresh Map and concurrent function instances do NOT share
 * state. Rate limiting is therefore best-effort only in those environments.
 *
 * TODO: For production-grade rate limiting on serverless, migrate the store
 * to a distributed backend such as Upstash Redis, Vercel KV, or a
 * Supabase edge function with a `rate_limits` table.
 *
 * Usage:
 *   import { rateLimit } from "~lib/rate-limit";
 *
 *   export default async function handler(req, res) {
 *     if (rateLimit(req, res, { windowMs: 60_000, max: 10 })) return;
 *     // ... handler logic
 *   }
 */

import type { NextApiRequest, NextApiResponse } from "next";

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

const store = new Map<string, RateLimitEntry>();

// Cleanup stale entries every 5 minutes
const CLEANUP_INTERVAL = 5 * 60_000;
let lastCleanup = Date.now();

function cleanup() {
    const now = Date.now();
    if (now - lastCleanup < CLEANUP_INTERVAL) return;
    lastCleanup = now;

    for (const [key, entry] of store) {
        if (now > entry.resetTime) {
            store.delete(key);
        }
    }
}

interface RateLimitOptions {
    /** Time window in milliseconds (default: 60s) */
    windowMs?: number;
    /** Max requests per window (default: 10) */
    max?: number;
    /** Optional key prefix to separate rate limits per route */
    keyPrefix?: string;
}

/**
 * Apply rate limiting to a request.
 * Returns `true` if the request was rate-limited (response already sent).
 * Returns `false` if the request is allowed to proceed.
 */
export function rateLimit(
    req: NextApiRequest,
    res: NextApiResponse,
    options: RateLimitOptions = {},
): boolean {
    const { windowMs = 60_000, max = 10, keyPrefix = "" } = options;

    cleanup();

    // Extract client IP
    const forwarded = req.headers["x-forwarded-for"];
    const ip =
        (typeof forwarded === "string" ? forwarded.split(",")[0]?.trim() : undefined) ||
        req.socket?.remoteAddress ||
        "unknown";

    const key = `${keyPrefix}:${ip}`;
    const now = Date.now();

    const entry = store.get(key);

    if (!entry || now > entry.resetTime) {
        // New window
        store.set(key, { count: 1, resetTime: now + windowMs });
        return false;
    }

    entry.count++;

    if (entry.count > max) {
        const retryAfterSec = Math.ceil((entry.resetTime - now) / 1000);
        res.setHeader("Retry-After", String(retryAfterSec));
        res.status(429).json({
            error: "Too many requests",
            retryAfter: retryAfterSec,
        });
        return true;
    }

    return false;
}
