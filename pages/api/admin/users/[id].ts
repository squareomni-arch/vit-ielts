import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "~supabase/admin";
import { requireAdmin } from "~lib/admin-auth";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    const user = await requireAdmin(req, res);
    if (!user) return;

    const { id } = req.query;

    if (!id || typeof id !== "string") {
        return res.status(400).json({ success: false, error: "Missing user ID" });
    }

    if (req.method === "GET") {
        try {
            // Get user profile
            const { data: user, error: userError } = await supabaseAdmin
                .from("users")
                .select("*")
                .eq("id", id)
                .single();

            if (userError) throw userError;
            if (!user) return res.status(404).json({ success: false, error: "User not found" });

            // Get test results (last 20)
            const { data: testResults } = await supabaseAdmin
                .from("test_results")
                .select("id, quiz_id, score, status, time_left, test_time, submitted_at, created_at, quizzes(id, title, slug, skill, type)")
                .eq("user_id", id)
                .order("created_at", { ascending: false })
                .limit(20);

            // Get orders
            const { data: orders } = await supabaseAdmin
                .from("orders")
                .select("*")
                .eq("user_id", id)
                .order("created_at", { ascending: false })
                .limit(20);

            return res.status(200).json({
                success: true,
                data: {
                    user,
                    testResults: testResults ?? [],
                    orders: orders ?? [],
                },
            });
        } catch (error) {
            console.error(`[API /api/admin/users/${id}]`, error);
            return res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : "Internal error",
            });
        }
    }

    if (req.method === "PUT") {
        try {
            const { name, avatar_url, gender, date_of_birth, phone_number, is_pro, roles } = req.body;

            const updateData: Record<string, unknown> = {};
            if (name !== undefined) updateData.name = name;
            if (avatar_url !== undefined) updateData.avatar_url = avatar_url;
            if (gender !== undefined) updateData.gender = gender;
            if (date_of_birth !== undefined) updateData.date_of_birth = date_of_birth;
            if (phone_number !== undefined) updateData.phone_number = phone_number;
            if (is_pro !== undefined) updateData.is_pro = is_pro;
            if (roles !== undefined) updateData.roles = roles;

            const { data, error } = await supabaseAdmin
                .from("users")
                .update(updateData)
                .eq("id", id)
                .select()
                .single();

            if (error) throw error;

            return res.status(200).json({ success: true, data });
        } catch (error) {
            console.error(`[API /api/admin/users/${id}] PUT`, error);
            return res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : "Internal error",
            });
        }
    }

    if (req.method === "DELETE") {
        try {
            // Delete from Supabase Auth (this usually cascades to public.users but we do both to be safe)
            const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);
            if (authError) throw authError;

            const { error } = await supabaseAdmin
                .from("users")
                .delete()
                .eq("id", id);

            if (error) {
                console.warn(`[API /api/admin/users/${id}] Failed to delete from public.users, may have cascaded`, error);
            }

            return res.status(200).json({ success: true, message: "User deleted" });
        } catch (error) {
            console.error(`[API /api/admin/users/${id}] DELETE`, error);
            return res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : "Internal error",
            });
        }
    }

    return res.status(405).json({ success: false, error: "Method not allowed" });
}
