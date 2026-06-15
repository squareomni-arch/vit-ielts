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
function mockClientAuth(client: any) {
  // Mock mode (NEXT_PUBLIC_MOCK_DB) mocks DATA at the service layer only (see
  // services/*). Auth intentionally flows through the real (local) Supabase so
  // login / sign-up / sign-out actually work and persist. This previously faked
  // an always-signed-in user, which (a) disagreed with getMasterData's
  // cookie-gated viewer and (b) made the guest-only /account/login & /register
  // pages unreachable. Kept as a pass-through hook for future use.
  return client;
}

export function createClient(): BrowserClient {
  if (typeof window === "undefined") {
    // SSR / build: do not cache — each request gets its own instance.
    return mockClientAuth(createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      clientOptions
    ));
  }
  if (!cachedClient) {
    cachedClient = mockClientAuth(createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      clientOptions
    ));
  }
  return cachedClient;
}

