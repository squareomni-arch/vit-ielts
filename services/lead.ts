/**
 * Lead Service — landing-page lead form submissions (`landing_leads`).
 *
 * Like every service here it takes a Supabase client as the first arg. Writes
 * happen via supabaseAdmin (the table is service_role-only — see migration 035).
 */

import { SupabaseClient } from "@supabase/supabase-js";

export type LeadStatus = "new" | "contacted" | "converted" | "spam";

export type Lead = {
    id: string;
    name: string;
    phone: string;
    target_band: string | null;
    source: string;
    status: LeadStatus;
    note: string | null;
    created_at: string;
};

export type NewLead = {
    name: string;
    phone: string;
    target?: string | null;
    source?: string;
};

export async function createLead(client: SupabaseClient, lead: NewLead): Promise<Lead> {
    const { data, error } = await client
        .from("landing_leads")
        .insert({
            name: lead.name,
            phone: lead.phone,
            target_band: lead.target ?? null,
            source: lead.source ?? "landing",
        })
        .select()
        .single();
    if (error) throw error;
    return data as Lead;
}

export async function listLeads(client: SupabaseClient): Promise<Lead[]> {
    const { data, error } = await client
        .from("landing_leads")
        .select("*")
        .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Lead[];
}

export async function updateLeadStatus(
    client: SupabaseClient,
    id: string,
    status: LeadStatus,
): Promise<void> {
    const { error } = await client.from("landing_leads").update({ status }).eq("id", id);
    if (error) throw error;
}

export async function deleteLead(client: SupabaseClient, id: string): Promise<void> {
    const { error } = await client.from("landing_leads").delete().eq("id", id);
    if (error) throw error;
}
