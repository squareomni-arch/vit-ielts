/**
 * Vocabulary Service — Vit IELTS
 *
 * Manages the shared vocab_words corpus and per-user learning progress
 * stored in user_vocab.
 *
 * Types are defined here — do NOT edit services/types/database.ts for this
 * feature.
 *
 * Usage in getServerSideProps (server-side Supabase client):
 *   const overview = await getVocabularyOverview(supabase, user.id);
 *
 * Usage in browser (optimistic toggle):
 *   await setWordStatus(createClient(), { userId, wordId, status });
 */

import type { SupabaseClient } from "@supabase/supabase-js";

// ============================================================================
// Types
// ============================================================================

export type WordStatus = "learning" | "learned" | "new";

export type VocabWordRow = {
  id: string;
  word: string;
  meaning: string;
  example: string | null;
  topic: string | null;
  skill: string | null;
  ipa: string | null;
  audio_url: string | null;
  created_at: string;
};

export type UserVocabRow = {
  id: string;
  user_id: string;
  word_id: string;
  status: "learning" | "learned";
  created_at: string;
};

/** A corpus word enriched with the current user's progress status. */
export type VocabWordWithStatus = VocabWordRow & {
  /** 'new' when the user has no row in user_vocab for this word. */
  userStatus: WordStatus;
};

export type VocabStats = {
  total: number;
  learned: number;
  learning: number;
  dueCount: number;
};

export type VocabularyOverview = {
  words: VocabWordWithStatus[];
  stats: VocabStats;
  dueWords: VocabWordWithStatus[];
};

// ── SRS row shape (columns added by migration 030) ────────────────────────────

export type UserVocabSrsRow = UserVocabRow & {
  interval_days: number;
  ease: number;
  next_review_at: string | null;
};

// ============================================================================
// Helpers
// ============================================================================

const EMPTY_OVERVIEW: VocabularyOverview = {
  words: [],
  stats: { total: 0, learned: 0, learning: 0, dueCount: 0 },
  dueWords: [],
};

// ============================================================================
// Read — getVocabularyOverview
// ============================================================================

/**
 * Fetches the user's OWN words (vocab_words where owner_id = userId) and merges
 * their user_vocab rows to produce a combined list and summary stats.
 *
 * Vocabulary is a per-student personal list (migration 032): the legacy shared
 * seed rows (owner_id IS NULL) are intentionally excluded. Unauthenticated
 * callers get an empty overview (the page guards via the SSR auth redirect).
 */
export async function getVocabularyOverview(
  supabase: SupabaseClient,
  userId: string | null | undefined
): Promise<VocabularyOverview> {
  try {
    if (!userId) return EMPTY_OVERVIEW;

    // 1. Fetch the user's personal words only (owner-scoped)
    const { data: words, error: wordsError } = await supabase
      .from("vocab_words")
      .select("*")
      .eq("owner_id", userId)
      .order("created_at", { ascending: false })
      // ponytail: cap the personal corpus pull (each row carries JSON blobs);
      // paginate the vocab page if a user genuinely exceeds 5000 words.
      .limit(5000);

    if (wordsError) {
      console.error("[vocabulary] vocab_words fetch error:", wordsError.message);
      return EMPTY_OVERVIEW;
    }

    const corpus: VocabWordRow[] = words ?? [];

    if (corpus.length === 0) {
      return EMPTY_OVERVIEW;
    }

    // 2. Fetch this user's progress (only when authenticated)
    //    Also fetch SRS columns added by migration 030.
    type ProgressRow = {
      word_id: string;
      status: "learning" | "learned";
      next_review_at: string | null;
    };

    const progressMap = new Map<string, ProgressRow>();

    if (userId) {
      const { data: progress, error: progressError } = await supabase
        .from("user_vocab")
        .select("word_id, status, next_review_at")
        .eq("user_id", userId);

      if (progressError) {
        // Non-fatal: show corpus but treat all as 'new'
        console.error(
          "[vocabulary] user_vocab fetch error:",
          progressError.message
        );
      } else {
        for (const row of (progress ?? []) as ProgressRow[]) {
          progressMap.set(row.word_id, row);
        }
      }
    }

    // 3. Merge
    const enriched: VocabWordWithStatus[] = corpus.map((w) => ({
      ...w,
      userStatus: (progressMap.get(w.id)?.status ?? "new") as WordStatus,
    }));

    // 4. Stats
    let learned = 0;
    let learning = 0;
    for (const w of enriched) {
      if (w.userStatus === "learned") learned++;
      else if (w.userStatus === "learning") learning++;
    }

    // 5. Due list — words the user has started (have a user_vocab row) and
    //    whose next_review_at is in the past (or null = never reviewed / SRS
    //    columns not yet populated, so always due once started).
    const now = new Date();
    const dueWords = enriched.filter((w) => {
      const row = progressMap.get(w.id);
      if (!row) return false; // user has never touched this word → not due
      const nra = row.next_review_at;
      // null means the word was toggled before SRS migration → treat as due
      if (nra === null) return true;
      return new Date(nra) <= now;
    });

    return {
      words: enriched,
      stats: { total: corpus.length, learned, learning, dueCount: dueWords.length },
      dueWords,
    };
  } catch (err) {
    console.error("[vocabulary] unexpected error in getVocabularyOverview:", err);
    return EMPTY_OVERVIEW;
  }
}

