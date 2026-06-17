import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "~supabase/admin";
import { createApiSupabase } from "~supabase/server";
import { createNotification } from "~services/notification";

/**
 * Notify students that a new assignment was created.
 *
 * POST /api/classroom/notify-assignment
 *   body: { classroomId: string, studentIds?: string[] | null, count?: number }
 *
 * Additive to the assignment-creation flow: the client calls this after
 * `createAssignments` succeeds. The caller must be a teacher of the classroom.
 * Notifications are created via the admin client and respect each student's
 * `studyReminders` preference (handled inside createNotification).
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        return res.status(405).json({ success: false, error: "Method not allowed" });
    }

    try {
        const supabase = createApiSupabase(req, res);
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();
        if (authError || !user) {
            return res.status(401).json({ success: false, error: "Vui lòng đăng nhập" });
        }

        const { classroomId, studentIds, count } = req.body as {
            classroomId?: string;
            studentIds?: string[] | null;
            count?: number;
        };
        if (!classroomId) {
            return res.status(400).json({ success: false, error: "Missing classroomId" });
        }

        // Authorize: caller must be a teacher of this classroom.
        const { data: membership } = await supabaseAdmin
            .from("classroom_members")
            .select("role")
            .eq("classroom_id", classroomId)
            .eq("user_id", user.id)
            .maybeSingle();
        if (!membership || membership.role !== "teacher") {
            return res.status(403).json({ success: false, error: "Không có quyền" });
        }

        // Resolve recipient students: explicit subset, else all students in class.
        let recipientIds: string[];
        if (Array.isArray(studentIds) && studentIds.length > 0) {
            recipientIds = studentIds;
        } else {
            const { data: members } = await supabaseAdmin
                .from("classroom_members")
                .select("user_id")
                .eq("classroom_id", classroomId)
                .eq("role", "student");
            recipientIds = (members ?? []).map((m) => m.user_id as string);
        }

        // Classroom name for the message.
        const { data: classroom } = await supabaseAdmin
            .from("classrooms")
            .select("name")
            .eq("id", classroomId)
            .maybeSingle();
        const className = classroom?.name ?? "lớp học";
        const n = typeof count === "number" && count > 0 ? count : 1;

        await Promise.all(
            recipientIds.map((studentId) =>
                createNotification(supabaseAdmin, {
                    userId: studentId,
                    title: "Bài tập mới",
                    message: `Bạn được giao ${n} bài tập mới trong "${className}".`,
                    type: "info",
                    category: "classroom",
                    entityId: classroomId,
                    link: "/classroom/my-assignments",
                }).catch((err) => {
                    console.error("[notify-assignment] create failed", err);
                    return null;
                }),
            ),
        );

        return res.status(200).json({ success: true, notified: recipientIds.length });
    } catch (error) {
        console.error("[API /api/classroom/notify-assignment]", error);
        return res.status(500).json({ success: false, error: "Failed to notify" });
    }
}
