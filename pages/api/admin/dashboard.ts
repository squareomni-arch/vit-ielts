import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "~supabase/admin";
import { requireAdmin } from "~lib/admin-auth";

type ResponseData = {
    success: boolean;
    data?: {
        totalUsers: number;
        proUsers: number;
        todayUsers: number;
        totalTestsTaken: number;
        monthlyRevenue: number;
        recentOrders: unknown[];
        topQuizzes: unknown[];
    };
    error?: string;
};

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ResponseData>
) {
    if (req.method !== "GET") {
        return res.status(405).json({ success: false, error: "Method not allowed" });
    }

    try {
        // Admin auth check
        const user = await requireAdmin(req, res);
        if (!user) return;
        // Today start (UTC)
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayISO = todayStart.toISOString();

        // Current month start
        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);
        const monthISO = monthStart.toISOString();

        // Concurrent queries for dashboard stats
        const [
            totalUsersRes,
            proUsersRes,
            todayUsersRes,
            totalTestsRes,
            revenueRes,
            recentOrdersRes,
            topQuizzesRes,
        ] = await Promise.all([
            // Total users
            supabaseAdmin
                .from("users")
                .select("id", { count: "exact", head: true }),

            // Pro users
            supabaseAdmin
                .from("users")
                .select("id", { count: "exact", head: true })
                .eq("is_pro", true),

            // Today new users
            supabaseAdmin
                .from("users")
                .select("id", { count: "exact", head: true })
                .gte("created_at", todayISO),

            // Total tests taken (sum of tests_taken across all quizzes)
            supabaseAdmin
                .from("quizzes")
                .select("tests_taken"),

            // Monthly revenue (completed orders this month)
            supabaseAdmin
                .from("orders")
                .select("amount")
                .eq("status", "completed")
                .gte("created_at", monthISO),

            // Recent orders (last 5)
            supabaseAdmin
                .from("orders")
                .select("order_id, user_id, package_type, amount, status, created_at")
                .order("created_at", { ascending: false })
                .limit(5),

            // Top 10 quizzes by tests_taken
            supabaseAdmin
                .from("quizzes")
                .select("id, title, slug, skill, type, tests_taken, status")
                .order("tests_taken", { ascending: false })
                .limit(10),
        ]);

        // Calculate total tests taken
        const totalTestsTaken = totalTestsRes.data
            ? totalTestsRes.data.reduce((sum: number, q: { tests_taken: number }) => sum + (q.tests_taken || 0), 0)
            : 0;

        // Calculate monthly revenue
        const monthlyRevenue = revenueRes.data
            ? revenueRes.data.reduce((sum: number, o: { amount: number }) => sum + (o.amount || 0), 0)
            : 0;

        // Enrich recent orders with user emails
        const recentOrders = recentOrdersRes.data ?? [];
        const enrichedOrders = await Promise.all(
            recentOrders.map(async (order: Record<string, unknown>) => {
                if (order.user_id) {
                    const { data: user } = await supabaseAdmin
                        .from("users")
                        .select("email, name")
                        .eq("id", order.user_id as string)
                        .maybeSingle();
                    return { ...order, user_email: user?.email ?? null, user_name: user?.name ?? null };
                }
                return { ...order, user_email: null, user_name: null };
            })
        );

        return res.status(200).json({
            success: true,
            data: {
                totalUsers: totalUsersRes.count ?? 0,
                proUsers: proUsersRes.count ?? 0,
                todayUsers: todayUsersRes.count ?? 0,
                totalTestsTaken,
                monthlyRevenue,
                recentOrders: enrichedOrders,
                topQuizzes: topQuizzesRes.data ?? [],
            },
        });
    } catch (error) {
        console.error("[API /api/admin/dashboard]", error);
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : "Internal error",
        });
    }
}
