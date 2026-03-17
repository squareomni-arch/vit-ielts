/**
 * Sanitize utility for PostgREST filter values.
 *
 * PostgREST uses `.` and `,` as special characters in filter strings.
 * User-supplied values must be sanitized before interpolation into
 * `.or()` or `.ilike()` filter strings to prevent filter injection.
 *
 * @see https://postgrest.org/en/stable/references/api/tables_views.html#operators
 */

/**
 * Sanitize a value for safe use in PostgREST filter strings.
 * Strips characters that have special meaning in PostgREST filter syntax:
 *   - `,` (separates OR conditions)
 *   - `.` (separates column.operator.value)
 *   - `(` and `)` (grouping)
 *
 * @param input - Raw user input
 * @returns Sanitized string safe for PostgREST filters
 */
export function sanitizeFilterValue(input: string): string {
    // Remove PostgREST special characters that could alter filter semantics
    return input.replace(/[,.()"'\\]/g, "").trim();
}
