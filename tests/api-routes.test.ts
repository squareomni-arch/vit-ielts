/**
 * API Route Integration Tests
 *
 * Tests for critical API handlers: order creation, Sepay webhook, and upload validation.
 * These tests verify request validation, auth guards, and business logic at the handler level.
 *
 * @see pages/api/orders/create.ts
 * @see pages/api/webhooks/sepay.ts
 * @see pages/api/admin/upload-image.ts
 */

import { describe, it, expect } from "vitest";
import { CreateOrderSchema, ValidateCouponSchema, SendEmailSchema, StartTestSchema, SubmitTestSchema } from "../services/lib/validation";

// ============================================================================
// 1. Order Creation — Zod Schema Validation
// ============================================================================

describe("API /api/orders/create — Input Validation", () => {
    it("accepts valid combo order", () => {
        const result = CreateOrderSchema.safeParse({
            packageType: "combo",
            duration: 3,
        });
        expect(result.success).toBe(true);
    });

    it("accepts valid single order with skillType", () => {
        const result = CreateOrderSchema.safeParse({
            packageType: "single",
            duration: 6,
            skillType: "reading",
        });
        expect(result.success).toBe(true);
    });

    it("accepts order with couponCode", () => {
        const result = CreateOrderSchema.safeParse({
            packageType: "combo",
            duration: 3,
            couponCode: "IELTS20",
        });
        expect(result.success).toBe(true);
    });

    it("rejects missing packageType", () => {
        const result = CreateOrderSchema.safeParse({
            duration: 3,
        });
        expect(result.success).toBe(false);
    });

    it("rejects invalid packageType", () => {
        const result = CreateOrderSchema.safeParse({
            packageType: "premium",
            duration: 3,
        });
        expect(result.success).toBe(false);
    });

    it("rejects missing duration", () => {
        const result = CreateOrderSchema.safeParse({
            packageType: "combo",
        });
        expect(result.success).toBe(false);
    });

    it("rejects negative duration", () => {
        const result = CreateOrderSchema.safeParse({
            packageType: "combo",
            duration: -1,
        });
        expect(result.success).toBe(false);
    });

    it("rejects duration > 36 months", () => {
        const result = CreateOrderSchema.safeParse({
            packageType: "combo",
            duration: 37,
        });
        expect(result.success).toBe(false);
    });

    it("rejects non-integer duration", () => {
        const result = CreateOrderSchema.safeParse({
            packageType: "combo",
            duration: 3.5,
        });
        expect(result.success).toBe(false);
    });

    it("does NOT accept client-sent amount (prevents price tampering)", () => {
        const result = CreateOrderSchema.safeParse({
            packageType: "combo",
            duration: 3,
            amount: 0,              // attacker tries to set price to 0
            originalAmount: 0,      // attacker overwrites original
        });
        // Schema should parse successfully but amount/originalAmount are stripped
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data).not.toHaveProperty("amount");
            expect(result.data).not.toHaveProperty("originalAmount");
        }
    });

    it("strips unexpected fields from input", () => {
        const result = CreateOrderSchema.safeParse({
            packageType: "combo",
            duration: 3,
            userId: "attacker-id",        // should be ignored (from session)
            discountAmount: 999999,       // should be ignored (server-calculated)
        });
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data).not.toHaveProperty("userId");
            expect(result.data).not.toHaveProperty("discountAmount");
        }
    });
});

// ============================================================================
// 2. Sepay Webhook — Authorization (Apikey scheme)
// ============================================================================

