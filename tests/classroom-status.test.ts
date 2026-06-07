/**
 * Classroom submission-status derivation tests.
 *
 * Submission status is NOT stored — it's derived from test_results via
 * deriveSubmissionStatus(). This covers on-time / late / overdue / pending
 * against the deadline + submission time.
 *
 * @see services/lib/classroomStatus.ts
 */

import { describe, it, expect } from "vitest";
import {
  deriveSubmissionStatus,
  isSubmitted,
} from "../services/lib/classroomStatus";

const NOW = "2026-06-06T12:00:00.000Z";
const DUE = "2026-06-10T23:59:00.000Z"; // future deadline
const PAST_DUE = "2026-06-01T23:59:00.000Z"; // past deadline

describe("deriveSubmissionStatus", () => {
  it("submitted before the deadline → submitted", () => {
    expect(
      deriveSubmissionStatus(DUE, "2026-06-09T08:00:00.000Z", NOW)
    ).toBe("submitted");
  });

  it("submitted after the deadline → late", () => {
    expect(
      deriveSubmissionStatus(PAST_DUE, "2026-06-05T08:00:00.000Z", NOW)
    ).toBe("late");
  });

  it("submitted exactly at the deadline → submitted (not late)", () => {
    expect(deriveSubmissionStatus(DUE, DUE, NOW)).toBe("submitted");
  });

  it("no deadline + submitted → submitted regardless of time", () => {
    expect(
      deriveSubmissionStatus(null, "2026-06-05T08:00:00.000Z", NOW)
    ).toBe("submitted");
  });

  it("not submitted + deadline passed → overdue", () => {
    expect(deriveSubmissionStatus(PAST_DUE, null, NOW)).toBe("overdue");
  });

  it("not submitted + deadline in the future → pending", () => {
    expect(deriveSubmissionStatus(DUE, null, NOW)).toBe("pending");
  });

  it("not submitted + no deadline → pending", () => {
    expect(deriveSubmissionStatus(null, null, NOW)).toBe("pending");
  });
});

describe("isSubmitted", () => {
  it("counts submitted and late as submitted", () => {
    expect(isSubmitted("submitted")).toBe(true);
    expect(isSubmitted("late")).toBe(true);
  });

  it("does not count overdue or pending", () => {
    expect(isSubmitted("overdue")).toBe(false);
    expect(isSubmitted("pending")).toBe(false);
  });
});
