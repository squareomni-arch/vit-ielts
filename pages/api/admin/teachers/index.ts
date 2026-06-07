import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "~supabase/admin";
import { requireAdmin } from "~lib/admin-auth";
import { adminListTeachers, adminGrantTeacherByEmail } from "~services/classroom-admin";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const admin = await requireAdmin(req, res);
    if (!admin) return;

    try {
        if (req.method === "GET") {
            const { search } = req.query;
            const data = await adminListTeachers(supabaseAdmin, {
                search: typeof search === "string" ? search : undefined,
            });
            return res.status(200).json({ success: true, data });
        }

        if (req.method === "POST") {
            const { email } = req.body ?? {};
            if (!email || typeof email !== "string") {
                return res.status(400).json({ success: false, error: "Missing email" });
            }
            try {
                const user = await adminGrantTeacherByEmail(supabaseAdmin, email);
                return res.status(200).json({
                    success: true,
                    message: `Đã cấp quyền Giáo viên cho ${user.email}`,
                });
            } catch (e) {
                if (e instanceof Error && e.message === "USER_NOT_FOUND") {
                    return res
                        .status(404)
                        .json({ success: false, error: "Không tìm thấy người dùng với email này." });
                }
                throw e;
            }
        }

        return res.status(405).json({ success: false, error: "Method not allowed" });
    } catch (error) {
        console.error("[API /api/admin/teachers]", error);
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : "Internal error",
        });
    }
}
