/**
 * Column constants for Supabase select() queries.
 *
 * Centralizes column lists to avoid duplication and drift.
 * When a column is added/removed, update it in one place.
 */

/** columns returned for order queries */
export const ORDER_COLUMNS =
    "id, order_id, user_id, package_type, duration, skill_type, amount, original_amount, discount_amount, coupon_id, coupon_code, status, payment_method, transfer_content, affiliate_ref, created_at" as const;

/** columns returned for test result queries */
export const TEST_RESULT_COLUMNS =
    "id, user_id, quiz_id, answers, test_part, time_left, test_time, test_mode, score, status, submitted_at, created_at" as const;

/** lightweight test result columns (no answers payload) for history/list views */
export const TEST_RESULT_SUMMARY_COLUMNS =
    "id, user_id, quiz_id, score, test_part, time_left, test_time, test_mode, status, submitted_at, created_at" as const;

/** columns returned for affiliate queries */
export const AFFILIATE_COLUMNS =
    "id, user_id, custom_link, status, commission_rate, created_at" as const;

/** columns returned for affiliate link queries */
export const AFFILIATE_LINK_COLUMNS =
    "id, affiliate_id, custom_link, created_at" as const;

/** columns returned for commission queries */
export const COMMISSION_COLUMNS =
    "id, affiliate_id, order_id, amount, commission_rate, commission_amount, status, created_at" as const;

/** columns returned for affiliate visit queries */
export const AFFILIATE_VISIT_COLUMNS =
    "id, affiliate_id, link_id, ip, user_agent, converted, order_id, created_at" as const;