describe("API /api/webhooks/sepay — Authorization", () => {
    // SePay does NOT sign the body. It sends the shared secret directly in the
    // Authorization header as `Apikey <SECRET>`. The handler compares the header
    // against `Apikey <SEPAY_WEBHOOK_SECRET>` with a timing-safe equality check.
    //
    // This mirrors `verifyApiKey()` in pages/api/webhooks/sepay.ts. The function
    // is not exported (importing the route would pull in supabaseAdmin + services),
    // so we replicate the exact algorithm here.
    const crypto = require("crypto");

    function verifyApiKey(authHeader: string, secret: string): boolean {
        const expected = `Apikey ${secret}`;
        const a = Buffer.from(authHeader, "utf8");
        const b = Buffer.from(expected, "utf8");
        if (a.length !== b.length) return false;
        return crypto.timingSafeEqual(a, b);
    }

    const SECRET = "test-secret-key";

    it("accepts the correct `Apikey <secret>` header", () => {
        expect(verifyApiKey(`Apikey ${SECRET}`, SECRET)).toBe(true);
    });

    it("rejects a wrong secret", () => {
        expect(verifyApiKey("Apikey wrong-secret", SECRET)).toBe(false);
    });

    it("rejects a missing/empty header", () => {
        expect(verifyApiKey("", SECRET)).toBe(false);
    });

    it("rejects the secret without the `Apikey ` prefix", () => {
        expect(verifyApiKey(SECRET, SECRET)).toBe(false);
    });

    it("rejects a wrong scheme keyword (e.g. Bearer)", () => {
        expect(verifyApiKey(`Bearer ${SECRET}`, SECRET)).toBe(false);
    });

    it("rejects a header that only differs by length (short-circuits before compare)", () => {
        expect(verifyApiKey(`Apikey ${SECRET}extra`, SECRET)).toBe(false);
    });

    it("is case-sensitive on the secret", () => {
        expect(verifyApiKey(`Apikey ${SECRET.toUpperCase()}`, SECRET)).toBe(false);
    });
});

// ============================================================================
// 3. Upload Image — MIME Type & Validation
// ============================================================================

describe("API /api/admin/upload-image — File Type Validation", () => {
    const ALLOWED_MIMES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

    function isAllowedMime(mimetype: string | null | undefined): boolean {
        return !!mimetype && ALLOWED_MIMES.includes(mimetype);
    }

    it("allows image/jpeg", () => {
        expect(isAllowedMime("image/jpeg")).toBe(true);
    });

    it("allows image/png", () => {
        expect(isAllowedMime("image/png")).toBe(true);
    });

    it("allows image/webp", () => {
        expect(isAllowedMime("image/webp")).toBe(true);
    });

    it("allows image/gif", () => {
        expect(isAllowedMime("image/gif")).toBe(true);
    });

    it("rejects text/html (XSS risk)", () => {
        expect(isAllowedMime("text/html")).toBe(false);
    });

    it("rejects image/svg+xml (embedded JS risk)", () => {
        expect(isAllowedMime("image/svg+xml")).toBe(false);
    });

    it("rejects application/pdf", () => {
        expect(isAllowedMime("application/pdf")).toBe(false);
    });

    it("rejects application/octet-stream", () => {
        expect(isAllowedMime("application/octet-stream")).toBe(false);
    });

    it("rejects null mimetype", () => {
        expect(isAllowedMime(null)).toBe(false);
    });

    it("rejects undefined mimetype", () => {
        expect(isAllowedMime(undefined)).toBe(false);
    });
});

// ============================================================================
// 4. Other Zod Schemas — Completeness
// ============================================================================

describe("Zod Schemas — ValidateCouponSchema", () => {
    it("accepts valid coupon code", () => {
        expect(ValidateCouponSchema.safeParse({ code: "IELTS20" }).success).toBe(true);
    });

    it("rejects empty code", () => {
        expect(ValidateCouponSchema.safeParse({ code: "" }).success).toBe(false);
    });

    it("rejects too-long code", () => {
        expect(ValidateCouponSchema.safeParse({ code: "A".repeat(51) }).success).toBe(false);
    });
});

describe("Zod Schemas — SendEmailSchema", () => {
    it("accepts valid email payload", () => {
        const result = SendEmailSchema.safeParse({
            name: "Test User",
            email: "test@example.com",
            subject: "Hello",
            message: "Test message",
        });
        expect(result.success).toBe(true);
    });

    it("rejects invalid email", () => {
        const result = SendEmailSchema.safeParse({
            name: "Test",
            email: "not-an-email",
            subject: "Hello",
            message: "Test",
        });
        expect(result.success).toBe(false);
    });

    it("rejects empty name", () => {
        const result = SendEmailSchema.safeParse({
            name: "",
            email: "test@example.com",
            subject: "Hello",
            message: "Test",
        });
        expect(result.success).toBe(false);
    });
});

describe("Zod Schemas — StartTestSchema", () => {
    it("accepts valid test start payload", () => {
        const result = StartTestSchema.safeParse({
            quizId: "550e8400-e29b-41d4-a716-446655440000",
        });
        expect(result.success).toBe(true);
    });

    it("rejects non-UUID quizId", () => {
        const result = StartTestSchema.safeParse({
            quizId: "not-a-uuid",
        });
        expect(result.success).toBe(false);
    });
});
