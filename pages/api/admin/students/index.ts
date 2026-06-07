import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "~supabase/admin";
import { requireAdmin } from "~lib/admin-auth";
import { adminListStudents } from "~services/classroom-admin";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const admin = await requireAdmin(req, res);
    if (!admin) return;

    if (req.method !== "GET") {
        return res.status(405).json({ success: false, error: "Method not allowed" });
    }

    try {
        const { search } = req.query;
        const data = await adminListStudents(supabaseAdmin, {
            search: typeof search === "string" ? search : undefined,
        });
        return res.status(200).json({ success: true, data });
    } catch (error) {
        console.error("[API /api/admin/students]", error);
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : "Internal error",
        });
    }
}
