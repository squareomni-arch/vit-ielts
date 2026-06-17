/**
 * Column constants for Supabase select() queries.
 *
 * Centralizes column lists to avoid duplication and drift.
 * When a column is added/removed, update it in one place.
 */

/** lightweight quiz columns for list/related views (no passages/questions) */
export const QUIZ_LIST_COLUMNS =
    "id, title, slug, excerpt, type, skill, time_minutes, pro_user_only, featured_image, tests_taken, source, year, quarter, part, question_form, status, views, published_at, created_at" as const;

/** columns returned for order queries */
export const ORDER_COLUMNS =
    "id, order_id, user_id, package_type, duration, skill_type, amount, original_amount, discount_amount, coupon_id, coupon_code, status, payment_method, transfer_content, affiliate_ref, pro_activated, created_at" as const;

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
    "id, affiliate_id, link_id, ip, user_agent, converted, order_id, is_unique, is_bot, created_at" as const;

/** columns returned for payout queries */
export const PAYOUT_COLUMNS =
    "id, affiliate_id, amount, status, reject_reason, bank_snapshot, sepay_transaction_id, sepay_reference_code, transaction_date, approved_at, completed_at, created_at" as const;

/** columns returned for bank info queries */
export const BANK_INFO_COLUMNS =
    "id, affiliate_id, account_holder, account_number, bank_name, bank_code, bank_branch, updated_at, created_at" as const;