// ============================================================================
// Write — setWordStatus
// ============================================================================

export type SetWordStatusArgs = {
  userId: string;
  wordId: string;
  /** Pass null to delete the user_vocab row (reset word back to 'new'). */
  status: "learning" | "learned" | null;
};

/**
 * Upserts or deletes a user_vocab row.
 *
 * Call from the browser using createClient() for optimistic UI updates.
 * The caller should apply optimistic state before awaiting this function.
 */
export async function setWordStatus(
  supabase: SupabaseClient,
  { userId, wordId, status }: SetWordStatusArgs
): Promise<void> {
  if (status === null) {
    // Reset to 'new' — remove the row
    const { error } = await supabase
      .from("user_vocab")
      .delete()
      .eq("user_id", userId)
      .eq("word_id", wordId);

    if (error) {
      throw new Error(`[vocabulary] delete user_vocab failed: ${error.message}`);
    }
    return;
  }

  const { error } = await supabase.from("user_vocab").upsert(
    { user_id: userId, word_id: wordId, status },
    { onConflict: "user_id,word_id" }
  );

  if (error) {
    throw new Error(`[vocabulary] upsert user_vocab failed: ${error.message}`);
  }
}

// ============================================================================
// SRS — reviewWord
// ============================================================================

export type ReviewWordArgs = {
  userId: string;
  wordId: string;
  remembered: boolean;
  /** Current SRS state fetched from the server (used to compute next interval). */
  currentInterval?: number;
  currentEase?: number;
};

/**
 * SM-2-lite algorithm:
 *
 * On REMEMBERED:
 *   - interval = 0 → 1 day
 *   - interval = 1 → 3 days
 *   - interval >= 3 → Math.round(interval * ease)
 *   - ease nudges up by 0.1 (capped at 3.0)
 *
 * On FORGOT:
 *   - interval resets to 1 day
 *   - ease nudges down by 0.2 (floor 1.3)
 *
 * next_review_at = now + interval_days.
 * Status is kept at 'learning' so the word stays visible in the browse grid.
 *
 * Call from the browser using createClient() — apply optimistic state first.
 * Errors are swallowed (non-fatal) so the UI doesn't break on transient DB
 * issues; the caller can check the returned boolean for silent failure.
 */
export async function reviewWord(
  supabase: SupabaseClient,
  { userId, wordId, remembered, currentInterval = 0, currentEase = 2.5 }: ReviewWordArgs
): Promise<boolean> {
  try {
    let nextInterval: number;
    let nextEase: number;

    if (remembered) {
      if (currentInterval === 0) {
        nextInterval = 1;
      } else if (currentInterval === 1) {
        nextInterval = 3;
      } else {
        nextInterval = Math.round(currentInterval * currentEase);
      }
      nextEase = Math.min(3.0, currentEase + 0.1);
    } else {
      nextInterval = 1;
      nextEase = Math.max(1.3, currentEase - 0.2);
    }

    const nextReviewAt = new Date(
      Date.now() + nextInterval * 24 * 60 * 60 * 1000
    ).toISOString();

    const { error } = await supabase.from("user_vocab").upsert(
      {
        user_id: userId,
        word_id: wordId,
        status: "learning",
        interval_days: nextInterval,
        ease: nextEase,
        next_review_at: nextReviewAt,
      },
      { onConflict: "user_id,word_id" }
    );

    if (error) {
      console.error("[vocabulary] reviewWord upsert failed:", error.message);
      return false;
    }

    // Log the review event (non-fatal) — powers streak + words/day charts.
    await supabase
      .from("vocab_activity")
      .insert({ user_id: userId, word_id: wordId, action: "review", remembered });

    return true;
  } catch (err) {
    console.error("[vocabulary] reviewWord unexpected error:", err);
    return false;
  }
}

