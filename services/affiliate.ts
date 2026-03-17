/**
 * Affiliate Service — Affiliate registration, links, visits, commissions, stats
 *
 * Thay thế:
 * - data/affiliates.json, affiliate-links.json, affiliate-visits.json, affiliate-commissions.json
 * - lib/server/affiliate-data-helper.ts (readData/writeData calls)
 *
 * @see LEGACY_CODEBASE_DOCS.md#7-affiliate-system
 */

import { SupabaseClient } from "@supabase/supabase-js";
import { AFFILIATE_COLUMNS, AFFILIATE_LINK_COLUMNS, AFFILIATE_VISIT_COLUMNS, COMMISSION_COLUMNS } from "./lib/columns";

// ============================================================
// Types
// ============================================================

type AffiliateStatus = "pending" | "active" | "rejected";

type Affiliate = {
    id: string;
    user_id: string;
    custom_link: string | null;
    status: AffiliateStatus;
    commission_rate: number;
    created_at: string;
};

type AffiliateLink = {
    id: string;
    affiliate_id: string;
    custom_link: string;
    created_at: string;
};

type AffiliateVisit = {
    id: string;
    affiliate_id: string;
    link_id: string;
    ip: string | null;
    user_agent: string | null;
    converted: boolean;
    order_id: string | null;
    created_at: string;
};

type Commission = {
    id: string;
    affiliate_id: string;
    order_id: string;
    amount: number;
    commission_rate: number;
    commission_amount: number;
    status: string;
    created_at: string;
};

type CreateCommissionParams = {
    affiliateId: string;
    orderId: string;
    amount: number;
    commissionRate?: number;
};

type AffiliateStats = {
    totalBalance: number;
    totalCommissions: number;
    totalVisits: number;
    totalConversions: number;
    conversionRate: number;
    pendingCommissions: number;
    paidCommissions: number;
};

// Default commission rate: 20%
const DEFAULT_COMMISSION_RATE = 0.2;

// ============================================================
// Functions
// ============================================================

/**
 * Đăng ký affiliate mới hoặc trả về affiliate đã tồn tại
 *
 * @param supabaseAdmin - Supabase admin client (service_role)
 * @param userId - UUID của user
 * @param email - Email (lưu trên users table, không cần ở đây)
 * @param name - Name (lưu trên users table, không cần ở đây)
 * @param customLink - Custom link (optional)
 * @returns Affiliate record + message
 */
export async function registerAffiliate(
    supabaseAdmin: SupabaseClient,
    userId: string,
    customLink?: string,
) {
    // Check if affiliate already exists
    const { data: existing, error: fetchError } = await supabaseAdmin
        .from("affiliates")
        .select(AFFILIATE_COLUMNS)
        .eq("user_id", userId)
        .maybeSingle();

    if (fetchError) throw fetchError;

    if (existing) {
        return {
            affiliate: existing as Affiliate,
            isNew: false,
        };
    }

    // Create new affiliate
    const { data, error } = await supabaseAdmin
        .from("affiliates")
        .insert({
            user_id: userId,
            custom_link: customLink || null,
            status: "pending",
            commission_rate: DEFAULT_COMMISSION_RATE,
        })
        .select()
        .single();

    if (error) throw error;

    return {
        affiliate: data as Affiliate,
        isNew: true,
    };
}

/**
 * Lấy affiliate info theo user_id
 *
 * @param supabase - Supabase client
 * @param userId - UUID của user
 * @returns Affiliate record hoặc null
 */
export async function getAffiliateByUserId(
    supabase: SupabaseClient,
    userId: string,
) {
    const { data, error } = await supabase
        .from("affiliates")
        .select(AFFILIATE_COLUMNS)
        .eq("user_id", userId)
        .maybeSingle();

    if (error) throw error;
    return data as Affiliate | null;
}

/**
 * Lấy danh sách affiliate links theo affiliate_id
 *
 * @param supabase - Supabase client
 * @param affiliateId - UUID của affiliate
 * @returns Mảng affiliate links
 */
export async function getAffiliateLinks(
    supabase: SupabaseClient,
    affiliateId: string,
) {
    const { data, error } = await supabase
        .from("affiliate_links")
        .select(AFFILIATE_LINK_COLUMNS)
        .eq("affiliate_id", affiliateId)
        .order("created_at", { ascending: false });

    if (error) throw error;
    return (data ?? []) as AffiliateLink[];
}

