/**
 * Classroom (Lớp học) Service — Vit IELTS
 *
 * Teachers create classes, invite members by code/link, assign quizzes (đề)
 * with deadlines. Submission status & scores are DERIVED from `test_results`
 * (no submissions table) via deriveSubmissionStatus().
 *
 * All functions receive SupabaseClient as first param (browser / SSR / API).
 */

import { SupabaseClient } from "@supabase/supabase-js";
import { deriveSubmissionStatus, isSubmitted } from "./lib/classroomStatus";
import { safeParseJsonb } from "./lib/safeParseJsonb";
import { isAdminRole } from "~lib/parseRoles";
import {
    toLegacyQuizForScore,
    calculateStoredScoreResult,
} from "@/shared/lib/test-result-display";
import type {
    Classroom,
    ClassroomMemberWithUser,
    ClassroomRole,
    ClassroomSummary,
    TeacherDashboardStats,
    StudentAssignmentView,
    StudentAssignmentDetail,
    StudentDashboardStats,
    AssignmentWithStats,
    AssignmentDetail,
    AssignmentResultRow,
    TrackingRow,
    TrackingCell,
    SubmissionStatus,
} from "./types/classroom";

const nowIso = () => new Date().toISOString();

// ============================================================================
// Classes
// ============================================================================

export async function createClassroom(
    supabase: SupabaseClient,
    params: { name: string; description?: string | null; ownerId: string }
): Promise<Classroom> {
    const { data: classroom, error } = await supabase
        .from("classrooms")
        .insert({
            name: params.name,
            description: params.description ?? null,
            owner_id: params.ownerId,
        })
        .select("*")
        .single();
    if (error) throw error;

    const { error: memberError } = await supabase
        .from("classroom_members")
        .insert({ classroom_id: classroom.id, user_id: params.ownerId, role: "teacher" });
    if (memberError) throw memberError;

    return classroom as Classroom;
}

/** All classes the user belongs to (teacher or student), with counts. */
export async function getClassroomsForUser(
    supabase: SupabaseClient,
    userId: string
): Promise<ClassroomSummary[]> {
    const { data: memberships, error } = await supabase
        .from("classroom_members")
        .select("classroom_id, role")
        .eq("user_id", userId)
        .eq("status", "active");
    if (error) throw error;
    if (!memberships?.length) return [];

    const classIds = memberships.map((m) => m.classroom_id);
    const roleByClass = new Map<string, ClassroomRole>(
        memberships.map((m) => [m.classroom_id, m.role as ClassroomRole])
    );

    const [classroomsRes, membersRes, assignmentsRes] = await Promise.all([
        supabase
            .from("classrooms")
            .select("*")
            .in("id", classIds)
            .order("created_at", { ascending: false }),
        supabase
            .from("classroom_members")
            .select("classroom_id, role")
            .eq("status", "active")
            .in("classroom_id", classIds),
        supabase
            .from("classroom_assignments")
            .select("classroom_id")
            .in("classroom_id", classIds),
    ]);
    if (classroomsRes.error) throw classroomsRes.error;

    const students = new Map<string, number>();
    const teachers = new Map<string, number>();
    for (const m of membersRes.data ?? []) {
        const bucket = m.role === "teacher" ? teachers : students;
        bucket.set(m.classroom_id, (bucket.get(m.classroom_id) ?? 0) + 1);
    }
    const assignmentCounts = new Map<string, number>();
    for (const a of assignmentsRes.data ?? []) {
        assignmentCounts.set(a.classroom_id, (assignmentCounts.get(a.classroom_id) ?? 0) + 1);
    }

    return (classroomsRes.data ?? []).map((c) => ({
        ...(c as Classroom),
        viewer_role: roleByClass.get(c.id) ?? "student",
        student_count: students.get(c.id) ?? 0,
        teacher_count: teachers.get(c.id) ?? 0,
        assignment_count: assignmentCounts.get(c.id) ?? 0,
    }));
}

/** Header stats for the teacher dashboard. */
export async function getTeacherDashboardStats(
    supabase: SupabaseClient,
    userId: string
): Promise<TeacherDashboardStats> {
    const summaries = await getClassroomsForUser(supabase, userId);
    const managed = summaries.filter((c) => c.viewer_role === "teacher");
    const managedIds = managed.map((c) => c.id);

    // Distinct students across managed classes
    let totalStudents = 0;
    let activeStudents = 0;
    if (managedIds.length) {
        const { data: studentRows } = await supabase
            .from("classroom_members")
            .select("user_id")
            .eq("role", "student")
            .eq("status", "active")
            .in("classroom_id", managedIds);
        const studentIds = [...new Set((studentRows ?? []).map((r) => r.user_id))];
        totalStudents = studentIds.length;

        if (studentIds.length) {
            // "active" = submitted at least one result in the last 7 days
            const since = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
            const { data: recent } = await supabase
                .from("test_results")
                .select("user_id")
                .eq("status", "published")
                .gte("submitted_at", since)
                .in("user_id", studentIds);
            activeStudents = new Set((recent ?? []).map((r) => r.user_id)).size;
        }
    }

    // Average submission progress across all assignments in managed classes
    let avgProgress = 0;
    if (managedIds.length) {
        const perClass = await Promise.all(
            managedIds.map((id) => getClassroomAssignments(supabase, id))
        );
        let targets = 0;
        let submitted = 0;
        for (const list of perClass) {
            for (const a of list) {
                targets += a.target_count;
                submitted += a.submitted_count;
            }
        }
        avgProgress = targets ? Math.round((submitted / targets) * 100) : 0;
    }

    return {
        managed_class_count: managed.length,
        total_students: totalStudents,
        active_students: activeStudents,
        avg_progress: avgProgress,
    };
}

