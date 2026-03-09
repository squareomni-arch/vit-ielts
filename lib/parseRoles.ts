/**
 * Parse the `roles` column from the `users` table.
 *
 * The column stores roles in one of these formats:
 *   - JSON string: '["administrator"]'
 *   - Plain string: 'administrator'
 *   - Array:        ['administrator']
 *   - null/undefined
 *
 * Always returns a string[].
 */
export function parseRoles(roles: unknown, fallback = "subscriber"): string[] {
    if (Array.isArray(roles)) return roles;

    if (typeof roles === "string") {
        // Try JSON parse first (handles '["administrator"]')
        try {
            const parsed = JSON.parse(roles);
            if (Array.isArray(parsed)) return parsed;
            if (typeof parsed === "string") return [parsed];
        } catch {
            // Not JSON — treat as plain string like "administrator"
        }
        return [roles];
    }

    return [fallback];
}

export function isAdminRole(roles: unknown): boolean {
    const parsed = parseRoles(roles);
    return parsed.includes("administrator") || parsed.includes("admin");
}
