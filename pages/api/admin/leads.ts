import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "~supabase/admin";
import { requireAdmin } from "~lib/admin-auth";
import { listLeads, updateLeadStatus, deleteLead, type LeadStatus } from "~services/lead";

const STATUSES: LeadStatus[] = ["new", "contacted", "converted", "spam"];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const user = await requireAdmin(req, res);
    if (!user) return;

    if (req.method === "GET") {
        try {
            const data = await listLeads(supabaseAdmin);
            return res.status(200).json({ success: true, data });
        } catch (error) {
            return res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Internal error" });
        }
    }

    if (req.method === "PUT") {
        try {
            const { id, status } = req.body as { id?: string; status?: LeadStatus };
            if (!id || !status || !STATUSES.includes(status)) {
                return res.status(400).json({ success: false, error: "Missing or invalid id/status" });
            }
            await updateLeadStatus(supabaseAdmin, id, status);
            return res.status(200).json({ success: true });
        } catch (error) {
            return res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Internal error" });
        }
    }

    if (req.method === "DELETE") {
        try {
            const id = req.query.id as string;
            if (!id) return res.status(400).json({ success: false, error: "Missing id" });
            await deleteLead(supabaseAdmin, id);
            return res.status(200).json({ success: true });
        } catch (error) {
            return res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Internal error" });
        }
    }

    return res.status(405).json({ success: false, error: "Method not allowed" });
}