/** A single class + its members (with user profiles). */
export async function getClassroom(
    supabase: SupabaseClient,
    classroomId: string
): Promise<{ classroom: Classroom; members: ClassroomMemberWithUser[] } | null> {
    const { data: classroom, error } = await supabase
        .from("classrooms")
        .select("*")
        .eq("id", classroomId)
        .maybeSingle();
    if (error) throw error;
    if (!classroom) return null;

    const { data: members, error: memberError } = await supabase
        .from("classroom_members")
        .select(
            "id, classroom_id, user_id, role, joined_at, display_name, users(name, email, avatar_url, is_pro, pro_expiration_date)"
        )
        .eq("classroom_id", classroomId)
        .eq("status", "active")
        .order("joined_at", { ascending: true });
    if (memberError) throw memberError;

    const now = Date.now();
    const flattened: ClassroomMemberWithUser[] = (members ?? []).map((m) => {
        const u = (m.users ?? {}) as {
            name?: string | null;
            email?: string;
            avatar_url?: string | null;
            is_pro?: boolean | null;
            pro_expiration_date?: string | null;
        };
        const isPro = Boolean(
            u.is_pro && u.pro_expiration_date && new Date(u.pro_expiration_date).getTime() > now
        );
        return {
            id: m.id,
            classroom_id: m.classroom_id,
            user_id: m.user_id,
            role: m.role as ClassroomRole,
            joined_at: m.joined_at,
            name: u.name ?? null,
            email: u.email ?? "",
            avatar_url: u.avatar_url ?? null,
            display_name: m.display_name ?? null,
            is_pro: isPro,
        };
    });

    return { classroom: classroom as Classroom, members: flattened };
}

export async function updateClassroom(
    supabase: SupabaseClient,
    classroomId: string,
    patch: {
        name?: string;
        description?: string | null;
        status?: "active" | "closed";
        image_url?: string | null;
    }
): Promise<Classroom> {
    const { data, error } = await supabase
        .from("classrooms")
        .update(patch)
        .eq("id", classroomId)
        .select("*")
        .single();
    if (error) throw error;
    return data as Classroom;
}

export async function deleteClassroom(
    supabase: SupabaseClient,
    classroomId: string
): Promise<void> {
    const { error } = await supabase.from("classrooms").delete().eq("id", classroomId);
    if (error) throw error;
}

export async function regenerateInviteCode(
    supabase: SupabaseClient,
    classroomId: string
): Promise<string> {
    const { data: code, error: rpcError } = await supabase.rpc(
        "generate_classroom_invite_code"
    );
    if (rpcError) throw rpcError;
    const { error } = await supabase
        .from("classrooms")
        .update({ invite_code: code })
        .eq("id", classroomId);
    if (error) throw error;
    return code as string;
}

// ============================================================================
// Membership
// ============================================================================

/** Self-join via invite code/link (RPC bypasses RLS for the lookup). */
export async function joinClassroomByCode(
    supabase: SupabaseClient,
    code: string,
    role: ClassroomRole = "student"
): Promise<{ id: string; name: string; status: "pending" | "active"; role: ClassroomRole }> {
    const { data, error } = await supabase.rpc("join_classroom_by_code", {
        p_code: code,
        p_role: role,
    });
    if (error) throw error;
    return data as {
        id: string;
        name: string;
        status: "pending" | "active";
        role: ClassroomRole;
    };
}

/** Pending students awaiting a teacher's approval to enter the class. */
export async function getJoinRequests(
    supabase: SupabaseClient,
    classroomId: string
): Promise<ClassroomMemberWithUser[]> {
    const { data, error } = await supabase
        .from("classroom_members")
        .select("id, classroom_id, user_id, role, joined_at, status, users(name, email, avatar_url)")
        .eq("classroom_id", classroomId)
        .eq("status", "pending")
        .order("joined_at", { ascending: true });
    if (error) throw error;
    return (data ?? []).map((m) => {
        const u = (m.users ?? {}) as { name?: string; email?: string; avatar_url?: string };
        return {
            id: m.id,
            classroom_id: m.classroom_id,
            user_id: m.user_id,
            role: m.role,
            joined_at: m.joined_at,
            name: u.name ?? null,
            email: u.email ?? "",
            avatar_url: u.avatar_url ?? null,
        };
    });
}

