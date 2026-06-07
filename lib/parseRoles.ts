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
    return parsed.includes("administrator")
        || parsed.includes("admin")
        || parsed.includes("editor");
}

/**
 * Global teacher capability — admin-granted. Gates the teacher dashboard and
 * creating classes ("Tạo lớp mới"). Per-class roles live in classroom_members.
 * Administrators are implicitly teachers.
 */
export function isTeacherRole(roles: unknown): boolean {
    const parsed = parseRoles(roles);
    return parsed.includes("teacher")
        || parsed.includes("administrator")
        || parsed.includes("admin");
}

/** Whether the user may create/own classes from the teacher dashboard. */
export function canManageClassroom(roles: unknown): boolean {
    return isTeacherRole(roles);
}

/**
 * Full admin = administrator only. Editors are admin-lite:
 * they can read/edit content but cannot delete, view revenue,
 * or change payment configuration.
 */
export function isFullAdmin(roles: unknown): boolean {
    const parsed = parseRoles(roles);
    return parsed.includes("administrator") || parsed.includes("admin");
}

export function canDelete(roles: unknown): boolean {
    return isFullAdmin(roles);
}

export function canViewRevenue(roles: unknown): boolean {
    return isFullAdmin(roles);
}

export function canConfigurePayments(roles: unknown): boolean {
    return isFullAdmin(roles);
}
