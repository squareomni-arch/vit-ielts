/**
 * Payout Service — Payout requests, bank info, SePay integration
 *
 * Handles the full payout lifecycle:
 *   affiliate requests → admin approves → admin transfers → SePay confirms
 *
 * @see affiliate_system_analysis.md#5-payout
 * @see affiliate_system_analysis.md#6-sepay-integration
 */

import { SupabaseClient } from "@supabase/supabase-js";
import { PAYOUT_COLUMNS, BANK_INFO_COLUMNS } from "./lib/columns";
import { sanitizeFilterValue } from "./lib/sanitize";

// ============================================================
// Types
// ============================================================

export type PayoutStatus = "pending" | "approved" | "completed" | "rejected" | "flagged";

export type Payout = {
    id: string;
    affiliate_id: string;
    amount: number;
    status: PayoutStatus;
    reject_reason: string | null;
    bank_snapshot: BankInfo;
    sepay_transaction_id: number | null;
    sepay_reference_code: string | null;
    transaction_date: string | null;
    approved_at: string | null;
    completed_at: string | null;
    created_at: string;
};

export type BankInfo = {
    account_holder: string;
    account_number: string;
    bank_name: string;
    bank_code?: string;
    bank_branch?: string;
};

type BankInfoRow = BankInfo & {
    id: string;
    affiliate_id: string;
    updated_at: string;
    created_at: string;
};

type PayoutFilters = {
    status?: PayoutStatus;
    affiliateId?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
    page?: number;
    pageSize?: number;
};

type SepayPayoutData = {
    sepayId: number;
    amount: number;
    referenceCode: string;
    transactionDate: string;
};

// ============================================================
// Bank Info Functions
// ============================================================

/**
 * Get bank info for an affiliate
 */
export async function getBankInfo(
    supabase: SupabaseClient,
    affiliateId: string,
): Promise<BankInfoRow | null> {
    const { data, error } = await supabase
        .from("affiliate_bank_info")
        .select(BANK_INFO_COLUMNS)
        .eq("affiliate_id", affiliateId)
        .maybeSingle();

    if (error) throw error;
    return data;
}

/**
 * Upsert bank info for an affiliate
 */
export async function saveBankInfo(
    supabaseAdmin: SupabaseClient,
    affiliateId: string,
    bankInfo: BankInfo,
): Promise<BankInfoRow> {
    const { data, error } = await supabaseAdmin
        .from("affiliate_bank_info")
        .upsert(
            {
                affiliate_id: affiliateId,
                account_holder: bankInfo.account_holder.trim(),
                account_number: bankInfo.account_number.trim(),
                bank_name: bankInfo.bank_name.trim(),
                bank_code: bankInfo.bank_code?.trim() || null,
                bank_branch: bankInfo.bank_branch?.trim() || null,
                updated_at: new Date().toISOString(),
            },
            { onConflict: "affiliate_id" },
        )
        .select(BANK_INFO_COLUMNS)
        .single();

    if (error) throw error;
    return data;
}

// ============================================================
// Payout Request Functions
// ============================================================

/**
 * Create a payout request.
 * Uses atomic RPC to hold balance and create the payout in one transaction.
 *
 * Validates:
 * - amount >= min payout
 * - balance >= amount
 * - bank info exists
 */