/** Approve a pending student (status → active). */
export async function approveJoinRequest(
    supabase: SupabaseClient,
    classroomId: string,
    userId: string
): Promise<void> {
    const { error } = await supabase
        .from("classroom_members")
        .update({ status: "active" })
        .eq("classroom_id", classroomId)
        .eq("user_id", userId);
    if (error) throw error;
}

/** Reject a pending student (remove the row). */
export async function rejectJoinRequest(
    supabase: SupabaseClient,
    classroomId: string,
    userId: string
): Promise<void> {
    const { error } = await supabase
        .from("classroom_members")
        .delete()
        .eq("classroom_id", classroomId)
        .eq("user_id", userId)
        .eq("status", "pending");
    if (error) throw error;
}

/** Teacher adds a member by email (RPC verifies teacher + looks up the user). */
export async function addMemberByEmail(
    supabase: SupabaseClient,
    classroomId: string,
    email: string,
    role: ClassroomRole
): Promise<void> {
    const { error } = await supabase.rpc("add_classroom_member_by_email", {
        p_classroom_id: classroomId,
        p_email: email,
        p_role: role,
    });
    if (error) throw error;
}

/** Teacher sets/clears a member's per-class display name (null = use account name). */
export async function updateMemberDisplayName(
    supabase: SupabaseClient,
    classroomId: string,
    userId: string,
    displayName: string | null
): Promise<void> {
    const { error } = await supabase
        .from("classroom_members")
        .update({ display_name: displayName })
        .eq("classroom_id", classroomId)
        .eq("user_id", userId);
    if (error) throw error;
}

export async function removeMember(
    supabase: SupabaseClient,
    classroomId: string,
    userId: string
): Promise<void> {
    const { error } = await supabase
        .from("classroom_members")
        .delete()
        .eq("classroom_id", classroomId)
        .eq("user_id", userId);
    if (error) throw error;
}

// ============================================================================
// Assignments
// ============================================================================

/**
 * Assign one or more quizzes to a class. Creates one assignment row per quiz.
 * When `studentIds` is provided, the assignment targets that subset; otherwise
 * the whole class.
 */
export async function createAssignments(
    supabase: SupabaseClient,
    params: {
        classroomId: string;
        quizIds: string[];
        dueAt?: string | null;
        note?: string | null;
        studentIds?: string[] | null;
        createdBy: string;
    }
): Promise<string[]> {
    const assignedToAll = !params.studentIds || params.studentIds.length === 0;

    const rows = params.quizIds.map((quizId) => ({
        classroom_id: params.classroomId,
        quiz_id: quizId,
        due_at: params.dueAt ?? null,
        note: params.note ?? null,
        assigned_to_all: assignedToAll,
        created_by: params.createdBy,
    }));

    const { data: inserted, error } = await supabase
        .from("classroom_assignments")
        .insert(rows)
        .select("id");
    if (error) throw error;

    const ids = (inserted ?? []).map((r) => r.id as string);

    if (!assignedToAll && params.studentIds?.length) {
        const targetRows = ids.flatMap((assignmentId) =>
            params.studentIds!.map((studentId) => ({
                assignment_id: assignmentId,
                student_id: studentId,
            }))
        );
        const { error: targetError } = await supabase
            .from("classroom_assignment_targets")
            .insert(targetRows);
        if (targetError) throw targetError;
    }

    return ids;
}

export async function deleteAssignment(
    supabase: SupabaseClient,
    assignmentId: string
): Promise<void> {
    const { error } = await supabase
        .from("classroom_assignments")
        .delete()
        .eq("id", assignmentId);
    if (error) throw error;
}

/** Update an assignment's due date (teacher only; null = no deadline). */
export async function updateAssignmentDueAt(
    supabase: SupabaseClient,
    assignmentId: string,
    dueAt: string | null
): Promise<void> {
    const { error } = await supabase
        .from("classroom_assignments")
        .update({ due_at: dueAt })
        .eq("id", assignmentId);
    if (error) throw error;
}

/**
 * Teacher's "Bài giao" list for a class, each with target/submitted counts.
 * Submission counts are derived from test_results.
 */