// ============================================================================
// Personal CRUD — addPersonalWord / updatePersonalWord / deletePersonalWord
// ============================================================================

export type AddPersonalWordArgs = {
  userId: string;
  word: string;
  meaning: string;
  example?: string | null;
  ipa?: string | null;
  audioUrl?: string | null;
  topic?: string | null;
};

/**
 * Creates a personal word the student owns:
 *   1. insert vocab_words(owner_id = userId, …)
 *   2. seed a user_vocab row (status 'learning') so it appears in their list
 *   3. log a vocab_activity('add') event
 *
 * Returns the new word enriched with its (always 'learning') status, or null on
 * failure. Call from the browser with createClient(); RLS enforces ownership.
 */
export async function addPersonalWord(
  supabase: SupabaseClient,
  { userId, word, meaning, example, ipa, audioUrl, topic }: AddPersonalWordArgs
): Promise<VocabWordWithStatus | null> {
  try {
    const trimmed = word.trim();
    if (!trimmed || !meaning.trim()) return null;

    const { data: inserted, error: insertError } = await supabase
      .from("vocab_words")
      .insert({
        owner_id: userId,
        word: trimmed,
        meaning: meaning.trim(),
        example: example?.trim() || null,
        ipa: ipa?.trim() || null,
        audio_url: audioUrl?.trim() || null,
        topic: topic?.trim() || null,
        skill: null,
      })
      .select("*")
      .single();

    if (insertError || !inserted) {
      console.error(
        "[vocabulary] addPersonalWord insert failed:",
        insertError?.message
      );
      return null;
    }

    const row = inserted as VocabWordRow;

    // Seed progress + activity (both non-fatal — the word already exists).
    await supabase
      .from("user_vocab")
      .upsert(
        { user_id: userId, word_id: row.id, status: "learning" },
        { onConflict: "user_id,word_id" }
      );
    await supabase
      .from("vocab_activity")
      .insert({ user_id: userId, word_id: row.id, action: "add" });

    return { ...row, userStatus: "learning" };
  } catch (err) {
    console.error("[vocabulary] addPersonalWord unexpected error:", err);
    return null;
  }
}

export type UpdatePersonalWordArgs = {
  userId: string;
  wordId: string;
  word: string;
  meaning: string;
  example?: string | null;
  ipa?: string | null;
  topic?: string | null;
};

/** Updates the editable content of a personal word (RLS scopes to the owner). */
export async function updatePersonalWord(
  supabase: SupabaseClient,
  { userId, wordId, word, meaning, example, ipa, topic }: UpdatePersonalWordArgs
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("vocab_words")
      .update({
        word: word.trim(),
        meaning: meaning.trim(),
        example: example?.trim() || null,
        ipa: ipa?.trim() || null,
        topic: topic?.trim() || null,
      })
      .eq("id", wordId)
      .eq("owner_id", userId);

    if (error) {
      console.error("[vocabulary] updatePersonalWord failed:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[vocabulary] updatePersonalWord unexpected error:", err);
    return false;
  }
}

/** Deletes a personal word. user_vocab rows cascade via FK. */
export async function deletePersonalWord(
  supabase: SupabaseClient,
  { userId, wordId }: { userId: string; wordId: string }
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("vocab_words")
      .delete()
      .eq("id", wordId)
      .eq("owner_id", userId);

    if (error) {
      console.error("[vocabulary] deletePersonalWord failed:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[vocabulary] deletePersonalWord unexpected error:", err);
    return false;
  }
}

// ============================================================================
// Progress analytics — getVocabularyProgress
// ============================================================================

export type VocabDayBucket = {
  /** ISO date (YYYY-MM-DD), local. */
  date: string;
  count: number;
};

