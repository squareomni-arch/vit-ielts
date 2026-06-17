# Visual-Only Backlog

Master checklist of UI that exists but is **not (fully) wired to a backend** — built during the UI rebuild. Update a row when it gets wired (or delete it).

**How to find these in code:** run `rg "VISUAL-ONLY"` for inline tags. This file is the authoritative registry; inline tags point back here.

**Convention going forward:** when you add a control/page that isn't backed yet, tag it with `// VISUAL-ONLY: <short description>` and add a row below.

> **Phase 1 wired (2026-06-11):** My Progress, Test Result percentile/band-uplift, Mock Test Question-type & Subscription filters, footer dead links, Profile Country/Native-language/Target-band.
> **Phase 2 wired (2026-06-11):** Settings (notification prefs + language/timezone/appearance stored in `users.settings`), Study Plan (loads + toggles `study_tasks`).
> ⚠️ **Migrations `024`–`027` MUST be applied** (CLI not available in the dev sandbox — apply with `supabase migration up`, additive, never `db reset`): `024` profile cols, `025` percentile RPC, `026` `users.settings` jsonb, `027` `study_tasks` table. Until applied, the related saves/reads error or fall back to defaults/empty.
> ⚠️ All Phase-1/2 queries still need **runtime/DB verification** (not executed live here).
> **Phase 3 wired (2026-06-11):** Vocabulary (`028`), Community Clubs (`029`).
> **Sub-features wired (2026-06-11):** Settings **2FA** (Supabase MFA) + **Active sessions** (`users.devices`), **Help search** (client-side), **Vocab SRS** (`030`), **Study Plan task generation**, **Community posts feed** (`031`).
> **Vocabulary → personal study tool (2026-06-12, `032`):** vocab is now **per-student** (`vocab_words.owner_id`; legacy seed hidden). Added **personal CRUD**, global **select-text → "Add to Vocabulary"** popover (auto-enriched via dictionaryapi.dev, `/api/vocabulary/enrich`), **pronunciation** (audio + speechSynthesis fallback, `ipa`/`audio_url`), **status filter**, **flashcard study mode**, and a **progress panel** (streak, words/day chart, topic distribution, daily goal). Daily goal lives in `users.settings.vocabDailyGoal`; activity logged in `vocab_activity`.
> ⚠️ Apply all migrations `024`–`032` (`supabase migration up`).
> **Remaining (intentional):** **Band** filter (needs a `band_level` column + admin data), Help **live chat** + Community **live session** (both need a 3rd-party integration). 2FA "sign out others" only clears the app `devices` column — true Auth session revocation needs a server-side `auth.admin.signOut` route (future hardening).

---

## 1. Whole pages — static UI, no backend

| Feature | Route | File | Backend needed |
|---|---|---|---|
| ~~Study Plan~~ ✅ | `/study-plan` | `services/study-plan.ts` + SSR (migration `027`) | **Wired** — loads/toggles `study_tasks` + **"Generate this week's plan"** (template week, idempotent). |
| ~~My Progress~~ ✅ | `/my-progress` | `services/progress.ts` + SSR | **Wired** — aggregates `test_results`. (Study streak / study time still hidden.) |
| ~~Vocabulary~~ ✅ (personal) | `/vocabulary` | `services/vocabulary.ts` (migrations `028`+`030`+`032`) | **Personal word bank** — CRUD, site-wide select-text → Add (auto-enriched), pronunciation (IPA/audio), status filter, **flashcard study mode**, SRS scheduling, progress (streak / words-per-day / topic / daily goal). |
| ~~Community~~ ✅ (Clubs + Posts) | `/community` | `services/community.ts` (migrations `029` + `031`) | **Clubs** browse + join/leave; **Posts feed** list + compose. **Live session** banner still static (3rd-party). Comments/threads future. |
| ~~Help & Support~~ ✅ (search) | `/help` | `src/pages/help/ui/index.tsx` | **Search wired** (client-side filter of FAQ/topics). Email us → mailto. **Live chat** still static (3rd-party). |

> Teacher pages (`/classroom/overview`, `/students`, `/collaborators`) were checked 2026-06-11 — **fully backed** (role-guarded SSR + `~services/classroom` queries), not placeholders.

## 2. Decorative / non-functional controls (visible but no logic)

| Control | File | Backend needed |
|---|---|---|
| Mock Test filters: ~~Question type~~ ✅ · ~~Parts~~ ✅ · ~~Subscription~~ ✅ · **Band** | `src/pages/ielts-exam-library/ui/filter/index.tsx` | Question type / Subscription / Parts **wired** (Parts = passage count). **Band** stays decorative — `quizzes` has no band/level field; needs a new column + admin-populated data. |
| Settings — ~~Notifications~~ ✅ · ~~Two-factor auth~~ ✅ · ~~Active sessions~~ ✅ | `src/pages/account/settings/ui/index.tsx` | Notification prefs persist (`026`); **2FA** = Supabase MFA TOTP enroll/verify; **Active sessions** lists `users.devices` + sign-out-others. (True Auth session revocation is future.) |
| ~~Notification bell + delivery~~ ✅ | `src/widgets/layouts/app-shell` · `services/notification.ts` · `pages/api/notifications` | **Wired** — `notifications` table (`034`), bell panel w/ unread badge + 60s polling. Events: order/Pro (sepay webhook), test scored (test-flow/submit), classroom assignment (`/api/classroom/notify-assignment`). Respects `studyReminders`/`communityReplies` prefs. **Community replies** have no trigger yet (comments out of scope in `services/community.ts`); **email delivery** + realtime are future. |
| Settings — ~~Language / Time zone / Appearance~~ ✅ (stored) | `src/pages/account/settings/ui/index.tsx` | **Persisted** to `users.settings`. *Applying* them (theme switch / i18n / tz formatting) + interactive selectors are future. |
| Help — **Search for help** input, **Live chat** button | `src/pages/help/ui/index.tsx` | Search index; chat integration. ("Email us" → `mailto:` is functional/acceptable.) |

> Settings links that ARE wired: Manage plan → Subscription, Invoices → Order history, Password → Profile. Delete account intentionally omitted.

## 3. Hidden because data/columns are missing (feature absent until backend)

| Hidden element | File | Backend needed |
|---|---|---|
| Profile: ~~Country, Native language, Target band~~ ✅ · **Preferences toggles, plan renew/price** | `src/pages/account/my-profile/ui/index.tsx` | Country/Native-language wired (migration `024`); Target band → `target_score`. Preferences + plan dates still need a settings store (Phase 2). |
| ~~Test Result: Band uplift, Percentile~~ ✅ | `services/test-analytics.ts` + SSR | **Wired** — uplift (prior result, own rows) + percentile via SECURITY DEFINER RPC `get_score_percentile` (migration `025`). |
| Mock Test card: Section/Passage/Part badge | `src/pages/ielts-exam-library/ui/exam-item/index.tsx` | Per-test part/section field |

## 4. Dead links

| Link | File | Should point to |
|---|---|---|
| ~~Footer "Privacy Policy" / "Terms of Service"~~ ✅ | `src/shared/ui/ds/organisms/footer/footer.tsx` | **Done** — now link to `/privacy-policy`, `/terms-of-use`. |

---

_Last reviewed: 2026-06-11._