export async function getClassroomAssignments(
    supabase: SupabaseClient,
    classroomId: string
): Promise<AssignmentWithStats[]> {
    const { data: assignments, error } = await supabase
        .from("classroom_assignments")
        .select("*, quizzes(title, slug, skill, source)")
        .eq("classroom_id", classroomId)
        .order("created_at", { ascending: false });
    if (error) throw error;
    if (!assignments?.length) return [];

    // Class student roster (default target audience)
    const { data: studentRows } = await supabase
        .from("classroom_members")
        .select("user_id")
        .eq("classroom_id", classroomId)
        .eq("role", "student")
        .eq("status", "active");
    const allStudentIds = (studentRows ?? []).map((r) => r.user_id);

    // Per-assignment targets (for subset assignments)
    const assignmentIds = assignments.map((a) => a.id);
    const { data: targets } = await supabase
        .from("classroom_assignment_targets")
        .select("assignment_id, student_id")
        .in("assignment_id", assignmentIds);
    const targetsByAssignment = new Map<string, string[]>();
    for (const t of targets ?? []) {
        const arr = targetsByAssignment.get(t.assignment_id) ?? [];
        arr.push(t.student_id);
        targetsByAssignment.set(t.assignment_id, arr);
    }

    // Published results for the relevant quizzes/students (single query)
    const quizIds = [...new Set(assignments.map((a) => a.quiz_id))];
    const { data: results } = await supabase
        .from("test_results")
        .select("user_id, quiz_id, submitted_at")
        .eq("status", "published")
        .not("submitted_at", "is", null)
        .in("quiz_id", quizIds)
        .in("user_id", allStudentIds.length ? allStudentIds : ["00000000-0000-0000-0000-000000000000"]);

    return assignments.map((a) => {
        const quiz = (a.quizzes ?? {}) as {
            title?: string;
            slug?: string;
            skill?: string;
            source?: string | null;
        };
        const targetStudents = a.assigned_to_all
            ? allStudentIds
            : targetsByAssignment.get(a.id) ?? [];
        const targetSet = new Set(targetStudents);

        const submitters = new Set(
            (results ?? [])
                .filter(
                    (r) =>
                        r.quiz_id === a.quiz_id &&
                        targetSet.has(r.user_id) &&
                        new Date(r.submitted_at) >= new Date(a.created_at)
                )
                .map((r) => r.user_id)
        );

        return {
            id: a.id,
            classroom_id: a.classroom_id,
            quiz_id: a.quiz_id,
            due_at: a.due_at,
            note: a.note,
            assigned_to_all: a.assigned_to_all,
            created_by: a.created_by,
            created_at: a.created_at,
            quiz_title: quiz.title ?? "",
            quiz_slug: quiz.slug ?? "",
            quiz_skill: quiz.skill ?? "",
            quiz_source: quiz.source ?? null,
            target_count: targetStudents.length,
            submitted_count: submitters.size,
        };
    });
}

/** Per-assignment results: each targeted student's result for one assignment. */
export async function getAssignmentDetail(
    supabase: SupabaseClient,
    assignmentId: string
): Promise<AssignmentDetail | null> {
    const { data: a, error } = await supabase
        .from("classroom_assignments")
        .select("*, classrooms(name), quizzes(title, skill)")
        .eq("id", assignmentId)
        .maybeSingle();
    if (error) throw error;
    if (!a) return null;

    const classroom = (a.classrooms ?? {}) as { name?: string };
    const quiz = (a.quizzes ?? {}) as { title?: string; skill?: string };

    // Target students
    let targetIds: string[] = [];
    if (a.assigned_to_all) {
        const { data: rows } = await supabase
            .from("classroom_members")
            .select("user_id")
            .eq("classroom_id", a.classroom_id)
            .eq("role", "student")
            .eq("status", "active");
        targetIds = (rows ?? []).map((r) => r.user_id);
    } else {
        const { data: rows } = await supabase
            .from("classroom_assignment_targets")
            .select("student_id")
            .eq("assignment_id", assignmentId);
        targetIds = (rows ?? []).map((r) => r.student_id);
    }

    if (!targetIds.length) {
        return {
            id: a.id,
            classroom_id: a.classroom_id,
            classroom_name: classroom.name ?? "",
            quiz_title: quiz.title ?? "",
            quiz_skill: quiz.skill ?? "",
            due_at: a.due_at,
            rows: [],
            total: 0,
            submitted: 0,
            avg_band: null,
            high_band: null,
            low_band: null,
            submit_rate: 0,
        };
    }

    const [usersRes, resultsRes, displayRes] = await Promise.all([
        supabase.from("users").select("id, name, email, avatar_url").in("id", targetIds),
        supabase
            .from("test_results")
            .select("id, user_id, score, submitted_at, test_time, time_left")
            .eq("quiz_id", a.quiz_id)
            .eq("status", "published")
            .not("submitted_at", "is", null)
            .in("user_id", targetIds)
            .order("submitted_at", { ascending: false }),
        supabase
            .from("classroom_members")
            .select("user_id, display_name")
            .eq("classroom_id", a.classroom_id)
            .in("user_id", targetIds),
    ]);

    const displayById = new Map(
        (displayRes.data ?? []).map((m) => [m.user_id, m.display_name as string | null])
    );
    const usersById = new Map(
        (usersRes.data ?? []).map((u) => [u.id, u as { id: string; name: string | null; email: string; avatar_url: string | null }])
    );

    const now = nowIso();
    const bands: number[] = [];
    let submitted = 0;

    const rows: AssignmentResultRow[] = targetIds.map((sid) => {
        const u = usersById.get(sid);
        const result = (resultsRes.data ?? []).find(
            (r) => r.user_id === sid && new Date(r.submitted_at) >= new Date(a.created_at)
        );
        const status = deriveSubmissionStatus(a.due_at, result?.submitted_at ?? null, now);
        if (isSubmitted(status)) submitted += 1;
        if (typeof result?.score === "number") bands.push(result.score);

        // duration spent = allotted - remaining (time_left "mm:ss")
        let durationMin: number | null = null;
        if (result?.test_time) {
            let remaining = 0;
            if (result.time_left && /^\d+:\d+$/.test(result.time_left)) {
                const [m, s] = result.time_left.split(":").map(Number);
                remaining = m * 60 + s;
            }
            durationMin = Math.max(0, Math.round((result.test_time * 60 - remaining) / 60));
        }

        return {
            student_id: sid,
            name: displayById.get(sid) || u?.name || null,
            email: u?.email ?? "",
            avatar_url: u?.avatar_url ?? null,
            status,
            score: result?.score ?? null,
            submitted_at: result?.submitted_at ?? null,
            duration_min: durationMin,
            test_result_id: result?.id ?? null,
        };
    });

    return {
        id: a.id,
        classroom_id: a.classroom_id,
        classroom_name: classroom.name ?? "",
        quiz_title: quiz.title ?? "",
        quiz_skill: quiz.skill ?? "",
        due_at: a.due_at,
        rows,
        total: targetIds.length,
        submitted,
        avg_band: bands.length
            ? Math.round((bands.reduce((x, y) => x + y, 0) / bands.length) * 10) / 10
            : null,
        high_band: bands.length ? Math.max(...bands) : null,
        low_band: bands.length ? Math.min(...bands) : null,
        submit_rate: targetIds.length ? Math.round((submitted / targetIds.length) * 100) : 0,
    };
}

