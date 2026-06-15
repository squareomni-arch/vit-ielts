import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Service role client — bypasses RLS
// ⚠️ ONLY USE IN API ROUTES (server-side)
//
// Lazily instantiated: `createClient` throws synchronously if the service-role
// key is missing. Doing that at module-load time would crash EVERY route that
// imports this module (e.g. via rate-limit) the instant it's required — even in
// mock-only deployments that never touch the real DB. Defer creation to first
// use so the import is always safe; callers that actually hit the admin client
// without a configured key will get the error at call time, where it can be
// caught (rate-limit falls back to in-memory, etc.).
let _client: SupabaseClient | null = null;

function getSupabaseAdmin(): SupabaseClient {
    if (_client) return _client;
    _client = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            global: {
                headers: {
                    "ngrok-skip-browser-warning": "true",
                },
            },
        }
    );
    return _client;
}

// Proxy preserves the existing `supabaseAdmin.xxx` call sites (127 files) while
// deferring the real client creation until a property is actually accessed.
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
    get(_target, prop, receiver) {
        const client = getSupabaseAdmin();
        const value = Reflect.get(client as object, prop, receiver);
        return typeof value === "function" ? value.bind(client) : value;
    },
});
