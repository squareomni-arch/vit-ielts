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

import { SupabaseClient } from "@supabase/supabase-js";

// ============================================================
// Types
// ============================================================

type OrderStatus = "pending" | "completed" | "cancelled";
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
 * Generate orderId — "IELTS PREDICTION {timestamp}{random4digits}"
 * @origin pages/api/orders/create.ts L56–60
 */
function generateOrderId(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, "0");
    return `IELTS PREDICTION ${timestamp}${random}`;
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

    // Validate + update coupon nếu có
    if (params.couponId) {
        const { data: coupon, error: couponError } = await supabaseAdmin
            .from("coupons")
            .select("id, is_active, max_uses, current_uses")
            .eq("id", params.couponId)
            .single();

        if (couponError || !coupon) {
            throw new Error("Mã giảm giá không hợp lệ");
        }

        if (!coupon.is_active) {
            throw new Error("Mã giảm giá không hợp lệ");
        }

        if (coupon.max_uses && coupon.current_uses >= coupon.max_uses) {
            throw new Error("Mã giảm giá đã hết lượt sử dụng");
        }

        // Increment coupon usage
        const { error: updateError } = await supabaseAdmin
            .from("coupons")
            .update({ current_uses: (coupon.current_uses ?? 0) + 1 })
            .eq("id", params.couponId);

        if (updateError) {
            console.error("[Order Service] Error updating coupon usage:", updateError);
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
    // 1. Exact match trên order_id hoặc transfer_content
    const { data: exactMatch } = await supabaseAdmin
        .from("orders")
        .select("id, order_id, user_id, package_type, duration, skill_type, amount, original_amount, discount_amount, coupon_id, coupon_code, status, payment_method, transfer_content, affiliate_ref, created_at")
        .or(`order_id.eq.${content},transfer_content.eq.${content}`)
        .maybeSingle();

    if (exactMatch) return exactMatch;

    // 2. Partial match — normalize spaces và tìm kiếm fuzzy
    const normalizedSearch = content.replace(/\s+/g, " ").trim();

    // Tìm tất cả pending orders và check partial match
    const { data: allOrders } = await supabaseAdmin
        .from("orders")
        .select("id, order_id, user_id, package_type, duration, skill_type, amount, original_amount, discount_amount, coupon_id, coupon_code, status, payment_method, transfer_content, affiliate_ref, created_at")
        .in("status", ["pending"]);

    if (!allOrders || allOrders.length === 0) return null;

    // Fuzzy match logic (giữ nguyên từ legacy)
    const matched = allOrders.find((o) => {
        const normalizedOrderId = o.order_id.replace(/\s+/g, " ").trim();
        const normalizedTransferContent = (o.transfer_content ?? "")
            .replace(/\s+/g, " ")
            .trim();

        return (
            normalizedOrderId.includes(normalizedSearch) ||
            normalizedTransferContent.includes(normalizedSearch) ||
            normalizedSearch.includes(normalizedOrderId) ||
            normalizedSearch.includes(normalizedTransferContent)
        );
    });

    return matched ?? null;
}

/**
 * Lấy order theo order_id (text ID, không phải UUID)
 *
 * @param supabaseAdmin - Admin client
 * @param orderId - Order ID text (e.g. "IELTS PREDICTION 17691622312585779")
 * @returns Order hoặc null
 */
export async function getOrderById(
    supabaseAdmin: SupabaseClient,
    orderId: string,
) {
    const { data, error } = await supabaseAdmin
        .from("orders")
        .select("id, order_id, user_id, package_type, duration, skill_type, amount, original_amount, discount_amount, coupon_code, status, payment_method, transfer_content, affiliate_ref, created_at")
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
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await supabase
        .from("orders")
        .select("*", { count: "exact" })
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
 * Admin: lấy danh sách orders có filter
 *
 * @param supabaseAdmin - Admin client (bypass RLS)
 * @param filters - Bộ lọc (status, date range, search, pagination)
 */
export async function getOrders(
    supabaseAdmin: SupabaseClient,
    filters: OrderFilters = {},
) {
    const { status, dateFrom, dateTo, search, page = 1, pageSize = 20 } = filters;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabaseAdmin
        .from("orders")
        .select("id, order_id, user_id, package_type, duration, skill_type, amount, original_amount, discount_amount, coupon_code, status, payment_method, transfer_content, affiliate_ref, created_at", { count: "exact" })
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
        query = query.or(
            `order_id.ilike.%${search}%,transfer_content.ilike.%${search}%`,
        );
    }

    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) throw error;
    return { orders: data ?? [], total: count ?? 0 };
}
