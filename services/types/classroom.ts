// ============================================================================
// Classroom (Lớp học) — types
// ============================================================================

export type ClassroomStatus = "active" | "closed";
export type ClassroomRole = "teacher" | "student";

export type Classroom = {
    id: string;
    name: string;
    description: string | null;
    invite_code: string;
    owner_id: string;
    status: ClassroomStatus;
    created_at: string;
};

export type ClassroomMember = {
    id: string;
    classroom_id: string;
    user_id: string;
    role: ClassroomRole;
    joined_at: string;
};

/** A member joined with their user profile (for member lists). */
export type ClassroomMemberWithUser = ClassroomMember & {
    name: string | null;
    email: string;
    avatar_url: string | null;
};

export type ClassroomAssignment = {
    id: string;
    classroom_id: string;
    quiz_id: string;
    due_at: string | null;
    note: string | null;
    assigned_to_all: boolean;
    created_by: string | null;
    created_at: string;
};

// ----------------------------------------------------------------------------
// Derived / view models
// ----------------------------------------------------------------------------

/** Class card in the teacher dashboard / "Danh sách lớp học". */
export type ClassroomSummary = Classroom & {
    /** the viewer's role in this class */
    viewer_role: ClassroomRole;
    student_count: number;
    teacher_count: number;
    assignment_count: number;
};

export type TeacherDashboardStats = {
    managed_class_count: number;
    total_students: number;
    active_students: number;
    avg_progress: number;
};

/** Stats for the student dashboard banner + cards on "Lớp học của tôi". */
export type StudentDashboardStats = {
    joined_class_count: number;
    total_assignments: number;
    pending_count: number;
    submitted_count: number;
    avg_band: number | null;
};

/** Submission state of one (assignment, student) pair, derived from test_results. */
export type SubmissionStatus = "submitted" | "late" | "overdue" | "pending";

/** A quiz assigned to the viewing student, with their derived status. */
export type StudentAssignmentView = {
    assignment_id: string;
    classroom_id: string;
    classroom_name: string;
    quiz_id: string;
    quiz_title: string;
    quiz_slug: string;
    quiz_skill: string;
    due_at: string | null;
    note: string | null;
    status: SubmissionStatus;
    /** student has started a draft attempt but not yet submitted */
    in_progress: boolean;
    score: number | null;
    submitted_at: string | null;
    test_result_id: string | null;
};

/** A student's assignment + quiz meta for the "Làm bài tập" detail page. */
export type StudentAssignmentDetail = StudentAssignmentView & {
    quiz_time_minutes: number | null;
    quiz_type: string | null;
    question_count: number | null;
    teacher_name: string | null;
    /** the quiz is Pro-only content */
    requires_pro: boolean;
    /** the viewing student is allowed to take it (not Pro-gated, or has Pro/skill access) */
    has_access: boolean;
};

/** Per-assignment roll-up for the teacher's "Bài giao" list. */
export type AssignmentWithStats = ClassroomAssignment & {
    quiz_title: string;
    quiz_slug: string;
    quiz_skill: string;
    quiz_source: string | null;
    target_count: number;
    submitted_count: number;
};

/** One student's cell in the tracking grid for a single assignment. */
export type TrackingCell = {
    assignment_id: string;
    quiz_id: string;
    status: SubmissionStatus;
    score: number | null;
    submitted_at: string | null;
};

/** One student's result for a single assignment (per-assignment detail page). */
export type AssignmentResultRow = {
    student_id: string;
    name: string | null;
    email: string;
    avatar_url: string | null;
    status: SubmissionStatus;
    score: number | null;
    submitted_at: string | null;
    duration_min: number | null;
    test_result_id: string | null;
};

/** Per-assignment results + summary stats. */
export type AssignmentDetail = {
    id: string;
    classroom_id: string;
    classroom_name: string;
    quiz_title: string;
    quiz_skill: string;
    due_at: string | null;
    rows: AssignmentResultRow[];
    total: number;
    submitted: number;
    avg_band: number | null;
    high_band: number | null;
    low_band: number | null;
    submit_rate: number;
};

/** A row in the class tracking dashboard — one student across all assignments. */
export type TrackingRow = {
    student_id: string;
    name: string | null;
    email: string;
    avatar_url: string | null;
    cells: TrackingCell[];
    submitted_count: number;
    total_count: number;
    average_band: number | null;
};
