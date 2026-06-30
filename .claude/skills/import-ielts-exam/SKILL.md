---
name: import-ielts-exam
description: Import or fix scraped IELTS exam JSON (reading/listening mock tests, "Bộ đề thi máy" collections) into the Supabase quizzes/passages/questions tables in the correct format. Use when importing IELTS exam sets, fixing a broken/mis-formatted exam import, repairing passage titles or question types, or verifying that an imported exam scores correctly.
---

# Import / fix IELTS exam JSON into Supabase

Scraped exam JSON (from ieltsonlinetests.com, under `ielts-data/<collection>/`) is
**not** in the shape the app's scorer expects. The generic importer
(`scripts/import_ielts_data.py`) flattens every question to a plain `radio` row and
copies the section rubric ("You should spend about 20 minutes on Questions 1-13…")
verbatim into `passages.title`. That loses the IELTS matching/heading structure and
breaks scoring of those sets.

The driver is a small Python converter that re-derives passages + questions in the
**canonical** shape and writes them via PostgREST. `scripts/fix_mock_2026.py` is the
worked reference for the "Bộ đề thi máy 2026" collection; adapt its `FILE_QUIZ`
mapping + `build()` for a new set. `.claude/skills/import-ielts-exam/verify.py` is the
read-only harness that proves the result scores N/N.

All paths below are relative to the repo root. Python stdlib only — no pip installs.

## Prerequisites

- `python3` (stdlib only: `json`, `re`, `urllib`).
- `.env.local` at repo root with `NEXT_PUBLIC_SUPABASE_URL` +
  `SUPABASE_SERVICE_ROLE_KEY` (the converter writes with the service-role key,
  bypassing RLS).
- The target quiz rows must already exist in `quizzes` (the converter rewrites their
  passages/questions in place; it does not create quiz rows). Confirm with:
  ```bash
  python3 .claude/skills/import-ielts-exam/verify.py "Mock Test 2026"
  ```

## The canonical format (what "correct" means)

`quizzes` → `passages` (per part) → `questions` (per group). Key facts, all learned
the hard way:

- **`quizzes`**: no `category`/`total_questions` columns — use `skill`
  (`reading`|`listening`) and `time_minutes` (60 reading / 40 listening). Live
  `quizzes_type_check` allows `practice|academic|general|mock` — **`exam` is
  rejected** (23514). A collection groups quizzes via `mock_tests` +
  `mock_test_collections`, *not* via `type='exam'`; quizzes inside stay `practice`.
- **`passages.title`** = a short label: `Reading Passage 1/2/3` or `Part 1..4`. The
  rubric belongs nowhere on the passage. `passages.content` = HTML body
  (`<p>…</p>`). `start_question_number` = the part's first question number.
- **`questions.type`** is one of `radio|select|fillup|checkbox|matching|matrix` (CHECK
  constrained). The importer only needs `radio`, `fillup`, `matching`. JSONB columns
  are **camelCase** (`matching_question`: `{layoutType, summaryText, optionsTitle,
  answerOptions:[{optionText}], matchingItems:[{questionPart, correctAnswer}]}`).
- **Scoring** (`services/scoring.ts`): `radio` reads `list_of_questions[0].correct`
  (option index). `fillup` extracts `{answer}` tokens from `question_text`.
  `matching` with `layoutType:"standard"` compares the selected option to
  `correctAnswer` — a single `A-Z` letter is matched by **index**, anything else by
  exact **option text**. `layoutType:"heading"` ignores `matchingItems` and scores off
  `{answer}` tokens in the passage HTML — fragile, **avoid it**.

Type mapping the converter applies:

| scraped `type` | DB row |
|---|---|
| `matching`, `matching_headings` (consecutive, same legend) | **one** `matching` row, `layoutType:"standard"`, `answerOptions` parsed from the legend, `matchingItems` one per item. `correctAnswer` = letter for A–G sets; **full option text** for roman (i, ii…) headings (so the text-match path scores them). |
| `true_false_notgiven` / `yes_no_notgiven` | `radio`, options `TRUE/FALSE/NOT GIVEN` (or `YES/NO/NOT GIVEN`), statement as the question |
| `multiple_choice` | `radio`, options A–D with full text |
| `fill_blank` (consecutive, same context) | one `fillup`, `[___N___]` → `{answer}` |

