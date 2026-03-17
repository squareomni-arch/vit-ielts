/**
 * User Service Tests — calculateProExpirationDate
 *
 * Tests for Pro subscription date calculation logic.
 * 
 * @see services/user.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { calculateProExpirationDate } from "../services/user";

// ============================================================================
// calculateProExpirationDate
// ============================================================================

describe("User Service — calculateProExpirationDate()", () => {
    // Fix "now" to 2026-06-15 for deterministic tests
    const FIXED_NOW = new Date("2026-06-15T00:00:00Z");

    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(FIXED_NOW);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    // ─── New user (no current expiration) ───

    it("returns now + duration for new user (no expiration)", () => {
        const result = calculateProExpirationDate(null, 3);
        expect(result).toBe("2026-09-15");
    });

    it("returns now + duration for undefined expiration", () => {
        const result = calculateProExpirationDate(undefined, 1);
        expect(result).toBe("2026-07-15");
    });

    // ─── Active user (future expiration → stacking) ───

    it("stacks duration on top of future expiration date", () => {
        // Expires 2026-08-01, add 3 months → 2026-11-01
        const result = calculateProExpirationDate("2026-08-01", 3);
        expect(result).toBe("2026-11-01");
    });

    it("stacks duration on top of far-future expiration", () => {
        // Expires 2027-01-15, add 6 months → 2027-07-15
        const result = calculateProExpirationDate("2027-01-15", 6);
        expect(result).toBe("2027-07-15");
    });

    // ─── Expired user (past expiration → calculate from now) ───

    it("calculates from now when expiration is in the past", () => {
        // Expired 2026-01-01 (past), add 3 months from now → 2026-09-15
        const result = calculateProExpirationDate("2026-01-01", 3);
        expect(result).toBe("2026-09-15");
    });

    it("calculates from now when expiration is today (edge case)", () => {
        // Expired today (not after now), add 1 month → 2026-07-15
        const result = calculateProExpirationDate("2026-06-15", 1);
        expect(result).toBe("2026-07-15");
    });

    // ─── Legacy YYYYMMDD format ───

    it("parses YYYYMMDD legacy format (future date)", () => {
        // "20260801" → 2026-08-01 (future), add 2 months → 2026-10-01
        const result = calculateProExpirationDate("20260801", 2);
        expect(result).toBe("2026-10-01");
    });

    it("parses YYYYMMDD legacy format (past date)", () => {
        // "20250101" → 2025-01-01 (past), add 3 months from now → 2026-09-15
        const result = calculateProExpirationDate("20250101", 3);
        expect(result).toBe("2026-09-15");
    });

    // ─── Edge cases ───

    it("handles 12-month duration", () => {
        const result = calculateProExpirationDate(null, 12);
        expect(result).toBe("2027-06-15");
    });

    it("handles 1-month duration", () => {
        const result = calculateProExpirationDate(null, 1);
        expect(result).toBe("2026-07-15");
    });
});
