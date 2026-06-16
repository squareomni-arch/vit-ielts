/**
 * Distributed rate limiter using Supabase `rate_limits` table.
 *
 * Keyed on client IP address. Uses a Postgres RPC for atomic check-and-increment.
 *
 * Falls back to in-memory Map if Supabase is unavailable (graceful degradation).
 *
 * Usage:
 *   import { rateLimit } from "~lib/rate-limit";
 *
 *   export default async function handler(req, res) {
 *     if (await rateLimit(req, res, { windowMs: 60_000, max: 10 })) return;
 *     // ... handler logic
 *   }
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "~supabase/admin";

// ============================================================================
// In-memory fallback (used when Supabase RPC is unavailable)
// ============================================================================

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

const memoryStore = new Map<string, RateLimitEntry>();
let lastCleanup = Date.now();
const CLEANUP_INTERVAL = 5 * 60_000;

function memoryCleanup() {
    const now = Date.now();
    if (now - lastCleanup < CLEANUP_INTERVAL) return;
    lastCleanup = now;
    for (const [key, entry] of memoryStore) {
        if (now > entry.resetTime) memoryStore.delete(key);
    }
}

function checkMemoryRateLimit(key: string, max: number, windowMs: number): {
    allowed: boolean;
    count: number;
    retryAfterSec: number;
} {
    memoryCleanup();
    const now = Date.now();
    const entry = memoryStore.get(key);

    if (!entry || now > entry.resetTime) {
        memoryStore.set(key, { count: 1, resetTime: now + windowMs });
        return { allowed: true, count: 1, retryAfterSec: 0 };
    }

    entry.count++;

    if (entry.count > max) {
        const retryAfterSec = Math.ceil((entry.resetTime - now) / 1000);
        return { allowed: false, count: entry.count, retryAfterSec };
    }

    return { allowed: true, count: entry.count, retryAfterSec: 0 };
}

// ============================================================================
// Main rate limiter
// ============================================================================

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
 *
 * NOTE: This is now async (returns Promise<boolean>) because it calls Supabase RPC.
 * Callers should use `await rateLimit(...)` or `if (await rateLimit(...)) return;`
 */
export async function rateLimit(
    req: NextApiRequest,
    res: NextApiResponse,
    options: RateLimitOptions = {},
): Promise<boolean> {
    const { windowMs = 60_000, max = 10, keyPrefix = "" } = options;

    // Extract client IP
    const forwarded = req.headers["x-forwarded-for"];
    const ip =
        (typeof forwarded === "string" ? forwarded.split(",")[0]?.trim() : undefined) ||
        req.socket?.remoteAddress ||
        "unknown";

    const key = `${keyPrefix}:${ip}`;

    let allowed = true;
    let retryAfterSec = 0;

    try {
        // Try Supabase RPC first (distributed, works across serverless instances)
        const { data, error } = await supabaseAdmin.rpc("check_rate_limit", {
            p_key: key,
            p_max: max,
            p_window_ms: windowMs,
        });

        if (error) throw error;

        if (data && Array.isArray(data) && data.length > 0) {
            allowed = data[0].allowed;
            retryAfterSec = data[0].retry_after_sec || 0;
        } else if (data && typeof data === "object" && !Array.isArray(data)) {
            // Single row return
            allowed = (data as Record<string, unknown>).allowed as boolean;
            retryAfterSec = ((data as Record<string, unknown>).retry_after_sec as number) || 0;
        }
    } catch {
        // Fallback to in-memory rate limiting if Supabase is unavailable
        const result = checkMemoryRateLimit(key, max, windowMs);
        allowed = result.allowed;
        retryAfterSec = result.retryAfterSec;
    }

    if (!allowed) {
        res.setHeader("Retry-After", String(retryAfterSec));
        res.status(429).json({
            error: "Too many requests",
            retryAfter: retryAfterSec,
        });
        return true;
    }

    return false;
}