// ============================================================================
// Student view
// ============================================================================

/** All quizzes assigned to a student across their classes, with derived status. */
export async function getStudentAssignments(
    supabase: SupabaseClient,
    userId: string
): Promise<StudentAssignmentView[]> {
    // Classes the student is enrolled in (as student)
    const { data: memberships } = await supabase
        .from("classroom_members")
        .select("classroom_id")
        .eq("user_id", userId)
        .eq("role", "student")
        .eq("status", "active");
    const classIds = (memberships ?? []).map((m) => m.classroom_id);
    if (!classIds.length) return [];

    const { data: assignments } = await supabase
        .from("classroom_assignments")
        .select("*, classrooms(name), quizzes(title, slug, skill)")
        .in("classroom_id", classIds)
        .order("created_at", { ascending: false });
    if (!assignments?.length) return [];

    // Filter out subset assignments this student isn't targeted by
    const subsetIds = assignments.filter((a) => !a.assigned_to_all).map((a) => a.id);
    let targetedSubset = new Set<string>();
    if (subsetIds.length) {
        const { data: targets } = await supabase
            .from("classroom_assignment_targets")
            .select("assignment_id")
            .eq("student_id", userId)
            .in("assignment_id", subsetIds);
        targetedSubset = new Set((targets ?? []).map((t) => t.assignment_id));
    }
    const visible = assignments.filter(
        (a) => a.assigned_to_all || targetedSubset.has(a.id)
    );
    if (!visible.length) return [];

    // Student's results for the relevant quizzes (published = submitted, draft = in progress)
    const quizIds = [...new Set(visible.map((a) => a.quiz_id))];
    const [{ data: results }, { data: drafts }] = await Promise.all([
        supabase
            .from("test_results")
            .select("id, quiz_id, score, submitted_at")
            .eq("user_id", userId)
            .eq("status", "published")
            .not("submitted_at", "is", null)
            .in("quiz_id", quizIds)
            .order("submitted_at", { ascending: false }),
        supabase
            .from("test_results")
            .select("quiz_id")
            .eq("user_id", userId)
            .eq("status", "draft")
            .in("quiz_id", quizIds),
    ]);
    const draftQuizIds = new Set((drafts ?? []).map((d) => d.quiz_id));

    const now = nowIso();
    return visible.map((a) => {
        const classroom = (a.classrooms ?? {}) as { name?: string };
        const quiz = (a.quizzes ?? {}) as { title?: string; slug?: string; skill?: string };
        // latest qualifying result for this quiz, submitted after assignment
        const result = (results ?? []).find(
            (r) => r.quiz_id === a.quiz_id && new Date(r.submitted_at) >= new Date(a.created_at)
        );
        const status = deriveSubmissionStatus(a.due_at, result?.submitted_at ?? null, now);
        const submitted = status === "submitted" || status === "late";
        return {
            assignment_id: a.id,
            classroom_id: a.classroom_id,
            classroom_name: classroom.name ?? "",
            quiz_id: a.quiz_id,
            quiz_title: quiz.title ?? "",
            quiz_slug: quiz.slug ?? "",
            quiz_skill: quiz.skill ?? "",
            due_at: a.due_at,
            note: a.note,
            status,
            in_progress: !submitted && draftQuizIds.has(a.quiz_id),
            score: result?.score ?? null,
            submitted_at: result?.submitted_at ?? null,
            test_result_id: result?.id ?? null,
        };
    });
}

