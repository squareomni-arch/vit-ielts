import { createBrowserClient } from "@supabase/ssr";

type BrowserClient = ReturnType<typeof createBrowserClient>;

let cachedClient: BrowserClient | undefined;

const clientOptions = {
  global: {
    headers: {
      "ngrok-skip-browser-warning": "true",
    },
  },
};

/**
 * Browser Supabase client.
 *
 * Cached as a singleton on the browser so every component shares the same
 * auth state and storage subscription. Creating multiple instances causes
 * token-refresh races (two clients try to refresh the same refresh_token at
 * the same time, one wins and the other gets `invalid_refresh_token`, which
 * dumps the user back to the login screen).
 */
export function createClient(): BrowserClient {
  if (typeof window === "undefined") {
    // SSR / build: do not cache — each request gets its own instance.
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      clientOptions
    );
  }
  if (!cachedClient) {
    cachedClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      clientOptions
    );
  }
  return cachedClient;
}
