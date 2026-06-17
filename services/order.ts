/**
 * Order Service — CRUD operations for orders
 *
 * Thay thế:
 * - data/orders.json (readData/writeData)
 * - pages/api/orders/create.ts inline logic
 * - pages/api/webhooks/sepay.ts inline getOrders/saveOrders/getOrderByTransferContent
 *
 * @see LEGACY_CODEBASE_DOCS.md#6-orders-payment
 */

import crypto from "crypto";
import { SupabaseClient } from "@supabase/supabase-js";
import { sanitizeFilterValue } from "./lib/sanitize";
import { ORDER_COLUMNS } from "./lib/columns";

// ============================================================
// Types
// ============================================================

type OrderStatus = "pending" | "completed" | "cancelled" | "expired";
type PackageType = "combo" | "single";
type SkillType = "listening" | "reading";

type CreateOrderParams = {
    userId: string;
    packageType: PackageType;
    duration: number;
    skillType?: SkillType;
    amount: number;
    originalAmount?: number;
    couponId?: string;
    couponCode?: string;
    discountAmount?: number;
    affiliateRef?: string;
};

type OrderFilters = {
    status?: OrderStatus;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
    page?: number;
    pageSize?: number;
};

// ============================================================
// Helpers (internal)
// ============================================================

/**
 * Generate orderId — "Vit IELTS {timestamp}{random4digits}"
 * @origin pages/api/orders/create.ts L56–60
 */
function generateOrderId(): string {
    const timestamp = Date.now();
    const random = crypto.randomInt(10000)
        .toString()
        .padStart(4, "0");
    return `Vit IELTS ${timestamp}${random}`;
}

/**
 * Generate transfer content — currently same as orderId
 * @origin pages/api/orders/create.ts L62–64
 */
function generateTransferContent(orderId: string): string {
    return orderId;
}

// ============================================================
// Functions
// ============================================================

/**
 * Tạo đơn hàng mới
 *
 * - Generate orderId + transferContent
 * - Validate + increment coupon usage (nếu có)
 * - Insert vào Supabase orders table
 *
 * @param supabaseAdmin - Admin client (service_role, bypass RLS)
 * @param params - Thông tin đơn hàng
 * @returns Order row đã insert
 *
 * @origin pages/api/orders/create.ts L227–373
 */