export async function getStudentDashboardStats(
    supabase: SupabaseClient,
    userId: string
): Promise<StudentDashboardStats> {
    const { count: joinedCount } = await supabase
        .from("classroom_members")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("role", "student")
        .eq("status", "active");

    const assignments = await getStudentAssignments(supabase, userId);
    const submitted = assignments.filter(
        (a) => a.status === "submitted" || a.status === "late"
    );
    const pending = assignments.filter(
        (a) => a.status === "pending" || a.status === "overdue"
    );
    const bands = submitted.map((a) => a.score).filter((s): s is number => s != null);
    const avg = bands.length
        ? Math.round((bands.reduce((n, s) => n + s, 0) / bands.length) * 10) / 10
        : null;

    return {
        joined_class_count: joinedCount ?? 0,
        total_assignments: assignments.length,
        pending_count: pending.length,
        submitted_count: submitted.length,
        avg_band: avg,
    };
}

/**
 * Count the real number of sub-questions in one DB question row.
 * Server-side port of src/shared/lib/countQuestion (which runs on the mapped
 * camelCase shape). Many question types store their items in matching/matrix/
 * checkbox containers rather than `list_of_questions`, so a naive length is wrong.
 */
function countQuestionRow(
    q: Record<string, unknown>,
    passageContent: string
): number {
    const gaps = (s: unknown) =>
        typeof s === "string" ? (s.match(/\{(.*?)\}/g) || []).length : 0;
    const type = (q.type as string) ?? "";

    // 1. Matching
    if (type === "matching") {
        const mq = safeParseJsonb<Record<string, unknown>>(q.matching_question);
        if (mq) {
            const layout = String(mq.layout_type ?? mq.layoutType ?? "")
                .trim()
                .toLowerCase();
            if (layout === "summary") {
                const g = gaps(mq.summary_text ?? mq.summaryText);
                if (g > 0) return g;
            }
            if (layout === "standard" || layout === "list") {
                const items = (mq.matching_items ?? mq.matchingItems) as unknown[] | undefined;
                if (items && items.length > 0) return items.length;
            }
            if (layout === "heading") {
                const g = gaps(passageContent);
                return g > 0 ? g : 1;
            }
        }
    }

    // 2. Matrix
    if (type === "matrix") {
        const mx = safeParseJsonb<Record<string, unknown>>(q.matrix_question);
        const items = (mx?.matrix_items ?? mx?.matrixItems) as unknown[] | undefined;
        if (items && items.length > 0) return items.length;
    }

    // 3. Gap-fill in the question text itself
    const gq = gaps(q.question_text);
    if (gq > 0) return gq;

    // 4. List of sub-questions
    const loq = safeParseJsonb<unknown[]>(q.list_of_questions);
    if (Array.isArray(loq) && loq.length > 0) return loq.length;

    // 5. Checkbox (count correct options, fallback to "choose N" hint)
    if (type === "checkbox") {
        const loo = safeParseJsonb<Array<{ correct?: unknown }>>(q.list_of_options) ?? [];
        const correctLen = loo.filter((o) => o.correct).length;
        return correctLen || 1;
    }

    // 6. Fallback: multiple explanations
    const ex = safeParseJsonb<unknown[]>(q.explanations);
    if (Array.isArray(ex) && ex.length > 1) return ex.length;

    return 1;
}

export async function getStudentAssignmentDetail(
    supabase: SupabaseClient,
    userId: string,
    assignmentId: string
): Promise<StudentAssignmentDetail | null> {
    const all = await getStudentAssignments(supabase, userId);
    const base = all.find((a) => a.assignment_id === assignmentId);
    if (!base) return null;

    const [quizRes, ownerRes, passagesRes, profileRes] = await Promise.all([
        supabase
            .from("quizzes")
            .select("time_minutes, type, pro_user_only, skill")
            .eq("id", base.quiz_id)
            .maybeSingle(),
        supabase
            .from("classrooms")
            .select("owner:users!classrooms_owner_id_fkey(name)")
            .eq("id", base.classroom_id)
            .maybeSingle(),
        supabase.from("passages").select("id, content").eq("quiz_id", base.quiz_id),
        supabase
            .from("users")
            .select("is_pro, pro_expiration_date, pro_skills, roles")
            .eq("id", userId)
            .maybeSingle(),
    ]);

    // Pro access: mirror takeTheTest() gating so the UI can block before navigating.
    const requiresPro = Boolean(quizRes.data?.pro_user_only);
    let hasAccess = true;
    if (requiresPro) {
        const p = profileRes.data;
        const isAdmin = isAdminRole(p?.roles);
        const isPro =
            isAdmin ||
            Boolean(
                p?.is_pro &&
                    p.pro_expiration_date &&
                    new Date(p.pro_expiration_date) > new Date()
            );
        const skillOk =
            isAdmin ||
            p?.pro_skills == null ||
            !Array.isArray(p?.pro_skills) ||
            p.pro_skills.includes(quizRes.data?.skill);
        hasAccess = isPro && skillOk;
    }

    let questionCount: number | null = null;
    const passages = passagesRes.data ?? [];
    if (passages.length) {
        const contentById = new Map(passages.map((p) => [p.id, p.content as string | null]));
        const { data: qs } = await supabase
            .from("questions")
            .select(
                "passage_id, type, question_text, instructions, list_of_questions, list_of_options, matching_question, matrix_question, explanations"
            )
            .in("passage_id", [...contentById.keys()]);
        questionCount = (qs ?? []).reduce(
            (n, q) => n + countQuestionRow(q, contentById.get(q.passage_id) ?? ""),
            0
        );
    }

    const owner = (ownerRes.data?.owner ?? null) as { name?: string | null } | null;

    return {
        ...base,
        quiz_time_minutes: quizRes.data?.time_minutes ?? null,
        quiz_type: quizRes.data?.type ?? null,
        question_count: questionCount,
        teacher_name: owner?.name ?? null,
        requires_pro: requiresPro,
        has_access: hasAccess,
    };
}

