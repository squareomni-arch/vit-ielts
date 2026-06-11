# Visual-Only Backlog

Master checklist of UI that exists but is **not (fully) wired to a backend** — built during the UI rebuild. Update a row when it gets wired (or delete it).

**How to find these in code:** run `rg "VISUAL-ONLY"` for inline tags. This file is the authoritative registry; inline tags point back here.

**Convention going forward:** when you add a control/page that isn't backed yet, tag it with `// VISUAL-ONLY: <short description>` and add a row below.

> **Phase 1 wired (2026-06-11):** My Progress, Test Result percentile/band-uplift, Mock Test Question-type & Subscription filters, footer dead links, Profile Country/Native-language/Target-band.
> **Phase 2 wired (2026-06-11):** Settings (notification prefs + language/timezone/appearance stored in `users.settings`), Study Plan (loads + toggles `study_tasks`).
> ⚠️ **Migrations `024`–`027` MUST be applied** (CLI not available in the dev sandbox — apply with `supabase migration up`, additive, never `db reset`): `024` profile cols, `025` percentile RPC, `026` `users.settings` jsonb, `027` `study_tasks` table. Until applied, the related saves/reads error or fall back to defaults/empty.
> ⚠️ All Phase-1/2 queries still need **runtime/DB verification** (not executed live here).
> **Phase 3 wired (2026-06-11):** Vocabulary (migration `028`), Community Clubs (migration `029`). ⚠️ Apply `028` + `029` too (`supabase migration up`).
> Remaining (deferred sub-features): **Band** filter (needs data + column), Settings **2FA** (Supabase MFA) + **Active sessions** (map `users.devices`), Study Plan **task generation**, Vocabulary **SRS scheduling**, Community **posts/comments feed** + **live sessions**, Help **search** + **live chat**.

---

## 1. Whole pages — static UI, no backend

| Feature | Route | File | Backend needed |
|---|---|---|---|
| ~~Study Plan~~ ✅ | `/study-plan` | `services/study-plan.ts` + SSR (migration `027`) | **Wired** — loads the week's `study_tasks`, toggles completion. Task creation/generation is a separate future feature (empty state until tasks exist). |
| ~~My Progress~~ ✅ | `/my-progress` | `services/progress.ts` + SSR | **Wired** — aggregates `test_results`. (Study streak / study time still hidden.) |
| ~~Vocabulary~~ ✅ | `/vocabulary` | `services/vocabulary.ts` (migration `028`, 15 seeded words) | **Wired** — corpus + per-user learned/new status. Spaced-repetition *scheduling* (review intervals) is future; currently a simple learned toggle. |
| ~~Community~~ ✅ (Clubs) | `/community` | `services/community.ts` (migration `029`, 4 seeded clubs) | **Clubs wired** — browse + join/leave with live member counts. **Posts/comments feed** and **Live session** banner still static (tagged `VISUAL-ONLY`). |
| Help & Support | `/help` | `src/pages/help/ui/index.tsx` | Articles + search; "Live chat" (Email us → mailto only) |

> Teacher pages (`/classroom/overview`, `/students`, `/collaborators`) were checked 2026-06-11 — **fully backed** (role-guarded SSR + `~services/classroom` queries), not placeholders.

## 2. Decorative / non-functional controls (visible but no logic)

| Control | File | Backend needed |
|---|---|---|
| Mock Test filters: ~~Question type~~ ✅ · ~~Parts~~ ✅ · ~~Subscription~~ ✅ · **Band** | `src/pages/ielts-exam-library/ui/filter/index.tsx` | Question type / Subscription / Parts **wired** (Parts = passage count). **Band** stays decorative — `quizzes` has no band/level field; needs a new column + admin-populated data. |
| Settings — ~~Notifications (5 toggles)~~ ✅ · **Two-factor auth** · **Active sessions "Manage"** | `src/pages/account/settings/ui/index.tsx` | Notification prefs **persist** to `users.settings` (migration `026`); sending system is future. 2FA needs Supabase MFA; sessions need device management. |
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
