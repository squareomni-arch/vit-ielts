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

// Default waiting period: 7 days before commission becomes eligible
const DEFAULT_WAITING_PERIOD_DAYS = 7;

// Anti-spam: rate limit clicks per IP per affiliate per N hours
const DEFAULT_CLICK_RATE_LIMIT_HOURS = 24;

// Bot detection: common bot user-agent patterns
const BOT_UA_PATTERNS = [
    /bot/i, /crawl/i, /spider/i, /scrape/i, /curl/i, /wget/i,
    /python/i, /http/i, /phantomjs/i, /headless/i,
];

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

// ============================================================
// Anti-Fraud Functions
// ============================================================

/**
 * Check if a user-agent string looks like a bot
 */
function isBot(userAgent?: string): boolean {
    if (!userAgent) return true; // No UA is suspicious
    return BOT_UA_PATTERNS.some((pattern) => pattern.test(userAgent));
}

/**
 * Track an affiliate visit with anti-spam protections:
 * 1. Rate limiting: max 1 click per IP per affiliate per 24h
 * 2. Bot detection: skip bot user-agents
 * 3. Marks non-unique duplicate visits
 *
 * @returns visit record or null if rate-limited/bot
 */
export async function trackVisitWithAntiSpam(
    supabaseAdmin: SupabaseClient,
    affiliateId: string,
    linkId: string,
    ip?: string,
    userAgent?: string,
    rateLimitHours: number = DEFAULT_CLICK_RATE_LIMIT_HOURS,
) {
    // 1. Bot detection
    if (isBot(userAgent)) {
        // Still record for analytics, but flag as bot
        const { data, error } = await supabaseAdmin
            .from("affiliate_visits")
            .insert({
                affiliate_id: affiliateId,
                link_id: linkId,
                ip: ip || null,
                user_agent: userAgent || null,
                converted: false,
                is_unique: false,
                is_bot: true,
            })
            .select()
            .single();

        if (error) throw error;
        return { visit: data as AffiliateVisit, tracked: false, reason: "bot" };
    }

    // 2. Rate limiting: check for existing visit from same IP in last N hours
    if (ip) {
        const cutoff = new Date();
        cutoff.setHours(cutoff.getHours() - rateLimitHours);

        const { data: existing } = await supabaseAdmin
            .from("affiliate_visits")
            .select("id")
            .eq("affiliate_id", affiliateId)
            .eq("ip", ip)
            .eq("is_unique", true)
            .gte("created_at", cutoff.toISOString())
            .limit(1)
            .maybeSingle();

        if (existing) {
            // Record as non-unique (for analytics) but don't count as real visit
            const { data, error } = await supabaseAdmin
                .from("affiliate_visits")
                .insert({
                    affiliate_id: affiliateId,
                    link_id: linkId,
                    ip: ip,
                    user_agent: userAgent || null,
                    converted: false,
                    is_unique: false,
                    is_bot: false,
                })
                .select()
                .single();

            if (error) throw error;
            return { visit: data as AffiliateVisit, tracked: false, reason: "rate_limited" };
        }
    }

    // 3. Unique visit — track normally
    const { data, error } = await supabaseAdmin
        .from("affiliate_visits")
        .insert({
            affiliate_id: affiliateId,
            link_id: linkId,
            ip: ip || null,
            user_agent: userAgent || null,
            converted: false,
            is_unique: true,
            is_bot: false,
        })
        .select()
        .single();

    if (error) throw error;
    return { visit: data as AffiliateVisit, tracked: true, reason: null };
}

/**
 * Check for self-referral fraud.
 * Returns a fraud_flag string or null if clean.
 *
 * Checks:
 * - Email match: buyer email === affiliate user email
 * - Phone match: buyer phone === affiliate user phone
 * - IP match: buyer IP === affiliate last_login_ip
 */