## Run — convert + write (agent path)

```bash
# 1. inspect what would be written — no DB writes
python3 scripts/fix_mock_2026.py            # dry-run: prints every passage + question

# 2. self-test the legend parser (options before/after items, 'A36.' glue, romans)
python3 scripts/fix_mock_2026.py --selftest # -> "selftest OK"

# 3. write to the live DB (DELETE passages cascades questions, re-insert, set published)
python3 scripts/fix_mock_2026.py --apply
```

Back up the current content first (read-only) so a bad run is reversible:

```bash
URL=$(grep -E '^NEXT_PUBLIC_SUPABASE_URL' .env.local | cut -d= -f2- | tr -d '"'\''')
KEY=$(grep -E '^SUPABASE_SERVICE_ROLE_KEY' .env.local | cut -d= -f2- | tr -d '"'\''')
curl -s "$URL/rest/v1/passages?quiz_id=eq.<QUIZ_ID>&select=*,questions(*)" \
  -H "apikey: $KEY" -H "Authorization: Bearer $KEY" > /tmp/exam-backup.json
```

## Run — verify (agent path, read-only)

Drive the live DB and confirm structure + scoring. A fully-correct submission must
score N/N:

```bash
python3 .claude/skills/import-ielts-exam/verify.py "Mock Test 2026"
# or by id:
python3 .claude/skills/import-ielts-exam/verify.py 5f1a77f9-3a8b-410f-a98d-bfc0557e5dee
```

Expected: each part lists its question_form counts and `=> fully-correct submission
scores 40/40 [OK]`. A `[!! MISMATCH]` means a `correctAnswer` doesn't resolve against
its `answerOptions` (usually a roman heading stored as a bare label instead of full
option text).

## Gotchas (battle scars)

- **The rubric is the title.** The scrape puts "You should spend about 20 minutes on
  Questions 1-13…" into the source `passage_title`. There is **no real article title**
  in the data — synthesize `Reading Passage N` / `Part N`.
- **Words are glued.** The scrape drops spaces: `characterisingChoose`, `wardensB`,
  `researchExample`. The converter's `despace()` re-inserts spaces at lower→Upper,
  `.`→Upper, and Upper→Upper+lower boundaries. Don't apply it to passage bodies.
- **Option block can sit before *or* after the items.** Classify/headings list options
  before the `[___N___]` items; "matching features / List of People" lists them after.
  The parser scans head then tail.
- **Question numbers glue into labels.** Source label `"A36"` means option `A` with a
  stray `36`. Normalize choice labels with `^[A-Za-z]+` and scan with `label\d*\.`.
- **Roman headings can't use the letter→index scoring path** (`ii` isn't a single
  letter). Store `correctAnswer` as the full option text and the standard scorer's
  text-match path handles it. Do **not** use `layoutType:"heading"` — it needs
  `{answer}` tokens injected into the passage HTML.
- **`type='exam'` is rejected** by the live `quizzes_type_check` (23514). Import as
  `practice`; group into a collection via `mock_tests` + `mock_test_collections`.
- **A matching set is ONE row, not one row per item.** `countQuestion` and the scorer
  count `matchingItems.length`. 13 reading questions in a passage can be 5 rows.

## Troubleshooting

- `400 ... 23514 quizzes_type_check` — you set `type='exam'`. Use `practice`.
- `42703 column ... does not exist` — you sent `category` or `total_questions`; those
  columns don't exist. Use `skill`; question count is derived at render time.
- verify prints `[!! MISMATCH]` on a heading group — its `correctAnswer` is a bare
  roman (`"ii"`) instead of the full option text (`"ii An evolutionary turning point"`).
- `urllib ... 401` — `.env.local` key is wrong/expired, or you used the anon key. The
  converter needs `SUPABASE_SERVICE_ROLE_KEY`.