export type VocabTopicSlice = {
  topic: string;
  count: number;
};

export type VocabProgress = {
  /** Consecutive days (ending today) with at least one add/review event. */
  streak: number;
  /** Distinct words added or reviewed today. */
  todayCount: number;
  /** Target words/day from users.settings.vocabDailyGoal (default 5). */
  dailyGoal: number;
  /** Last 30 calendar days, oldest → newest. */
  perDay: VocabDayBucket[];
  /** Owned-word counts grouped by topic, descending. */
  topics: VocabTopicSlice[];
};

const DEFAULT_DAILY_GOAL = 5;
const PROGRESS_WINDOW_DAYS = 30;

const EMPTY_PROGRESS: VocabProgress = {
  streak: 0,
  todayCount: 0,
  dailyGoal: DEFAULT_DAILY_GOAL,
  perDay: [],
  topics: [],
};

/** Local YYYY-MM-DD key for a date. */
function dayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Derives streak / words-per-day / topic distribution for the Vocabulary
 * progress panel. Reads the activity log (last 30 days) and the owned-word
 * topics; the daily goal comes from users.settings. Best-effort: returns an
 * empty-but-valid shape on any error.
 */
export async function getVocabularyProgress(
  supabase: SupabaseClient,
  userId: string | null | undefined
): Promise<VocabProgress> {
  try {
    if (!userId) return EMPTY_PROGRESS;

    const windowStart = new Date();
    windowStart.setHours(0, 0, 0, 0);
    windowStart.setDate(windowStart.getDate() - (PROGRESS_WINDOW_DAYS - 1));

    const [activityRes, settingsRes, topicRes] = await Promise.all([
      supabase
        .from("vocab_activity")
        .select("created_at")
        .eq("user_id", userId)
        .gte("created_at", windowStart.toISOString()),
      supabase.from("users").select("settings").eq("id", userId).single(),
      // ponytail: single small column, but still cap to bound memory; topic
      // distribution covers up to 10000 words.
      supabase.from("vocab_words").select("topic").eq("owner_id", userId).limit(10000),
    ]);

    // ── Daily goal (cast locally; UserSettings type is in do-not-touch dir) ──
    const settings = (settingsRes.data?.settings ?? {}) as {
      vocabDailyGoal?: number;
    };
    const dailyGoal =
      typeof settings.vocabDailyGoal === "number" && settings.vocabDailyGoal > 0
        ? settings.vocabDailyGoal
        : DEFAULT_DAILY_GOAL;

    // ── Per-day buckets over the 30-day window ──
    const counts = new Map<string, number>();
    for (const row of (activityRes.data ?? []) as { created_at: string }[]) {
      const key = dayKey(new Date(row.created_at));
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    const perDay: VocabDayBucket[] = [];
    const cursor = new Date(windowStart);
    for (let i = 0; i < PROGRESS_WINDOW_DAYS; i++) {
      const key = dayKey(cursor);
      perDay.push({ date: key, count: counts.get(key) ?? 0 });
      cursor.setDate(cursor.getDate() + 1);
    }

    const todayKey = dayKey(new Date());
    const todayCount = counts.get(todayKey) ?? 0;

    // ── Streak: consecutive days ending today (or yesterday) with activity ──
    let streak = 0;
    const probe = new Date();
    probe.setHours(0, 0, 0, 0);
    // Allow the streak to "hold" if today has no activity yet but yesterday did.
    if (!counts.has(dayKey(probe))) probe.setDate(probe.getDate() - 1);
    while (counts.has(dayKey(probe))) {
      streak++;
      probe.setDate(probe.getDate() - 1);
    }

    // ── Topic distribution of owned words ──
    const topicCounts = new Map<string, number>();
    for (const row of (topicRes.data ?? []) as { topic: string | null }[]) {
      const t = row.topic?.trim() || "Uncategorized";
      topicCounts.set(t, (topicCounts.get(t) ?? 0) + 1);
    }
    const topics: VocabTopicSlice[] = Array.from(topicCounts.entries())
      .map(([topic, count]) => ({ topic, count }))
      .sort((a, b) => b.count - a.count);

    return { streak, todayCount, dailyGoal, perDay, topics };
  } catch (err) {
    console.error("[vocabulary] getVocabularyProgress unexpected error:", err);
    return EMPTY_PROGRESS;
  }
}