// ============================================================================
// Tracking
// ============================================================================

/**
 * Class tracking grid: every student × every assignment, status + score derived
 * from test_results. Powers "Tracking · Dashboard Lớp".
 */
export async function getClassroomTracking(
    supabase: SupabaseClient,
    classroomId: string
): Promise<{ assignments: AssignmentWithStats[]; rows: TrackingRow[] }> {
    const assignments = await getClassroomAssignments(supabase, classroomId);

    const { data: studentRows } = await supabase
        .from("classroom_members")
        .select("user_id, display_name, users(name, email, avatar_url, is_pro, pro_expiration_date)")
        .eq("classroom_id", classroomId)
        .eq("role", "student")
        .eq("status", "active")
        .order("joined_at", { ascending: true });
    const students = studentRows ?? [];

    if (!assignments.length || !students.length) {
        return { assignments, rows: [] };
    }

    const quizIds = [...new Set(assignments.map((a) => a.quiz_id))];
    const studentIds = students.map((s) => s.user_id);
    const { data: results } = await supabase
        .from("test_results")
        .select("user_id, quiz_id, score, submitted_at")
        .eq("status", "published")
        .not("submitted_at", "is", null)
        .in("quiz_id", quizIds)
        .in("user_id", studentIds)
        .order("submitted_at", { ascending: false });

    // Targets for subset assignments
    const { data: targets } = await supabase
        .from("classroom_assignment_targets")
        .select("assignment_id, student_id")
        .in(
            "assignment_id",
            assignments.map((a) => a.id)
        );
    const subsetTargets = new Map<string, Set<string>>();
    for (const t of targets ?? []) {
        const set = subsetTargets.get(t.assignment_id) ?? new Set<string>();
        set.add(t.student_id);
        subsetTargets.set(t.assignment_id, set);
    }

    const nowMs = Date.now();
    const now = nowIso();
    const rows: TrackingRow[] = students.map((s) => {
        const u = (s.users ?? {}) as {
            name?: string | null;
            email?: string;
            avatar_url?: string | null;
            is_pro?: boolean | null;
            pro_expiration_date?: string | null;
        };
        const isPro = Boolean(
            u.is_pro && u.pro_expiration_date && new Date(u.pro_expiration_date).getTime() > nowMs
        );
        const cells: TrackingCell[] = [];
        const bands: number[] = [];
        let submitted = 0;
        let applicable = 0;

        for (const a of assignments) {
            const targeted = a.assigned_to_all || subsetTargets.get(a.id)?.has(s.user_id);
            if (!targeted) continue;
            applicable += 1;

            const result = (results ?? []).find(
                (r) =>
                    r.quiz_id === a.quiz_id &&
                    r.user_id === s.user_id &&
                    new Date(r.submitted_at) >= new Date(a.created_at)
            );
            const status: SubmissionStatus = deriveSubmissionStatus(
                a.due_at,
                result?.submitted_at ?? null,
                now
            );
            if (isSubmitted(status)) submitted += 1;
            if (typeof result?.score === "number") bands.push(result.score);

            cells.push({
                assignment_id: a.id,
                quiz_id: a.quiz_id,
                status,
                score: result?.score ?? null,
                submitted_at: result?.submitted_at ?? null,
            });
        }

        return {
            student_id: s.user_id,
            name: (s.display_name as string | null) || u.name || null,
            email: u.email ?? "",
            avatar_url: u.avatar_url ?? null,
            is_pro: isPro,
            cells,
            submitted_count: submitted,
            total_count: applicable,
            average_band: bands.length
                ? Math.round((bands.reduce((x, y) => x + y, 0) / bands.length) * 10) / 10
                : null,
        };
    });

    return { assignments, rows };
}

export type StudentHistoryAttempt = {
    test_result_id: string;
    quiz_id: string;
    quiz_title: string;
    quiz_skill: string;
    quiz_source: string | null;
    quiz_type: string | null;
    score: number | null;
    /** correct answers (for practice "X/Y" display) */
    total_correct: number | null;
    total_questions: number | null;
    submitted_at: string | null;
    test_time: number | null;
    duration_min: number | null;
};

export type StudentHistory = {
    student: { id: string; name: string | null; email: string; avatar_url: string | null } | null;
    classroom_name: string;
    joined_at: string | null;
    avg_band: number | null;
    avg_duration_min: number | null;
    attempts: StudentHistoryAttempt[];
};