/**
 * Tạo affiliate link mới
 * Kiểm tra trùng customLink trước khi tạo
 *
 * @param supabaseAdmin - Supabase admin client (service_role)
 * @param affiliateId - UUID của affiliate
 * @param customLink - Custom link string
 * @returns AffiliateLink mới hoặc link đã tồn tại
 */
export async function createAffiliateLink(
    supabaseAdmin: SupabaseClient,
    affiliateId: string,
    customLink: string,
) {
    // Check if link with same customLink already exists for this affiliate
    const { data: existing, error: fetchError } = await supabaseAdmin
        .from("affiliate_links")
        .select(AFFILIATE_LINK_COLUMNS)
        .eq("affiliate_id", affiliateId)
        .eq("custom_link", customLink)
        .maybeSingle();

    if (fetchError) throw fetchError;

    if (existing) {
        return { link: existing as AffiliateLink, isNew: false };
    }

    const { data, error } = await supabaseAdmin
        .from("affiliate_links")
        .insert({
            affiliate_id: affiliateId,
            custom_link: customLink,
        })
        .select()
        .single();

    if (error) throw error;

    return { link: data as AffiliateLink, isNew: true };
}

/**
 * Track affiliate visit
 *
 * @param supabaseAdmin - Supabase admin client (service_role)
 * @param affiliateId - UUID của affiliate
 * @param linkId - UUID của affiliate link
 * @param ip - IP address (optional)
 * @param userAgent - User agent string (optional)
 * @returns Visit record
 */
export async function trackVisit(
    supabaseAdmin: SupabaseClient,
    affiliateId: string,
    linkId: string,
    ip?: string,
    userAgent?: string,
) {
    const { data, error } = await supabaseAdmin
        .from("affiliate_visits")
        .insert({
            affiliate_id: affiliateId,
            link_id: linkId,
            ip: ip || null,
            user_agent: userAgent || null,
            converted: false,
        })
        .select()
        .single();

    if (error) throw error;
    return data as AffiliateVisit;
}

/**
 * Resolve affiliate ref code → affiliate info
 * Tìm kiếm theo custom_link trên bảng affiliates hoặc affiliate_links
 *
 * @param supabaseAdmin - Supabase admin client (service_role)
 * @param ref - Affiliate ref code (custom_link)
 * @returns { affiliateId, linkId } hoặc null
 */
export async function resolveAffiliateRef(
    supabaseAdmin: SupabaseClient,
    ref: string,
) {
    // 1. Try finding affiliate by custom_link on affiliates table
    const { data: affiliate, error: affError } = await supabaseAdmin
        .from("affiliates")
        .select("id, status")
        .eq("custom_link", ref)
        .maybeSingle();

    if (affError) throw affError;

    if (affiliate && affiliate.status === "active") {
        // Find associated link
        const { data: link } = await supabaseAdmin
            .from("affiliate_links")
            .select("id")
            .eq("affiliate_id", affiliate.id)
            .limit(1)
            .maybeSingle();

        return {
            affiliateId: affiliate.id as string,
            linkId: link?.id as string | undefined,
        };
    }

    // 2. Try finding by custom_link on affiliate_links table
    const { data: affLink, error: linkError } = await supabaseAdmin
        .from("affiliate_links")
        .select("id, affiliate_id")
        .eq("custom_link", ref)
        .maybeSingle();

    if (linkError) throw linkError;

    if (affLink) {
        // Verify affiliate is active
        const { data: aff } = await supabaseAdmin
            .from("affiliates")
            .select("id, status")
            .eq("id", affLink.affiliate_id)
            .single();

        if (aff && aff.status === "active") {
            return {
                affiliateId: aff.id as string,
                linkId: affLink.id as string,
            };
        }
    }

    return null;
}

/**
 * Lấy danh sách commissions theo affiliate_id
 *
 * @param supabase - Supabase client
 * @param affiliateId - UUID của affiliate
 * @returns Mảng commissions
 */
export async function getCommissions(
    supabase: SupabaseClient,
    affiliateId: string,
) {
    const { data, error } = await supabase
        .from("commissions")
        .select(COMMISSION_COLUMNS)
        .eq("affiliate_id", affiliateId)
        .order("created_at", { ascending: false });

    if (error) throw error;
    return (data ?? []) as Commission[];
}

