/**
 * Coupon Service Tests
 *
 * Tests for coupon validation, CRUD operations, and edge cases.
 *
 * @see services/coupon.ts
 */

import { describe, it, expect, vi } from "vitest";
import { createMockSupabase } from "./fixtures/supabase-mock";
import {
    validateCoupon,
    getCoupons,
    createCoupon,
} from "../services/coupon";

// ============================================================================
// Fixtures
// ============================================================================

const activeCoupon = {
    id: "coupon-001",
    code: "SAVE50",
    type: "fixed",
    value: 50000,
    max_uses: 100,
    current_uses: 5,
    is_active: true,
    expires_at: null,
    created_at: "2024-01-01T00:00:00Z",
};

const expiredCoupon = {
    ...activeCoupon,
    id: "coupon-002",
    code: "EXPIRED",
    expires_at: "2020-01-01T00:00:00Z", // in the past
};

const exhaustedCoupon = {
    ...activeCoupon,
    id: "coupon-003",
    code: "FULL",
    max_uses: 10,
    current_uses: 10, // no more uses
};

const inactiveCoupon = {
    ...activeCoupon,
    id: "coupon-004",
    code: "INACTIVE",
    is_active: false,
};

// ============================================================================
// validateCoupon
// ============================================================================

describe("Coupon Service — validateCoupon()", () => {
    it("returns valid for active coupon with remaining uses", async () => {
        const supabase = createMockSupabase({
            coupons: [activeCoupon],
        });

        const result = await validateCoupon(supabase as any, "SAVE50");

        expect(result.valid).toBe(true);
        expect(result.coupon).not.toBeNull();
        expect(result.coupon?.code).toBe("SAVE50");
    });

    it("returns invalid for non-existent coupon", async () => {
        const supabase = createMockSupabase({
            coupons: [],
        });

        const result = await validateCoupon(supabase as any, "NONE");

        expect(result.valid).toBe(false);
        expect(result.coupon).toBeNull();
    });

    it("returns invalid for expired coupon", async () => {
        const supabase = createMockSupabase({
            coupons: [expiredCoupon],
        });

        const result = await validateCoupon(supabase as any, "EXPIRED");

        expect(result.valid).toBe(false);
        expect(result.message).toContain("hết hạn");
    });

    it("returns invalid for exhausted coupon", async () => {
        const supabase = createMockSupabase({
            coupons: [exhaustedCoupon],
        });

        const result = await validateCoupon(supabase as any, "FULL");

        expect(result.valid).toBe(false);
        expect(result.message).toContain("hết lượt");
    });

    it("filters out inactive coupons via .eq filter", async () => {
        const supabase = createMockSupabase({
            coupons: [inactiveCoupon],
        });

        // The .eq("is_active", true) filter should exclude this
        const result = await validateCoupon(supabase as any, "INACTIVE");

        expect(result.valid).toBe(false);
    });
});

// ============================================================================
// getCoupons
// ============================================================================

describe("Coupon Service — getCoupons()", () => {
    it("returns all coupons", async () => {
        const supabase = createMockSupabase({
            coupons: [activeCoupon, expiredCoupon],
        });

        const result = await getCoupons(supabase as any);

        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBe(2);
    });

    it("returns empty array when no coupons exist", async () => {
        const supabase = createMockSupabase({
            coupons: [],
        });

        const result = await getCoupons(supabase as any);
        expect(result).toEqual([]);
    });
});

// ============================================================================
// createCoupon
// ============================================================================

describe("Coupon Service — createCoupon()", () => {
    it("inserts coupon with correct fields", async () => {
        const supabase = createMockSupabase({});

        try {
            await createCoupon(supabase as any, {
                code: "NEW20",
                value: 20000,
                type: "fixed",
                maxUses: 50,
            });
        } catch {
            // Expected due to mock limitations
        }

        const inserts = supabase._tracking.insertedRows["coupons"];
        expect(inserts).toBeDefined();
        expect(inserts[0]).toHaveProperty("code", "NEW20");
        expect(inserts[0]).toHaveProperty("value", 20000);
        expect(inserts[0]).toHaveProperty("max_uses", 50);
    });
});
