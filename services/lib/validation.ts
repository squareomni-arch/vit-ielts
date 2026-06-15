/**
 * Zod validation schemas for API route inputs.
 *
 * Centralized input validation for critical endpoints.
 * Each API route calls `.safeParse(req.body)` at the top.
 */

import { z } from "zod";

// ──────────────────────────────────────────────
// /api/orders/create
// Server re-calculates amount — client only sends selection + coupon code
// ──────────────────────────────────────────────
export const CreateOrderSchema = z.object({
    packageType: z.enum(["combo", "single"]),
    duration: z.number().int().positive().max(36),
    skillType: z.string().optional(),
    couponCode: z.string().max(50).optional().nullable(),
});

// ──────────────────────────────────────────────
// /api/coupons/validate
// ──────────────────────────────────────────────
export const ValidateCouponSchema = z.object({
    code: z.string().min(1).max(50).trim(),
});

// ──────────────────────────────────────────────
// /api/contact/send-email
// ──────────────────────────────────────────────
export const SendEmailSchema = z.object({
    name: z.string().min(1).max(200).trim(),
    email: z.string().email().max(254),
    subject: z.string().min(1).max(500).trim(),
    message: z.string().min(1).max(5000).trim(),
});

// ──────────────────────────────────────────────
// /api/test-flow/start
// ──────────────────────────────────────────────
export const StartTestSchema = z.object({
    quizId: z.string().uuid(),
    testPart: z.array(z.number().int().min(0)).optional(),
    // -1 is the "No limit" sentinel from the practice mode picker —
    // downstream timer treats negative test_time as "no countdown".
    testTime: z.number().int().optional(),
    testMode: z.string().optional(),
    retake: z.boolean().optional(),
});

// ──────────────────────────────────────────────
// /api/test-flow/submit
// ──────────────────────────────────────────────
// In mock mode (NEXT_PUBLIC_MOCK_DB) takeTheTest returns synthetic ids like
// `mock-test-...` instead of DB UUIDs, so the id fields are relaxed to plain
// strings. Production keeps strict UUID validation.
const isMockDb = process.env.NEXT_PUBLIC_MOCK_DB === "true";
const testIdSchema = isMockDb ? z.string().min(1) : z.string().uuid();

export const SubmitTestSchema = z.object({
    testId: testIdSchema,
    answers: z.any(),
    timeLeft: z.string().optional(),
    // Optional fallback metadata so the server can salvage submissions
    // when the original draft row was pruned by the cleanup cron or
    // deleted by a concurrent retake from another tab.
    quizId: z.string().uuid().optional(),
    testPart: z.array(z.number().int().min(0)).optional(),
});

// ──────────────────────────────────────────────
// Helper: parse and return 400 on failure
// ──────────────────────────────────────────────
export function parseOrFail<T extends z.ZodTypeAny>(
    schema: T,
    data: unknown,
): { success: true; data: z.infer<T> } | { success: false; errors: z.ZodIssue[] } {
    const result = schema.safeParse(data);
    if (!result.success) {
        return { success: false, errors: result.error.issues };
    }
    return { success: true, data: result.data };
}

// ──────────────────────────────────────────────
// /api/affiliate/bank-info (PUT)
// ──────────────────────────────────────────────
export const SaveBankInfoSchema = z.object({
    affiliateId: z.string().uuid(),
    accountHolder: z.string().min(1).max(200).trim(),
    accountNumber: z.string().min(5).max(30).trim(),
    bankName: z.string().min(1).max(200).trim(),
    bankCode: z.string().max(20).optional(),
    bankBranch: z.string().max(200).optional(),
});

// ──────────────────────────────────────────────
// /api/affiliate/payouts (POST) — create payout request
// ──────────────────────────────────────────────
export const CreatePayoutSchema = z.object({
    affiliateId: z.string().uuid(),
    amount: z.number().int().positive(),
});
