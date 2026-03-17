/**
 * Coupon Service — Validate, apply, CRUD operations
 *
 * Thay thế:
 * - data/coupons.json
 * - lib/server/affiliate-data-helper.ts (readData/writeData calls)
 *
 * @see LEGACY_CODEBASE_DOCS.md (coupon logic in Orders & Payment section)
 */

import { SupabaseClient } from "@supabase/supabase-js";

// ============================================================
// Types
// ============================================================

export type CouponType = "percent" | "fixed";

export type Coupon = {
    id: string;
    code: string;
    type: CouponType | null;
    value: number;
    max_uses: number | null;
    current_uses: number;
    is_active: boolean;
    expires_at: string | null;
    created_at: string;
};

type CreateCouponParams = {
    code: string;
    type?: CouponType;
    value: number;
    maxUses?: number;
    isActive?: boolean;
    expiresAt?: string;
};

type UpdateCouponParams = {
    code?: string;
    type?: CouponType;
    value?: number;
    maxUses?: number;
    isActive?: boolean;
    expiresAt?: string | null;
};

// ============================================================
// Functions
// ============================================================

/**
 * Validate coupon code
 * Kiểm tra: code tồn tại, is_active, max_uses, expires_at
 *
 * @param supabase - Supabase client
 * @param code - Mã coupon (case-insensitive)
 * @returns { valid, coupon?, message }
 */
export async function validateCoupon(
    supabase: SupabaseClient,
    code: string,
) {
    const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .ilike("code", code)
        .eq("is_active", true)
        .maybeSingle();

    if (error) throw error;

    if (!data) {
        return {
            valid: false as const,
            coupon: null,
            message: "Mã giảm giá không hợp lệ hoặc đã hết hạn",
        };
    }

    const coupon = data as Coupon;

    // Check expiry
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
        return {
            valid: false as const,
            coupon: null,
            message: "Mã giảm giá đã hết hạn",
        };
    }

    // Check max uses
    if (coupon.max_uses !== null && coupon.current_uses >= coupon.max_uses) {
        return {
            valid: false as const,
            coupon: null,
            message: "Mã giảm giá đã hết lượt sử dụng",
        };
    }

    return {
        valid: true as const,
        coupon: {
            id: coupon.id,
            code: coupon.code,
            type: coupon.type,
            value: coupon.value,
            // Backward compatibility: discountAmount maps to value for fixed type
            discountAmount: coupon.value,
        },
        message: "Mã giảm giá hợp lệ",
    };
}

/**
 * Apply coupon (increment current_uses)
 *
 * @param supabaseAdmin - Supabase admin client (service_role)
 * @param couponId - UUID của coupon
 */
export async function useCoupon(
    supabaseAdmin: SupabaseClient,
    couponId: string,
) {
    // Atomic: validate + increment in one operation (prevents race conditions)
    const { data: result, error } = await supabaseAdmin
        .rpc("increment_coupon_uses", { p_coupon_id: couponId });

    if (error) {
        throw new Error("Mã giảm giá không hợp lệ");
    }

    // RPC returns empty array if coupon is invalid, inactive, or exhausted
    if (!result || (Array.isArray(result) && result.length === 0)) {
        throw new Error("Mã giảm giá không hợp lệ hoặc đã hết lượt sử dụng");
    }
}

/**
 * Admin: Lấy tất cả coupons
 *
 * @param supabaseAdmin - Supabase admin client (service_role)
 * @returns Mảng coupons
 */
export async function getCoupons(supabaseAdmin: SupabaseClient) {
    const { data, error } = await supabaseAdmin
        .from("coupons")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) throw error;
    return (data ?? []) as Coupon[];
}

/**
 * Admin: Tạo coupon mới
 *
 * @param supabaseAdmin - Supabase admin client (service_role)
 * @param params - Thông tin coupon
 * @returns Coupon mới
 */
export async function createCoupon(
    supabaseAdmin: SupabaseClient,
    params: CreateCouponParams,
) {
    const { data, error } = await supabaseAdmin
        .from("coupons")
        .insert({
            code: params.code.toUpperCase(),
            type: params.type ?? "fixed",
            value: params.value,
            max_uses: params.maxUses ?? null,
            is_active: params.isActive ?? true,
            expires_at: params.expiresAt ?? null,
        })
        .select()
        .single();

    if (error) throw error;
    return data as Coupon;
}

/**
 * Admin: Cập nhật coupon
 *
 * @param supabaseAdmin - Supabase admin client (service_role)
 * @param id - UUID của coupon
 * @param params - Các field cần update
 * @returns Coupon đã update
 */
export async function updateCoupon(
    supabaseAdmin: SupabaseClient,
    id: string,
    params: UpdateCouponParams,
) {
    const updateData: Record<string, unknown> = {};
    if (params.code !== undefined) updateData.code = params.code.toUpperCase();
    if (params.type !== undefined) updateData.type = params.type;
    if (params.value !== undefined) updateData.value = params.value;
    if (params.maxUses !== undefined) updateData.max_uses = params.maxUses;
    if (params.isActive !== undefined) updateData.is_active = params.isActive;
    if (params.expiresAt !== undefined) updateData.expires_at = params.expiresAt;

    const { data, error } = await supabaseAdmin
        .from("coupons")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

    if (error) throw error;
    return data as Coupon;
}

/**
 * Admin: Xóa coupon
 *
 * @param supabaseAdmin - Supabase admin client (service_role)
 * @param id - UUID của coupon
 */
export async function deleteCoupon(
    supabaseAdmin: SupabaseClient,
    id: string,
) {
    const { error } = await supabaseAdmin
        .from("coupons")
        .delete()
        .eq("id", id);

    if (error) throw error;
}
