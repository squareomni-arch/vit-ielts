import { createClient, SupabaseClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";

// E2E runs against the LOCAL stack; credentials live in .env.local.
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

/**
 * Service-role client (bypasses RLS). For test setup/cleanup ONLY — never
 * import into app code. Mirrors the pattern in tests/fixtures/supabase-live.ts.
 */
export const supabaseAdmin: SupabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

/** Looks up an auth user id by email (paginates the admin list). */
export async function findAuthUserIdByEmail(
  email: string
): Promise<string | null> {
  const target = email.toLowerCase();
  for (let page = 1; page <= 10; page++) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (error) throw error;
    const match = data.users.find((u) => u.email?.toLowerCase() === target);
    if (match) return match.id;
    if (data.users.length < 200) break;
  }
  return null;
}

/**
 * Deletes a test-created user (auth + `users` row). Safe to call even if the
 * user doesn't exist. Use in afterEach to keep the local DB clean.
 */
export async function deleteUserByEmail(email: string): Promise<void> {
  const id = await findAuthUserIdByEmail(email);
  if (!id) return;
  await supabaseAdmin.from("users").delete().eq("id", id);
  await supabaseAdmin.auth.admin.deleteUser(id);
}

/** Unique email for a single test run, e.g. e2e+1718...@vit.test */
export function uniqueTestEmail(prefix = "e2e"): string {
  return `${prefix}+${Date.now()}${Math.floor(Math.random() * 1000)}@vit.test`;
}

/**
 * Creates a throwaway, email-confirmed user (auth + `users` row) that can log
 * in immediately via the UI. Use for tests that must not disturb the shared
 * `devtest` session — e.g. logout, which calls a global signOut. Returns the
 * credentials; pair with deleteUserByEmail() in afterEach.
 */
export async function createConfirmedUser(
  name = "E2E Throwaway"
): Promise<{ email: string; password: string }> {
  const email = uniqueTestEmail("e2e-logout");
  const password = "E2ePass!23";
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name },
  });
  if (error) throw error;
  if (data.user) {
    await supabaseAdmin
      .from("users")
      .insert({ id: data.user.id, email, name })
      .select()
      .maybeSingle();
  }
  return { email, password };
}

/**
 * Idempotently ensures a dedicated teacher account exists with a known
 * password and the `teacher` role (so isTeacherRole → true). Reusable across
 * runs; not deleted (it's a stable local fixture). Returns the credentials.
 */
export async function ensureTeacherUser(): Promise<{
  email: string;
  password: string;
}> {
  const email = "e2e-teacher@vit.test";
  const password = "E2eTeach!23";
  const name = "E2E Teacher";

  // NOTE: never reset the password for an existing user — admin.updateUserById
  // with a password revokes active sessions, which would log out a teacher
  // spec running concurrently. The password is fixed in code, so the value set
  // at creation stays valid across runs.
  let id = await findAuthUserIdByEmail(email);
  if (!id) {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name },
    });
    if (error) throw error;
    id = data.user!.id;
  }

  // roles is a JSONB array in `users`; ["teacher"] satisfies isTeacherRole.
  await supabaseAdmin
    .from("users")
    .upsert({ id, email, name, roles: ["teacher"] }, { onConflict: "id" });

  return { email, password };
}
