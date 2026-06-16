/**
 * Community Service — Vit IELTS
 *
 * Clubs browse + join/leave. Posts (list + create).
 * Comments/threads are out of scope.
 *
 * All functions receive SupabaseClient as first param (browser / SSR).
 * Types are defined here; do NOT edit services/types/database.ts.
 */

import { SupabaseClient } from "@supabase/supabase-js";

// ============================================================================
// Types
// ============================================================================

/** A community post enriched with author info and optional club name. */
export interface CommunityPost {
  id: string;
  title: string;
  body: string;
  created_at: string;
  club_id: string | null;
  club_name: string | null;
  author_name: string;
  /** Two-letter initials derived from author_name. */
  author_initials: string;
}

export interface Club {
  id: string;
  name: string;
  tagline: string | null;
  level: string;
  created_at: string;
  /** Total members in this club (derived from club_members count). */
  member_count: number;
  /** Whether the current viewer is already a member. False when unauthenticated. */
  joined: boolean;
}

// ============================================================================
// Queries
// ============================================================================

/**
 * Fetch all clubs enriched with member_count and whether `userId` has joined.
 * Pass `userId = null` for unauthenticated visitors (joined will always be false).
 */
export async function getClubs(
  supabase: SupabaseClient,
  userId: string | null
): Promise<Club[]> {
  try {
    // Fetch clubs and their member counts in one query using a left join aggregate.
    const { data: rows, error } = await supabase
      .from("clubs")
      .select(`
        id,
        name,
        tagline,
        level,
        created_at,
        club_members(count)
      `)
      .order("created_at", { ascending: true });

    if (error) throw error;

    // If authenticated, also fetch which clubs the user has joined.
    let joinedSet = new Set<string>();
    if (userId) {
      const { data: memberships, error: mErr } = await supabase
        .from("club_members")
        .select("club_id")
        .eq("user_id", userId);
      if (!mErr && memberships) {
        joinedSet = new Set(memberships.map((m) => m.club_id as string));
      }
    }

    return (rows ?? []).map((row) => {
      // Supabase returns the aggregate count as an array with a single object
      // when using a one-to-many relation count: [{ count: N }]
      const countValue = Array.isArray(row.club_members)
        ? ((row.club_members[0] as { count: number } | undefined)?.count ?? 0)
        : 0;

      return {
        id: row.id as string,
        name: row.name as string,
        tagline: (row.tagline as string | null) ?? null,
        level: (row.level as string) ?? "All levels",
        created_at: row.created_at as string,
        member_count: Number(countValue),
        joined: userId ? joinedSet.has(row.id as string) : false,
      };
    });
  } catch {
    return [];
  }
}

// ============================================================================
// Mutations (browser client only)
// ============================================================================

export async function joinClub(
  supabase: SupabaseClient,
  params: { clubId: string; userId: string }
): Promise<void> {
  const { error } = await supabase
    .from("club_members")
    .insert({ club_id: params.clubId, user_id: params.userId });
  if (error) throw error;
}

export async function leaveClub(
  supabase: SupabaseClient,
  params: { clubId: string; userId: string }
): Promise<void> {
  const { error } = await supabase
    .from("club_members")
    .delete()
    .eq("club_id", params.clubId)
    .eq("user_id", params.userId);
  if (error) throw error;
}

// ============================================================================
// Posts
// ============================================================================

/** Derive two-letter initials from a display name. */
function toInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Fetch the most recent `limit` community posts, enriched with author name
 * and club name. Newest first.
 */
export async function getRecentPosts(
  supabase: SupabaseClient,
  limit = 20
): Promise<CommunityPost[]> {
  try {
    const { data: rows, error } = await supabase
      .from("community_posts")
      .select(`
        id,
        title,
        body,
        created_at,
        club_id,
        users!community_posts_user_id_fkey ( name ),
        clubs!community_posts_club_id_fkey ( name )
      `)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (rows ?? []).map((row) => {
      // Supabase infers the joined type as an array; we know it is a 1:1 FK join.
      const userRow = row.users as unknown as { name: string | null } | null;
      const clubRow = row.clubs as unknown as { name: string | null } | null;
      const authorName = userRow?.name ?? "Anonymous";

      return {
        id: row.id as string,
        title: row.title as string,
        body: row.body as string,
        created_at: row.created_at as string,
        club_id: (row.club_id as string | null) ?? null,
        club_name: clubRow?.name ?? null,
        author_name: authorName,
        author_initials: toInitials(authorName),
      };
    });
  } catch {
    return [];
  }
}

/**
 * Insert a new community post. Returns the created post enriched with author
 * info so the UI can prepend it optimistically without a re-fetch.
 */
export async function createPost(
  supabase: SupabaseClient,
  params: {
    userId: string;
    title: string;
    body: string;
    clubId?: string | null;
  }
): Promise<CommunityPost> {
  const { data, error } = await supabase
    .from("community_posts")
    .insert({
      user_id: params.userId,
      title: params.title.trim(),
      body: params.body.trim(),
      club_id: params.clubId ?? null,
    })
    .select(`
      id,
      title,
      body,
      created_at,
      club_id,
      users!community_posts_user_id_fkey ( name ),
      clubs!community_posts_club_id_fkey ( name )
    `)
    .single();

  if (error) throw error;

  const userRow = data.users as unknown as { name: string | null } | null;
  const clubRow = data.clubs as unknown as { name: string | null } | null;
  const authorName = userRow?.name ?? "Anonymous";

  return {
    id: data.id as string,
    title: data.title as string,
    body: data.body as string,
    created_at: data.created_at as string,
    club_id: (data.club_id as string | null) ?? null,
    club_name: clubRow?.name ?? null,
    author_name: authorName,
    author_initials: toInitials(authorName),
  };
}