/** One student's attempt history within a class (the quizzes assigned there). */
export async function getStudentHistory(
    supabase: SupabaseClient,
    classroomId: string,
    studentId: string
): Promise<StudentHistory> {
    const { data: memberRow } = await supabase
        .from("classroom_members")
        .select("user_id, joined_at, display_name, users(name, email, avatar_url), classrooms(name)")
        .eq("classroom_id", classroomId)
        .eq("user_id", studentId)
        .eq("status", "active")
        .maybeSingle();

    const u = (memberRow?.users ?? null) as
        | { name?: string | null; email?: string; avatar_url?: string | null }
        | null;
    const cls = (memberRow?.classrooms ?? null) as { name?: string } | null;
    const student = memberRow
        ? {
              id: studentId,
              name: (memberRow.display_name as string | null) || u?.name || null,
              email: u?.email ?? "",
              avatar_url: u?.avatar_url ?? null,
          }
        : null;

    const empty: StudentHistory = {
        student,
        classroom_name: cls?.name ?? "",
        joined_at: memberRow?.joined_at ?? null,
        avg_band: null,
        avg_duration_min: null,
        attempts: [],
    };

    const { data: assignments } = await supabase
        .from("classroom_assignments")
        .select("quiz_id")
        .eq("classroom_id", classroomId);
    const quizIds = [...new Set((assignments ?? []).map((a) => a.quiz_id))];
    if (!quizIds.length) return empty;

    // Full quiz structure → recompute the score live (same as /test-result),
    // because stored totalCorrect/score can be stale from older scoring runs.
    const { data: quizFull } = await supabase
        .from("quizzes")
        .select(
            "id, type, passages(content, sort_order, start_question_number, questions(type, question_text, list_of_questions, list_of_options, explanations, matching_question, matrix_question, sort_order))"
        )
        .in("id", quizIds);
    const legacyByQuiz = new Map<string, ReturnType<typeof toLegacyQuizForScore>>();
    (quizFull ?? []).forEach((q) => legacyByQuiz.set(q.id, toLegacyQuizForScore(q)));

    const { data: results } = await supabase
        .from("test_results")
        .select("id, quiz_id, score, submitted_at, test_time, time_left, answers, test_part, quizzes(title, skill, source, type)")
        .eq("user_id", studentId)
        .eq("status", "published")
        .in("quiz_id", quizIds)
        .order("submitted_at", { ascending: false });

    const bands: number[] = [];
    const durations: number[] = [];
    const attempts: StudentHistoryAttempt[] = (results ?? []).map((r) => {
        const quiz = (r.quizzes ?? {}) as {
            title?: string;
            skill?: string;
            source?: string | null;
            type?: string | null;
        };
        const stored = safeParseJsonb<{ totalCorrect?: number; totalQuestions?: number }>(r.answers) ?? {};
        const legacy = legacyByQuiz.get(r.quiz_id);
        const sr = legacy
            ? calculateStoredScoreResult({ quiz: legacy, answers: r.answers, testPart: r.test_part })
            : null;
        const liveBand = sr ? Number(sr.score) : NaN;
        const totalCorrect = sr ? sr.correctAns : stored.totalCorrect ?? null;
        const totalQuestions = sr ? sr.total_questions : stored.totalQuestions ?? null;
        // Prefer the live band when it's valid (>0); else the stored score.
        const band =
            Number.isFinite(liveBand) && liveBand > 0
                ? liveBand
                : typeof r.score === "number"
                    ? r.score
                    : null;

        let durationMin: number | null = null;
        if (r.test_time) {
            let remaining = 0;
            if (r.time_left && /^\d+:\d+$/.test(r.time_left)) {
                const [m, s] = r.time_left.split(":").map(Number);
                remaining = m * 60 + s;
            }
            durationMin = Math.max(0, Math.round((r.test_time * 60 - remaining) / 60));
        }
        if (typeof band === "number") bands.push(band);
        if (durationMin != null) durations.push(durationMin);
        return {
            test_result_id: r.id,
            quiz_id: r.quiz_id,
            quiz_title: quiz.title ?? "",
            quiz_skill: quiz.skill ?? "",
            quiz_source: quiz.source ?? null,
            quiz_type: quiz.type ?? null,
            total_correct: typeof totalCorrect === "number" ? totalCorrect : null,
            total_questions: typeof totalQuestions === "number" ? totalQuestions : null,
            score: band,
            submitted_at: r.submitted_at,
            test_time: r.test_time,
            duration_min: durationMin,
        };
    });

    return {
        student,
        classroom_name: cls?.name ?? "",
        joined_at: memberRow?.joined_at ?? null,
        avg_band: bands.length
            ? Math.round((bands.reduce((x, y) => x + y, 0) / bands.length) * 10) / 10
            : null,
        avg_duration_min: durations.length
            ? Math.round(durations.reduce((x, y) => x + y, 0) / durations.length)
            : null,
        attempts,
    };
}