export async function checkSelfReferral(
    supabaseAdmin: SupabaseClient,
    affiliateId: string,
    buyerEmail?: string,
    buyerPhone?: string,
    buyerIp?: string,
): Promise<string | null> {
    // Get affiliate's user info
    const { data: affiliate } = await supabaseAdmin
        .from("affiliates")
        .select("user_id, last_login_ip")
        .eq("id", affiliateId)
        .maybeSingle();

    if (!affiliate) return null;

    const { data: user } = await supabaseAdmin
        .from("users")
        .select("email, phone_number")
        .eq("id", affiliate.user_id)
        .maybeSingle();

    if (!user) return null;

    // Check email
    if (buyerEmail && user.email && buyerEmail.toLowerCase() === user.email.toLowerCase()) {
        return "self_referral";
    }

    // Check phone
    if (buyerPhone && user.phone_number && buyerPhone === user.phone_number) {
        return "self_referral";
    }

    // Check IP
    if (buyerIp && affiliate.last_login_ip && buyerIp === affiliate.last_login_ip) {
        return "ip_match";
    }

    return null;
}

// ============================================================
// Balance & Commission with Waiting Period
// ============================================================

/**
 * Atomically adjust affiliate balance using RPC.
 * @param delta - Positive to add, negative to deduct.
 * @returns New balance
 */
export async function adjustAffiliateBalance(
    supabaseAdmin: SupabaseClient,
    affiliateId: string,
    delta: number,
): Promise<number> {
    const { data, error } = await supabaseAdmin
        .rpc("adjust_affiliate_balance", {
            p_affiliate_id: affiliateId,
            p_delta: delta,
        });

    if (error) throw error;
    return data as number;
}

/**
 * Create a commission with a 7-day waiting period.
 * The commission is created with status='pending' and eligible_at = now + 7 days.
 * Balance is NOT added until the commission becomes eligible and is approved.
 *
 * Also performs self-referral fraud check.
 */
export async function createCommissionWithWaiting(
    supabaseAdmin: SupabaseClient,
    params: CreateCommissionParams & {
        buyerEmail?: string;
        buyerPhone?: string;
        buyerIp?: string;
        waitingPeriodDays?: number;
    },
) {
    const {
        affiliateId,
        orderId,
        amount,
        commissionRate,
        buyerEmail,
        buyerPhone,
        buyerIp,
        waitingPeriodDays = DEFAULT_WAITING_PERIOD_DAYS,
    } = params;
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

    // Anti-fraud check
    const fraudFlag = await checkSelfReferral(
        supabaseAdmin,
        affiliateId,
        buyerEmail,
        buyerPhone,
        buyerIp,
    );

    const commissionAmount = Math.round(amount * rate);

    // Calculate eligible_at (7 days from now)
    const eligibleAt = new Date();
    eligibleAt.setDate(eligibleAt.getDate() + waitingPeriodDays);

    const { data, error } = await supabaseAdmin
        .from("commissions")
        .insert({
            affiliate_id: affiliateId,
            order_id: orderId,
            amount,
            commission_rate: rate,
            commission_amount: commissionAmount,
            status: fraudFlag ? "review" : "pending",
            fraud_flag: fraudFlag,
            eligible_at: eligibleAt.toISOString(),
        })
        .select()
        .single();

    if (error) throw error;

    return { commission: data as Commission, isNew: true, fraudFlag };
}

/**
 * Approve eligible commissions and add to affiliate balance.
 * Called by a cron job or admin action after the waiting period.
 *
 * Finds all commissions where:
 * - status = 'pending'
 * - eligible_at <= now
 * - fraud_flag IS NULL
 *
 * Then adds commission_amount to affiliate balance and updates total_earned.
 */
export async function processEligibleCommissions(
    supabaseAdmin: SupabaseClient,
) {
    const now = new Date().toISOString();

    // Find eligible commissions
    const { data: eligible, error: fetchError } = await supabaseAdmin
        .from("commissions")
        .select("id, affiliate_id, commission_amount")
        .eq("status", "pending")
        .is("fraud_flag", null)
        .lte("eligible_at", now)
        .limit(100);

    if (fetchError) throw fetchError;
    if (!eligible || eligible.length === 0) return { processed: 0 };

    let processed = 0;

    for (const commission of eligible) {
        try {
            // Add to affiliate balance
            await supabaseAdmin
                .rpc("adjust_affiliate_balance", {
                    p_affiliate_id: commission.affiliate_id,
                    p_delta: commission.commission_amount,
                });

            // Mark commission as approved (eligible and credited to balance)
            await supabaseAdmin
                .from("commissions")
                .update({ status: "approved" })
                .eq("id", commission.id);

            processed++;
        } catch (err) {
            console.error(`[Affiliate] Failed to process commission ${commission.id}:`, err);
        }
    }

    return { processed };
}
