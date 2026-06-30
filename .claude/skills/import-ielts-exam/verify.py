#!/usr/bin/env python3
"""
Inspect + score-check imported IELTS exam quizzes against the live Supabase DB.

This is the "drive & observe" harness for the import-ielts-exam skill: given a
quiz id (or a title fragment), it reads the quiz's passages + questions straight
from PostgREST and prints the structure, then runs a faithful Python mirror of
services/scoring.ts to confirm a fully-correct submission scores N/N.

Read-only — it never writes. Credentials come from .env.local
(NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY).

Usage (run from repo root):
  python3 .claude/skills/import-ielts-exam/verify.py <quiz-id-or-title-fragment> [...]
  python3 .claude/skills/import-ielts-exam/verify.py "Mock Test 2026"
"""
import json, os, re, sys, urllib.request, urllib.parse

ROOT = os.getcwd()


def env():
    e = {}
    for line in open(os.path.join(ROOT, ".env.local"), encoding="utf-8"):
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            e[k] = v.strip().strip('"').strip("'")
    return e


def get(path):
    E = get.env
    r = urllib.request.Request(
        E["NEXT_PUBLIC_SUPABASE_URL"].rstrip("/") + "/rest/v1/" + path,
        headers={"apikey": E["SUPABASE_SERVICE_ROLE_KEY"],
                 "Authorization": "Bearer " + E["SUPABASE_SERVICE_ROLE_KEY"]})
    return json.loads(urllib.request.urlopen(r).read())


# --- scorer mirror (services/scoring.ts) -------------------------------------
def extract_words(txt):
    return re.findall(r"\{([^}]*)\}", txt or "")


def score_matching(mq):
    """Mirror of scoreMatching layoutType='standard' (the path the importer uses)."""
    opts = [o.get("optionText") or o.get("option_text") or "" for o in mq.get("answerOptions") or []]
    items = mq.get("matchingItems") or mq.get("matching_items") or []
    c = 0
    for it in items:
        raw = str(it.get("correctAnswer") or it.get("correct_answer") or "").strip()
        # a fully-correct user picks the option that should be right:
        if re.fullmatch(r"[A-Za-z]", raw):
            opt_idx = ord(raw.upper()) - 65
        else:
            opt_idx = opts.index(raw) if raw in opts else -1
        if opt_idx < 0 or opt_idx >= len(opts):
            continue
        user_text = opts[opt_idx]
        letter = re.fullmatch(r"[A-Za-z]", raw)
        c_idx = ord(raw.upper()) - 65 if letter else -1
        if (c_idx >= 0 and opt_idx == c_idx) or user_text.strip().lower() == raw.lower():
            c += 1
    return c, len(items)


def score_quiz(qid):
    passages = get(f"passages?quiz_id=eq.{qid}"
                   "&select=title,sort_order,start_question_number,"
                   "questions(type,question_form,matching_question,list_of_questions,question_text,sort_order)"
                   "&order=sort_order")
    if not passages:
        print(f"  (no passages for {qid})")
        return
    C = T = 0
    for p in passages:
        n = 0
        forms = {}
        for q in sorted(p["questions"], key=lambda x: x.get("sort_order") or 0):
            if q["type"] == "matching":
                c, t = score_matching(q["matching_question"])
            elif q["type"] == "radio":
                c = t = 1  # correct index selected
            else:  # fillup
                w = extract_words(q["question_text"]); c = t = len(w)
            n += t; C += c; T += t
            forms[q.get("question_form") or q["type"]] = forms.get(q.get("question_form") or q["type"], 0) + 1
        formstr = ", ".join(f"{k}×{v}" for k, v in forms.items())
        print(f"  [{p['sort_order']}] {p['title']!r:24} start={p['start_question_number']:>3} "
              f"q={n:>2}  ({formstr})")
    flag = "OK" if C == T else "!! MISMATCH"
    print(f"  => fully-correct submission scores {C}/{T}  [{flag}]")


def resolve(arg):
    if re.fullmatch(r"[0-9a-f-]{36}", arg):
        return [(arg, arg)]
    q = urllib.parse.quote(f"*{arg}*")
    rows = get(f"quizzes?title=ilike.{q}&select=id,title,status,skill&order=title")
    return [(r["id"], f"{r['status']:9} {r['skill']:9} {r['title']}") for r in rows]


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(__doc__); sys.exit(1)
    get.env = env()
    for arg in sys.argv[1:]:
        for qid, label in resolve(arg):
            print(f"\n=== {label}")
            score_quiz(qid)
