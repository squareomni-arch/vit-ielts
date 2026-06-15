import { createBrowserClient } from "@supabase/ssr";

// Separate singleton for admin — isolated from the regular user session.
// Uses cookieOptions.name = 'sb-admin-auth' so admin cookies are stored under
// a different key than the user's default 'sb-<project-ref>-auth-token'.
let cachedAdminBrowserClient: ReturnType<typeof createBrowserClient> | null = null;

export function createAdminClient() {
  if (!cachedAdminBrowserClient) {
    cachedAdminBrowserClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        isSingleton: false, // Prevent sharing the module-level singleton with the user client
        cookieOptions: { name: "sb-admin-auth" },
        global: {
          headers: {
            "ngrok-skip-browser-warning": "true",
          },
        },
      }
    );
  }
  return cachedAdminBrowserClient;
}
