/**
 * Classroom Admin Service — Vit IELTS
 *
 * Cross-cutting queries for the CMS admin (manage all classes, teachers,
 * students). Pass `supabaseAdmin` so RLS is bypassed. Separate from
 * services/classroom.ts (which is membership-scoped for the public app).
 */

import { SupabaseClient } from "@supabase/supabase-js";
import { parseRoles } from "../lib/parseRoles";
import type { ClassroomStatus } from "./types/classroom";

export type AdminClassroomRow = {
    id: string;
    name: string;
    description: string | null;
    invite_code: string;
    status: ClassroomStatus;
    created_at: string;
    owner_id: string;
    owner_name: string | null;
    owner_email: string;
    student_count: number;
    teacher_count: number;
    assignment_count: number;
};

export type AdminTeacherRow = {
    id: string;
    name: string | null;
    email: string;
    avatar_url: string | null;
    created_at: string;
    owned_count: number;
    teaching_count: number;
};

export type AdminStudentRow = {
    id: string;
    name: string | null;
    email: string;
    avatar_url: string | null;
    class_count: number;
    classes: { id: string; name: string }[];
};

// ----------------------------------------------------------------------------
// Classrooms
// ----------------------------------------------------------------------------

export async function adminListClassrooms(
    supabase: SupabaseClient,
    filters: { search?: string; status?: ClassroomStatus | "all" } = {}
): Promise<AdminClassroomRow[]> {
    let query = supabase
        .from("classrooms")
        .select("*, owner:users!classrooms_owner_id_fkey(name, email)")
        .order("created_at", { ascending: false });

    if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,invite_code.ilike.%${filters.search}%`);
    }
    if (filters.status && filters.status !== "all") {
        query = query.eq("status", filters.status);
    }

    const { data: classrooms, error } = await query;
    if (error) throw error;
    if (!classrooms?.length) return [];

    const ids = classrooms.map((c) => c.id);
    const [membersRes, assignmentsRes] = await Promise.all([
        supabase
            .from("classroom_members")
            .select("classroom_id, role")
            .eq("status", "active")
            .in("classroom_id", ids),
        supabase.from("classroom_assignments").select("classroom_id").in("classroom_id", ids),
    ]);

    const students = new Map<string, number>();
    const teachers = new Map<string, number>();
    for (const m of membersRes.data ?? []) {
        const bucket = m.role === "teacher" ? teachers : students;
        bucket.set(m.classroom_id, (bucket.get(m.classroom_id) ?? 0) + 1);
    }
    const assignments = new Map<string, number>();
    for (const a of assignmentsRes.data ?? []) {
        assignments.set(a.classroom_id, (assignments.get(a.classroom_id) ?? 0) + 1);
    }

    return classrooms.map((c) => {
        const owner = (c.owner ?? {}) as { name?: string | null; email?: string };
        return {
            id: c.id,
            name: c.name,
            description: c.description,
            invite_code: c.invite_code,
            status: c.status,
            created_at: c.created_at,
            owner_id: c.owner_id,
            owner_name: owner.name ?? null,
            owner_email: owner.email ?? "",
            student_count: students.get(c.id) ?? 0,
            teacher_count: teachers.get(c.id) ?? 0,
            assignment_count: assignments.get(c.id) ?? 0,
        };
    });
}

export async function adminGetClassroomDetail(
    supabase: SupabaseClient,
    classroomId: string
) {
    const { data: classroom, error } = await supabase
        .from("classrooms")
        .select("*, owner:users!classrooms_owner_id_fkey(name, email)")
        .eq("id", classroomId)
        .maybeSingle();
    if (error) throw error;
    if (!classroom) return null;

    const { data: members } = await supabase
        .from("classroom_members")
        .select("id, user_id, role, joined_at, users(name, email, avatar_url)")
        .eq("classroom_id", classroomId)
        .eq("status", "active")
        .order("joined_at", { ascending: true });

    const { data: assignments } = await supabase
        .from("classroom_assignments")
        .select("id, due_at, note, assigned_to_all, created_at, quizzes(title, skill)")
        .eq("classroom_id", classroomId)
        .order("created_at", { ascending: false });

    return {
        classroom,
        members: (members ?? []).map((m) => {
            const u = (m.users ?? {}) as { name?: string | null; email?: string; avatar_url?: string | null };
            return {
                id: m.id,
                user_id: m.user_id,
                role: m.role,
                joined_at: m.joined_at,
                name: u.name ?? null,
                email: u.email ?? "",
                avatar_url: u.avatar_url ?? null,
            };
        }),
        assignments: (assignments ?? []).map((a) => {
            const q = (a.quizzes ?? {}) as { title?: string; skill?: string };
            return {
                id: a.id,
                due_at: a.due_at,
                note: a.note,
                assigned_to_all: a.assigned_to_all,
                created_at: a.created_at,
                quiz_title: q.title ?? "",
                quiz_skill: q.skill ?? "",
            };
        }),
    };
}

export async function adminDeleteClassroom(
    supabase: SupabaseClient,
    classroomId: string
): Promise<void> {
    const { error } = await supabase.from("classrooms").delete().eq("id", classroomId);
    if (error) throw error;
}

export async function adminSetClassroomStatus(
    supabase: SupabaseClient,
    classroomId: string,
    status: ClassroomStatus
): Promise<void> {
    const { error } = await supabase
        .from("classrooms")
        .update({ status })
        .eq("id", classroomId);
    if (error) throw error;
}

// ----------------------------------------------------------------------------
// Teachers
// ----------------------------------------------------------------------------

export async function adminListTeachers(
    supabase: SupabaseClient,
    filters: { search?: string } = {}
): Promise<AdminTeacherRow[]> {
    let query = supabase
        .from("users")
        .select("id, name, email, avatar_url, created_at")
        // roles is JSONB — use the json-array string form for containment
        // (the JS-array form serializes to `{teacher}` which isn't valid JSON)
        .filter("roles", "cs", JSON.stringify(["teacher"]))
        .order("created_at", { ascending: false });

    if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
    }

    const { data: teachers, error } = await query;
    if (error) throw error;
    if (!teachers?.length) return [];

    const ids = teachers.map((t) => t.id);
    const [ownedRes, teachingRes] = await Promise.all([
        supabase.from("classrooms").select("owner_id").in("owner_id", ids),
        supabase
            .from("classroom_members")
            .select("user_id")
            .eq("role", "teacher")
            .in("user_id", ids),
    ]);

    const owned = new Map<string, number>();
    for (const c of ownedRes.data ?? []) owned.set(c.owner_id, (owned.get(c.owner_id) ?? 0) + 1);
    const teaching = new Map<string, number>();
    for (const m of teachingRes.data ?? [])
        teaching.set(m.user_id, (teaching.get(m.user_id) ?? 0) + 1);

    return teachers.map((t) => ({
        id: t.id,
        name: t.name,
        email: t.email,
        avatar_url: t.avatar_url,
        created_at: t.created_at,
        owned_count: owned.get(t.id) ?? 0,
        teaching_count: teaching.get(t.id) ?? 0,
    }));
}

/** Grant the global teacher role to a user identified by email. */
export async function adminGrantTeacherByEmail(
    supabase: SupabaseClient,
    email: string
): Promise<{ id: string; email: string }> {
    const { data: user, error } = await supabase
        .from("users")
        .select("id, email, roles")
        .ilike("email", email.trim())
        .maybeSingle();
    if (error) throw error;
    if (!user) throw new Error("USER_NOT_FOUND");

    const roles = new Set(parseRoles(user.roles));
    roles.add("teacher");
    const { error: updateError } = await supabase
        .from("users")
        .update({ roles: Array.from(roles) })
        .eq("id", user.id);
    if (updateError) throw updateError;

    return { id: user.id, email: user.email };
}

// ----------------------------------------------------------------------------
// Students
// ----------------------------------------------------------------------------

export async function adminListStudents(
    supabase: SupabaseClient,
    filters: { search?: string } = {}
): Promise<AdminStudentRow[]> {
    // Student memberships joined with their user + class
    const { data: rows, error } = await supabase
        .from("classroom_members")
        .select("user_id, users(name, email, avatar_url), classrooms(id, name)")
        .eq("role", "student")
        .eq("status", "active");
    if (error) throw error;

    const byStudent = new Map<string, AdminStudentRow>();
    for (const r of rows ?? []) {
        const u = (r.users ?? {}) as { name?: string | null; email?: string; avatar_url?: string | null };
        const cls = (r.classrooms ?? {}) as { id?: string; name?: string };
        if (filters.search) {
            const q = filters.search.toLowerCase();
            const hay = `${u.name ?? ""} ${u.email ?? ""}`.toLowerCase();
            if (!hay.includes(q)) continue;
        }
        const existing = byStudent.get(r.user_id);
        const klass = cls.id ? { id: cls.id, name: cls.name ?? "" } : null;
        if (existing) {
            if (klass) {
                existing.classes.push(klass);
                existing.class_count = existing.classes.length;
            }
        } else {
            byStudent.set(r.user_id, {
                id: r.user_id,
                name: u.name ?? null,
                email: u.email ?? "",
                avatar_url: u.avatar_url ?? null,
                class_count: klass ? 1 : 0,
                classes: klass ? [klass] : [],
            });
        }
    }

    return Array.from(byStudent.values()).sort((a, b) =>
        (a.name ?? a.email).localeCompare(b.name ?? b.email)
    );
}