export async function createPayoutRequest(
    supabaseAdmin: SupabaseClient,
    affiliateId: string,
    amount: number,
    minPayoutAmount: number = 200000,
): Promise<Payout> {
    // 1. Validate minimum amount
    if (amount < minPayoutAmount) {
        throw new Error(
            `Số tiền rút tối thiểu là ${minPayoutAmount.toLocaleString("vi-VN")}đ`,
        );
    }

    // 2. Check bank info exists
    const bankInfo = await getBankInfo(supabaseAdmin, affiliateId);
    if (!bankInfo) {
        throw new Error("Vui lòng cập nhật thông tin ngân hàng trước khi yêu cầu rút tiền");
    }

    const bankSnapshot: BankInfo = {
        account_holder: bankInfo.account_holder,
        account_number: bankInfo.account_number,
        bank_name: bankInfo.bank_name,
        bank_code: bankInfo.bank_code || undefined,
        bank_branch: bankInfo.bank_branch || undefined,
    };

    // 3. Atomic: hold balance + create payout (RPC)
    const { data: payoutId, error } = await supabaseAdmin
        .rpc("create_payout_request", {
            p_affiliate_id: affiliateId,
            p_amount: amount,
            p_bank_snapshot: bankSnapshot,
        });

    if (error) {
        // Parse RPC error messages
        if (error.message.includes("Insufficient balance")) {
            throw new Error("Số dư không đủ để rút tiền");
        }
        if (error.message.includes("not found")) {
            throw new Error("Affiliate không tồn tại");
        }
        throw error;
    }

    // 4. Fetch the created payout
    const { data: payout, error: fetchError } = await supabaseAdmin
        .from("payouts")
        .select(PAYOUT_COLUMNS)
        .eq("id", payoutId)
        .single();

    if (fetchError) throw fetchError;
    return payout;
}

/**
 * Admin approves a payout request.
 * Status: pending → approved
 */
export async function approvePayoutRequest(
    supabaseAdmin: SupabaseClient,
    payoutId: string,
): Promise<Payout> {
    const { data, error } = await supabaseAdmin
        .from("payouts")
        .update({
            status: "approved" as PayoutStatus,
            approved_at: new Date().toISOString(),
        })
        .eq("id", payoutId)
        .eq("status", "pending") // Only approve pending payouts
        .select(PAYOUT_COLUMNS)
        .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error("Payout không tìm thấy hoặc không ở trạng thái chờ duyệt");

    return data;
}

/**
 * Auto-complete payout from SePay webhook.
 * Status: approved → completed
 */
export async function completePayoutFromWebhook(
    supabaseAdmin: SupabaseClient,
    payoutId: string,
    sepayData: SepayPayoutData,
): Promise<{ updated: boolean; payout: Payout | null }> {
    // 1. Check idempotency — has this SePay transaction been processed?
    const { data: existingTx } = await supabaseAdmin
        .from("sepay_payout_transactions")
        .select("id")
        .eq("sepay_id", sepayData.sepayId)
        .maybeSingle();

    if (existingTx) {
        return { updated: false, payout: null }; // Already processed
    }

    // 2. Find the payout
    const { data: payout, error: findError } = await supabaseAdmin
        .from("payouts")
        .select(PAYOUT_COLUMNS)
        .eq("id", payoutId)
        .eq("status", "approved") // Only complete approved payouts
        .maybeSingle();

    if (findError) throw findError;
    if (!payout) return { updated: false, payout: null };

    // 3. Check amount match
    if (sepayData.amount !== payout.amount) {
        // Flag for admin review instead of completing
        await supabaseAdmin
            .from("payouts")
            .update({
                status: "flagged" as PayoutStatus,
                sepay_transaction_id: sepayData.sepayId,
                sepay_reference_code: sepayData.referenceCode,
            })
            .eq("id", payoutId);

        console.warn(
            `[Payout] Amount mismatch: SePay=${sepayData.amount}, Payout=${payout.amount}`,
        );
        return { updated: false, payout: null };
    }

    // 4. Complete the payout
    const { data: updated, error: updateError } = await supabaseAdmin
        .from("payouts")
        .update({
            status: "completed" as PayoutStatus,
            completed_at: new Date().toISOString(),
            sepay_transaction_id: sepayData.sepayId,
            sepay_reference_code: sepayData.referenceCode,
            transaction_date: sepayData.transactionDate,
        })
        .eq("id", payoutId)
        .eq("status", "approved")
        .select(PAYOUT_COLUMNS)
        .maybeSingle();

    if (updateError) throw updateError;
    if (!updated) return { updated: false, payout: null };

    // 5. Record SePay transaction (idempotency guard)
    await supabaseAdmin
        .from("sepay_payout_transactions")
        .insert({
            sepay_id: sepayData.sepayId,
            payout_id: payoutId,
            amount: sepayData.amount,
            reference_code: sepayData.referenceCode,
        });

    return { updated: true, payout: updated };
}