/**
 * Tạo commission mới
 * Kiểm tra trùng order_id trước khi tạo
 *
 * @param supabaseAdmin - Supabase admin client (service_role)
 * @param params - { affiliateId, orderId, amount, commissionRate? }
 * @returns Commission record + isNew flag
 */
export async function createCommission(
    supabaseAdmin: SupabaseClient,
    params: CreateCommissionParams,
) {
    const { affiliateId, orderId, amount, commissionRate } = params;
    const rate = commissionRate ?? DEFAULT_COMMISSION_RATE;

    // Check if commission already exists for this order
    const { data: existing, error: fetchError } = await supabaseAdmin
        .from("commissions")
        .select(COMMISSION_COLUMNS)
        .eq("affiliate_id", affiliateId)
        .eq("order_id", orderId)
        .maybeSingle();

    if (fetchError) throw fetchError;

    if (existing) {
        return { commission: existing as Commission, isNew: false };
    }

    const commissionAmount = Math.round(amount * rate);

    const { data, error } = await supabaseAdmin
        .from("commissions")
        .insert({
            affiliate_id: affiliateId,
            order_id: orderId,
            amount,
            commission_rate: rate,
            commission_amount: commissionAmount,
            status: "pending",
        })
        .select()
        .single();

    if (error) throw error;

    return { commission: data as Commission, isNew: true };
}

/**
 * Lấy thống kê affiliate
 * Tổng hợp visits, conversions, commissions từ cả 2 bảng
 *
 * @param supabase - Supabase client
 * @param affiliateId - UUID của affiliate
 * @returns AffiliateStats
 */
export async function getAffiliateStats(
    supabase: SupabaseClient,
    affiliateId: string,
): Promise<AffiliateStats> {
    // Use count-only queries and DB-side aggregation instead of fetching all rows
    const [
        totalVisitsResult,
        totalConversionsResult,
        commissionsResult,
    ] = await Promise.all([
        // Count total visits (head: true = no row data, only count)
        supabase
            .from("affiliate_visits")
            .select("id", { count: "exact", head: true })
            .eq("affiliate_id", affiliateId),
        // Count converted visits only
        supabase
            .from("affiliate_visits")
            .select("id", { count: "exact", head: true })
            .eq("affiliate_id", affiliateId)
            .eq("converted", true),
        // Fetch only commission_amount + status (minimal columns for aggregation)
        supabase
            .from("commissions")
            .select("commission_amount, status")
            .eq("affiliate_id", affiliateId),
    ]);

    if (totalVisitsResult.error) throw totalVisitsResult.error;
    if (totalConversionsResult.error) throw totalConversionsResult.error;
    if (commissionsResult.error) throw commissionsResult.error;

    const totalVisits = totalVisitsResult.count ?? 0;
    const totalConversions = totalConversionsResult.count ?? 0;
    const conversionRate = totalVisits > 0
        ? Math.round((totalConversions / totalVisits) * 100 * 100) / 100
        : 0;

    const commissions = commissionsResult.data ?? [];
    const totalCommissions = commissions.reduce(
        (sum, c) => sum + (c.commission_amount ?? 0),
        0,
    );
    const pendingCommissions = commissions
        .filter((c) => c.status === "pending")
        .reduce((sum, c) => sum + (c.commission_amount ?? 0), 0);
    const paidCommissions = commissions
        .filter((c) => c.status === "paid")
        .reduce((sum, c) => sum + (c.commission_amount ?? 0), 0);

    return {
        totalBalance: pendingCommissions,
        totalCommissions,
        totalVisits,
        totalConversions,
        conversionRate,
        pendingCommissions,
        paidCommissions,
    };
}

/**
 * Lấy visits theo affiliate_id
 *
 * @param supabase - Supabase client
 * @param affiliateId - UUID của affiliate
 * @returns Mảng visits
 */
export async function getAffiliateVisits(
    supabase: SupabaseClient,
    affiliateId: string,
) {
    const { data, error } = await supabase
        .from("affiliate_visits")
        .select(AFFILIATE_VISIT_COLUMNS)
        .eq("affiliate_id", affiliateId)
        .order("created_at", { ascending: false });

    if (error) throw error;
    return (data ?? []) as AffiliateVisit[];
}
