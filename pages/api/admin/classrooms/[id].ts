import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "~supabase/admin";
import { requireAdmin } from "~lib/admin-auth";
import {
    adminGetClassroomDetail,
    adminDeleteClassroom,
    adminSetClassroomStatus,
} from "~services/classroom-admin";
import type { ClassroomStatus } from "~services/types/classroom";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const admin = await requireAdmin(req, res);
    if (!admin) return;

    const { id } = req.query;
    if (!id || typeof id !== "string") {
        return res.status(400).json({ success: false, error: "Missing classroom ID" });
    }

    try {
        if (req.method === "GET") {
            const data = await adminGetClassroomDetail(supabaseAdmin, id);
            if (!data) return res.status(404).json({ success: false, error: "Not found" });
            return res.status(200).json({ success: true, data });
        }

        if (req.method === "PATCH") {
            const status = req.body?.status as ClassroomStatus;
            if (status !== "active" && status !== "closed") {
                return res.status(400).json({ success: false, error: "Invalid status" });
            }
            await adminSetClassroomStatus(supabaseAdmin, id, status);
            return res.status(200).json({
                success: true,
                message: status === "closed" ? "Đã đóng lớp" : "Đã mở lại lớp",
            });
        }

        if (req.method === "DELETE") {
            await adminDeleteClassroom(supabaseAdmin, id);
            return res.status(200).json({ success: true, message: "Đã xóa lớp" });
        }

        return res.status(405).json({ success: false, error: "Method not allowed" });
    } catch (error) {
        console.error(`[API /api/admin/classrooms/${id}]`, error);
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : "Internal error",
        });
    }
}