/**
 * Admin manually completes a payout (fallback for failed webhooks).
 * Status: approved → completed
 */
export async function completePayoutManually(
    supabaseAdmin: SupabaseClient,
    payoutId: string,
    transactionCode?: string,
): Promise<Payout> {
    const { data, error } = await supabaseAdmin
        .from("payouts")
        .update({
            status: "completed" as PayoutStatus,
            completed_at: new Date().toISOString(),
            sepay_reference_code: transactionCode || null,
        })
        .eq("id", payoutId)
        .in("status", ["approved", "flagged"]) 
        .select(PAYOUT_COLUMNS)
        .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error("Payout không tìm thấy hoặc không ở trạng thái có thể hoàn tất");

    return data;
}

/**
 * Admin rejects a payout. Uses atomic RPC to refund balance.
 * Status: pending|approved → rejected
 */
export async function rejectPayoutRequest(
    supabaseAdmin: SupabaseClient,
    payoutId: string,
    reason: string,
): Promise<void> {
    const { error } = await supabaseAdmin
        .rpc("reject_payout_request", {
            p_payout_id: payoutId,
            p_reason: reason,
        });

    if (error) {
        if (error.message.includes("not found")) {
            throw new Error("Payout không tồn tại");
        }
        if (error.message.includes("not in a rejectable state")) {
            throw new Error("Payout không ở trạng thái có thể từ chối");
        }
        throw error;
    }
}

// ============================================================
// Payout Query Functions
// ============================================================

/**
 * Admin: get all payouts with filters
 */
export async function getPayouts(
    supabaseAdmin: SupabaseClient,
    filters: PayoutFilters = {},
) {
    const {
        status,
        affiliateId,
        dateFrom,
        dateTo,
        search,
        page = 1,
        pageSize: rawPageSize = 20,
    } = filters;
    const pageSize = Math.min(rawPageSize, 100);
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabaseAdmin
        .from("payouts")
        .select(PAYOUT_COLUMNS, { count: "exact" })
        .order("created_at", { ascending: false });

    if (status) query = query.eq("status", status);
    if (affiliateId) query = query.eq("affiliate_id", affiliateId);
    if (dateFrom) query = query.gte("created_at", dateFrom);
    if (dateTo) query = query.lte("created_at", dateTo);

    if (search) {
        const safe = sanitizeFilterValue(search);
        if (safe) {
            query = query.or(`id.ilike.%${safe}%,sepay_reference_code.ilike.%${safe}%`);
        }
    }

    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) throw error;
    return { payouts: (data ?? []) as Payout[], total: count ?? 0 };
}

/**
 * Affiliate: get own payouts
 */
export async function getPayoutsByAffiliate(
    supabase: SupabaseClient,
    affiliateId: string,
    { page = 1, pageSize = 10 }: { page?: number; pageSize?: number } = {},
) {
    const safePageSize = Math.min(pageSize, 50);
    const from = (page - 1) * safePageSize;
    const to = from + safePageSize - 1;

    const { data, error, count } = await supabase
        .from("payouts")
        .select(PAYOUT_COLUMNS, { count: "exact" })
        .eq("affiliate_id", affiliateId)
        .order("created_at", { ascending: false })
        .range(from, to);

    if (error) throw error;
    return { payouts: (data ?? []) as Payout[], total: count ?? 0 };
}

/**
 * Get a single payout by ID
 */
export async function getPayoutById(
    supabaseAdmin: SupabaseClient,
    payoutId: string,
): Promise<Payout | null> {
    const { data, error } = await supabaseAdmin
        .from("payouts")
        .select(PAYOUT_COLUMNS)
        .eq("id", payoutId)
        .maybeSingle();

    if (error) throw error;
    return data;
}
