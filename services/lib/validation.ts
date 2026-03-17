/**
 * Zod validation schemas for API route inputs.
 *
 * Centralized input validation for critical endpoints.
 * Each API route calls `.safeParse(req.body)` at the top.
 */

import { z } from "zod";

// ──────────────────────────────────────────────
// /api/orders/create
// ──────────────────────────────────────────────
export const CreateOrderSchema = z.object({
    packageType: z.enum(["combo", "single"]),
    duration: z.number().int().positive().max(36),
    skillType: z.string().optional(),
    amount: z.number().positive(),
    originalAmount: z.number().positive().optional(),
    couponId: z.string().uuid().optional().nullable(),
    couponCode: z.string().max(50).optional().nullable(),
    discountAmount: z.number().min(0).optional().default(0),
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
    testTime: z.number().int().min(0).optional(),
    testMode: z.string().optional(),
    retake: z.boolean().optional(),
});

// ──────────────────────────────────────────────
// /api/test-flow/submit
// ──────────────────────────────────────────────
export const SubmitTestSchema = z.object({
    testId: z.string().uuid(),
    answers: z.any(),
    timeLeft: z.string().optional(),
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
