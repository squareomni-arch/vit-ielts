import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "~supabase/admin";
import { requireAdmin } from "~lib/admin-auth";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    const user = await requireAdmin(req, res);
    if (!user) return;

    if (req.method === "GET") {
        try {
            const {
                search,
                isPro,
                role,
                proStatus,      // "active" | "expired" | "never"
                dateFrom,       // ISO date string
                dateTo,         // ISO date string
                page = "1",
                pageSize = "20",
                sort,
                order,
            } = req.query;

            const pageNum = parseInt(page as string, 10) || 1;
            const size = parseInt(pageSize as string, 10) || 20;
            const from = (pageNum - 1) * size;
            const to = from + size - 1;

            let query = supabaseAdmin
                .from("users")
                .select(
                    "id, email, name, avatar_url, is_pro, pro_expiration_date, roles, created_at",
                    { count: "exact" }
                );

            // ── Search by name or email ──
            if (search && typeof search === "string") {
                query = query.or(
                    `name.ilike.%${search}%,email.ilike.%${search}%`
                );
            }

            // ── Filter by Pro status (boolean) ──
            if (isPro === "true") {
                query = query.eq("is_pro", true);
            } else if (isPro === "false") {
                query = query.eq("is_pro", false);
            }

            // ── Filter by Role ──
            if (role && typeof role === "string" && role !== "all") {
                // Supabase stores roles as jsonb array — use contains
                if (role === "administrator") {
                    query = query.contains("roles", ["administrator"]);
                } else if (role === "subscriber") {
                    // Users who are NOT administrator
                    // We filter by not containing "administrator"
                    // Supabase doesn't have "not contains" for jsonb easily,
                    // so we use a workaround: filter roles that contain subscriber
                    // or use raw filter
                    query = query.not("roles", "cs", '["administrator"]');
                }
            }

            // ── Filter by Pro expiration status ──
            if (proStatus && typeof proStatus === "string") {
                const now = new Date().toISOString();
                if (proStatus === "active") {
                    // Pro is true AND expiration is in the future
                    query = query
                        .eq("is_pro", true)
                        .gt("pro_expiration_date", now);
                } else if (proStatus === "expired") {
                    // Pro expiration date is in the past (regardless of is_pro)
                    query = query
                        .not("pro_expiration_date", "is", null)
                        .lt("pro_expiration_date", now);
                } else if (proStatus === "never") {
                    // Never had pro — no expiration date at all
                    query = query.is("pro_expiration_date", null);
                }
            }

            // ── Filter by registration date range ──
            if (dateFrom && typeof dateFrom === "string") {
                query = query.gte("created_at", dateFrom);
            }
            if (dateTo && typeof dateTo === "string") {
                // Add a day to make the range inclusive
                const endDate = new Date(dateTo);
                endDate.setDate(endDate.getDate() + 1);
                query = query.lt("created_at", endDate.toISOString());
            }

            // ── Sort ──
            const sortField = (sort as string) || "created_at";
            const sortOrder = (order as string) === "asc" ? true : false;
            query = query.order(sortField, { ascending: sortOrder });

            // ── Pagination ──
            query = query.range(from, to);

            const { data, error, count } = await query;

            if (error) throw error;

            return res.status(200).json({
                success: true,
                data: data ?? [],
                count: count ?? 0,
                page: pageNum,
                pageSize: size,
                totalPages: Math.ceil((count ?? 0) / size),
            });
        } catch (error) {
            console.error("[API /api/admin/users]", error);
            return res.status(500).json({
                success: false,
                error:
                    error instanceof Error ? error.message : "Internal error",
            });
        }
    }

    return res
        .status(405)
        .json({ success: false, error: "Method not allowed" });
}
