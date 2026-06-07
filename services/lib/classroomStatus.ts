import type { SubmissionStatus } from "../types/classroom";

/**
 * Derive a student's submission status for one assignment from `test_results`.
 *
 * Submission status & score are NOT stored — they're computed by joining the
 * latest qualifying test_result for (student, quiz). This pure function keeps
 * that rule in one place (and unit-testable).
 *
 * @param dueAt        assignment deadline (ISO) or null for no deadline
 * @param submittedAt  submitted_at of the latest qualifying result, or null
 * @param now          current time (ISO) — injectable for tests
 */
export function deriveSubmissionStatus(
    dueAt: string | null,
    submittedAt: string | null,
    now: string
): SubmissionStatus {
    if (submittedAt) {
        if (dueAt && new Date(submittedAt) > new Date(dueAt)) return "late";
        return "submitted";
    }
    if (dueAt && new Date(now) > new Date(dueAt)) return "overdue";
    return "pending";
}

/** Whether a status counts as "đã nộp" for submit-rate stats. */
export function isSubmitted(status: SubmissionStatus): boolean {
    return status === "submitted" || status === "late";
}