export async function createOrder(
    supabaseAdmin: SupabaseClient,
    params: CreateOrderParams,
) {
    const orderId = generateOrderId();
    const transferContent = generateTransferContent(orderId);

    // Validate + atomically increment coupon usage (prevents race conditions)
    if (params.couponId) {
        const { data: couponResult, error: couponError } = await supabaseAdmin
            .rpc("increment_coupon_uses", { p_coupon_id: params.couponId });

        if (couponError) {
            console.error("[Order Service] Error incrementing coupon:", couponError);
            throw new Error("Mã giảm giá không hợp lệ");
        }

        // RPC returns empty array if coupon is invalid, inactive, or exhausted
        if (!couponResult || (Array.isArray(couponResult) && couponResult.length === 0)) {
            throw new Error("Mã giảm giá không hợp lệ hoặc đã hết lượt sử dụng");
        }
    }

    const { data, error } = await supabaseAdmin
        .from("orders")
        .insert({
            order_id: orderId,
            user_id: params.userId,
            package_type: params.packageType,
            duration: params.duration,
            skill_type:
                params.packageType === "single" ? params.skillType : undefined,
            amount: params.amount,
            original_amount: params.originalAmount ?? params.amount,
            discount_amount: params.discountAmount ?? 0,
            coupon_id: params.couponId ?? null,
            coupon_code: params.couponCode ?? null,
            status: "pending" as OrderStatus,
            payment_method: "Ngân hàng ACB (Ngân hàng Á Châu)",
            transfer_content: transferContent,
            affiliate_ref: params.affiliateRef ?? null,
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Tìm order theo nội dung chuyển khoản
 *
 * Logic tìm kiếm (giữ nguyên từ legacy):
 * 1. Exact match trên order_id hoặc transfer_content
 * 2. Partial match (content chứa orderId hoặc ngược lại)
 *
 * @param supabaseAdmin - Admin client (bypass RLS)
 * @param content - Nội dung chuyển khoản (từ Sepay webhook)
 * @returns Order hoặc null
 *
 * @origin pages/api/webhooks/sepay.ts L53–78
 */
export async function getOrderByTransferContent(
    supabaseAdmin: SupabaseClient,
    content: string,
) {
    // 1. Exact match on order_id or transfer_content
    const { data: exactMatch } = await supabaseAdmin
        .from("orders")
        .select(ORDER_COLUMNS)
        .or(`order_id.eq.${content},transfer_content.eq.${content}`)
        .maybeSingle();

    if (exactMatch) return exactMatch;

    // 2. Partial match — normalize and use database-side ilike
    const normalizedSearch = content.replace(/\s+/g, " ").trim();
    const sanitized = sanitizeFilterValue(normalizedSearch);

    if (!sanitized) return null;

    const { data: partialMatch } = await supabaseAdmin
        .from("orders")
        .select(ORDER_COLUMNS)
        .eq("status", "pending")
        .or(`order_id.ilike.%${sanitized}%,transfer_content.ilike.%${sanitized}%`)
        .limit(1)
        .maybeSingle();

    return partialMatch ?? null;
}

/**
 * Lấy order theo order_id (text ID, không phải UUID)
 *
 * @param supabaseAdmin - Admin client
 * @param orderId - Order ID text (e.g. "VIT IELTS 17691622312585779")
 * @returns Order hoặc null
 */
export async function getOrderById(
    supabaseAdmin: SupabaseClient,
    orderId: string,
) {
    const { data, error } = await supabaseAdmin
        .from("orders")
        .select(ORDER_COLUMNS)
        .eq("order_id", orderId)
        .maybeSingle();

    if (error) throw error;
    return data;
}

/**
 * Lấy danh sách orders của user (paginated)
 *
 * @param supabase - Supabase client (user's client, RLS-safe)
 * @param userId - UUID của user
 * @param options - Pagination options
 */
export async function getOrdersByUser(
    supabase: SupabaseClient,
    userId: string,
    { page = 1, pageSize = 10 }: { page?: number; pageSize?: number } = {},
) {
    const safePage = page;
    const safePageSize = Math.min(pageSize, 100);
    const from = (safePage - 1) * safePageSize;
    const to = from + safePageSize - 1;

    const { data, error, count } = await supabase
        .from("orders")
        .select(ORDER_COLUMNS, { count: "exact" })
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .range(from, to);

    if (error) throw error;
    return { orders: data ?? [], total: count ?? 0 };
}

/**
 * Cập nhật status của order
 *
 * @param supabaseAdmin - Admin client (bypass RLS)
 * @param orderId - Order ID text
 * @param status - Status mới
 * @returns Updated order
 */
export async function updateOrderStatus(
    supabaseAdmin: SupabaseClient,
    orderId: string,
    status: OrderStatus,
) {
    const { data, error } = await supabaseAdmin
        .from("orders")
        .update({ status })
        .eq("order_id", orderId)
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Atomically transition order status from "pending" to "completed".
 * Returns { updated: true, order } if the transition happened,
 * or { updated: false, order, currentStatus } if the order was already completed/cancelled/expired.
 *
 * Used by webhook handlers to ensure idempotent payment processing.
 * The `currentStatus` field helps the webhook differentiate between
 * "already completed" (safe) vs "expired" (needs admin review).
 *
 * @param supabaseAdmin - Admin client (bypass RLS)
 * @param orderId - Order ID text
 * @returns { updated, order, currentStatus }
 */
export async function completeOrder(
    supabaseAdmin: SupabaseClient,
    orderId: string,
) {
    const { data, error } = await supabaseAdmin
        .from("orders")
        .update({ status: "completed" as OrderStatus })
        .eq("order_id", orderId)
        .eq("status", "pending")
        .select()
        .maybeSingle();

    if (error) throw error;

    if (data !== null) {
        return {
            updated: true,
            order: data,
            currentStatus: "completed" as OrderStatus,
        };
    }

    // Transition didn't happen — fetch current status for the caller
    const { data: currentOrder } = await supabaseAdmin
        .from("orders")
        .select(ORDER_COLUMNS)
        .eq("order_id", orderId)
        .maybeSingle();

    return {
        updated: false,
        order: currentOrder,
        currentStatus: (currentOrder?.status ?? null) as OrderStatus | null,
    };
}

/**
 * Đánh dấu order đã kích hoạt PRO thành công (idempotency guard).
 *
 * Tách biệt với `status`: webhook chỉ flip cờ này SAU khi `activateProAccount`
 * chạy xong, nên nếu cấp PRO lỗi giữa chừng thì cờ vẫn `false` và lần retry
 * (SePay gửi lại webhook) sẽ cấp lại. Atomic `WHERE pro_activated = false` để
 * không bao giờ cộng dồn quyền lợi hai lần.
 *
 * @param supabaseAdmin - Admin client (bypass RLS)
 * @param orderId - Order ID text
 * @returns true nếu lần gọi này là lần đánh dấu đầu tiên
 */
export async function markProActivated(
    supabaseAdmin: SupabaseClient,
    orderId: string,
): Promise<boolean> {
    const { data, error } = await supabaseAdmin
        .from("orders")
        .update({ pro_activated: true })
        .eq("order_id", orderId)
        .eq("pro_activated", false)
        .select("order_id")
        .maybeSingle();

    if (error) throw error;
    return data !== null;
}

/**
 * Admin: lấy danh sách orders có filter
 *
 * @param supabaseAdmin - Admin client (bypass RLS)
 * @param filters - Bộ lọc (status, date range, search, pagination)
 */
export async function getOrders(
    supabaseAdmin: SupabaseClient,
    filters: OrderFilters = {},
) {
    const { status, dateFrom, dateTo, search, page = 1, pageSize: rawPageSize = 20 } = filters;
    const pageSize = Math.min(rawPageSize, 100);
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabaseAdmin
        .from("orders")
        .select(ORDER_COLUMNS, { count: "exact" })
        .order("created_at", { ascending: false });

    if (status) {
        query = query.eq("status", status);
    }

    if (dateFrom) {
        query = query.gte("created_at", dateFrom);
    }

    if (dateTo) {
        query = query.lte("created_at", dateTo);
    }

    if (search) {
        const safe = sanitizeFilterValue(search);
        query = query.or(
            `order_id.ilike.%${safe}%,transfer_content.ilike.%${safe}%`,
        );
    }

    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) throw error;
    return { orders: data ?? [], total: count ?? 0 };
}

// ============================================================
// Order Expiration & Continue-Payment Helpers
// ============================================================

/** TTL for pending orders in minutes (matching pg_cron config) */
export const ORDER_TTL_MINUTES = 60;

/**
 * Check if an order is still payable (pending + within TTL).
 *
 * @param order - Order row
 * @returns true if the order can still be paid
 */
export function isOrderPayable(order: { status: string; created_at: string }): boolean {
    if (order.status !== "pending") return false;
    const ageMs = Date.now() - new Date(order.created_at).getTime();
    return ageMs < ORDER_TTL_MINUTES * 60 * 1000;
}

/**
 * Get remaining time in seconds before an order expires.
 * Returns 0 if already expired.
 */
export function getOrderTimeRemaining(order: { status: string; created_at: string }): number {
    if (order.status !== "pending") return 0;
    const expiresAt = new Date(order.created_at).getTime() + ORDER_TTL_MINUTES * 60 * 1000;
    return Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
}

/**
 * Find an existing pending order for the same user + package params.
 * Used to prevent duplicate order creation when user re-visits checkout.
 *
 * @param supabaseAdmin - Admin client (bypass RLS)
 * @param userId - User UUID
 * @param packageType - "combo" | "single"
 * @param duration - Duration in months
 * @returns Existing pending order within TTL, or null
 */
export async function findExistingPendingOrder(
    supabaseAdmin: SupabaseClient,
    userId: string,
    packageType: string,
    duration: number,
    skillType?: SkillType,
) {
    const cutoff = new Date(Date.now() - ORDER_TTL_MINUTES * 60 * 1000).toISOString();

    let query = supabaseAdmin
        .from("orders")
        .select(ORDER_COLUMNS)
        .eq("user_id", userId)
        .eq("package_type", packageType)
        .eq("duration", duration)
        .eq("status", "pending")
        .gte("created_at", cutoff);

    // Single packages must also match skill_type — Listening and Reading
    // pending orders are distinct products and must not be deduped together.
    if (packageType === "single" && skillType) {
        query = query.eq("skill_type", skillType);
    }

    const { data } = await query
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    return data ?? null;
}

/**
 * Expire stale pending orders (called from API route or cron).
 * This is a TypeScript wrapper around the Supabase RPC.
 * Primary expiration is handled by pg_cron directly in the database.
 *
 * @param supabaseAdmin - Admin client (bypass RLS)
 * @param ttlMinutes - TTL in minutes (default: ORDER_TTL_MINUTES)
 * @returns Number of expired orders
 */
export async function expireStaleOrders(
    supabaseAdmin: SupabaseClient,
    ttlMinutes: number = ORDER_TTL_MINUTES,
) {
    const { data, error } = await supabaseAdmin
        .rpc("expire_stale_orders", { p_ttl_minutes: ttlMinutes });

    if (error) throw error;
    return data as number;
}
