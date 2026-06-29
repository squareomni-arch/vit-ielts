#!/usr/bin/env python3
"""
Fix the "Bộ đề thi máy 2026" exam collection.

The original importer (import_ielts_data.py) flattened EVERY reading/listening
question to a plain `radio` row and copied the section rubric
("You should spend about 20 minutes on Questions 1-13...") verbatim into
`passages.title`. That loses the proper IELTS structure: matching / heading /
classify sets must be ONE `type='matching'` row with parsed answerOptions +
matchingItems (camelCase JSONB, mirroring the live good quizzes).

This script re-derives passages + questions for the 4 already-imported quiz rows
and rewrites them in place (DELETE passages cascades questions, then re-insert).
The quiz rows, mock_test, and mock_test_collection are left untouched.

Usage:
  python3 scripts/fix_mock_2026.py            # dry-run: print what would be written
  python3 scripts/fix_mock_2026.py --apply    # delete + re-insert against Supabase
"""
import json, os, re, sys, glob, urllib.request, urllib.error

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "ielts-data", "Bo de thi may 2026")

# filename -> live quiz id (looked up once via PostgREST; hardcoded to keep the
# rewrite tied to exactly these rows).
FILE_QUIZ = {
    "ielts-mock-test-2026-january-reading-practice-test-1.json":   "5f1a77f9-3a8b-410f-a98d-bfc0557e5dee",
    "ielts-mock-test-2026-january-reading-practise-test-2.json":   "608f7ae4-0c85-4d07-9ea1-955969a3249c",
    "ielts-mock-test-2026-january-listening-practice-test-1.json": "f8c832a6-52bc-4764-9002-97d3579f7daf",
    "ielts-mock-test-2026-january-listening-practise-test-2.json": "eaf57c10-b7d7-4d51-82c2-2d3533bf34e3",
}

ROMAN = ["i","ii","iii","iv","v","vi","vii","viii","ix","x","xi","xii"]

# ---------------------------------------------------------------- text helpers
def despace(s):
    """Insert spaces at scrape glue points: lower->Upper and '.'->Upper."""
    if not s:
        return ""
    s = re.sub(r"(?<=[a-z,;:0-9])(?=[A-Z])", " ", s)
    s = re.sub(r"(?<=[.?!])(?=[A-Z])", " ", s)
    s = re.sub(r"(?<=[A-Z])(?=[A-Z][a-z])", " ", s)  # 'A-GChoose' -> 'A-G Choose'
    return re.sub(r"\s+", " ", s).strip()

def strip_num_prefix(s):
    """'11.____ Most pre-adolescent...' -> 'Most pre-adolescent...'"""
    return re.sub(r"^\s*\d+\s*\.\s*_*\s*", "", s or "").strip()

ITEM_RE = re.compile(r"\d+\s*\.\s*\[___\d+___\]")

def split_head(legend):
    """Return legend text BEFORE the first '[___N___]' item marker."""
    m = ITEM_RE.search(legend or "")
    return (legend[:m.start()] if m else (legend or "")), (legend[m.start():] if m else "")

def trim_tail(text):
    """Trim a trailing glued section-title / 'Example:' off the last option."""
    text = re.split(r"Example\s*:", text)[0]
    m = re.search(r"[a-z](?=[A-Z][a-z])", text)  # first lower->Upper glue boundary
    if m:
        text = text[: m.start() + 1]
    return text.strip(" .")

def scan(text, choices):
    """Sequential ordered scan keyed on `choices` labels. Tolerates the scrape
    gluing a stray question number into the label ('A36.' -> 'A.') and roman
    substrings (ii in vii) by moving a cursor forward label by label."""
    def find(lab, start):
        return re.compile(re.escape(lab) + r"\d*\.").search(text, start)
    opts, cursor = [], 0
    for i, lab in enumerate(choices):
        m = find(lab, cursor)
        if not m:
            return None
        start = m.end()
        if i + 1 < len(choices):
            m2 = find(choices[i + 1], start)
            end = m2.start() if m2 else len(text)
        else:
            end = len(text)
        body = text[start:end]
        if i == len(choices) - 1:
            body = trim_tail(body)
        opts.append(despace(body))
        cursor = end
    return None if any(not o for o in opts) else opts

def parse_options(legend, choices):
    """Parse answerOptions[].optionText. The labelled option block may sit
    BEFORE the items (classify / headings) or AFTER them ('List of People...')."""
    head, tail = split_head(legend)
    for src in (head, tail):
        idx = src.lower().rfind("list of headings")
        block = src[idx + len("list of headings"):] if idx >= 0 else src
        r = scan(block, choices)
        if r:
            return r
    return None  # no labelled defs (e.g. "which paragraph" -> bare letters)

def instruction_of(legend):
    """Clean instruction = legend head minus the option-definition block."""
    head, _ = split_head(legend)
    head = re.split(r"List of Headings", head, flags=re.I)[0]
    # cut at the first option definition 'A.' / 'i.' if present
    m = re.search(r"(?:^|[.\s])(?:[A-G]|[ivx]{1,4})\.[^.]", head)
    if m:
        head = head[: m.start() + 1]
    return despace(head)

# ---------------------------------------------------------------- builders
def q_matching(group, answers):
    """One DB matching row for a run of same-legend matching items."""
    legend = group[0].get("legend") or ""
    choices = group[0].get("choices") or group[0].get("options") or []
    choices = [c if isinstance(c, str) else c.get("option", "") for c in choices]
    # source labels are sometimes glued with a stray question number: 'A36' -> 'A'
    choices = [(re.match(r"^[A-Za-z]+", c).group(0) if re.match(r"^[A-Za-z]+", c) else c)
               for c in choices]
    is_heading = group[0]["type"] == "matching_headings"
    opts = parse_options(legend, choices)

    # Always layoutType "standard": the scorer's standard path resolves
    # correctAnswer either as a single A-Z letter (-> option index) or by exact
    # option-text match. Headings use roman labels (ii, ix) which aren't single
    # letters, so for those correctAnswer must be the FULL option text.
    if opts is not None:
        join = " " if is_heading else ". "
        labels = [f"{lab}{join}{txt}" for lab, txt in zip(choices, opts)]
        form = "matching_headings" if is_heading else "matching_features"
    else:
        labels = list(choices)
        form = "matching_information"
    answer_options = [{"optionText": t} for t in labels]
    label_to_text = {lab: labels[i] for i, lab in enumerate(choices)}

    items = []
    for q in group:
        n = q.get("number")
        ans = (q.get("answer") or answers.get(str(n)) or "").strip()
        correct = label_to_text.get(ans, ans) if is_heading else ans
        items.append({
            "questionPart": despace(strip_num_prefix(q.get("statement") or q.get("question") or "")),
            "correctAnswer": correct,
        })
    mq = {
        "layoutType": "standard",
        "summaryText": "",
        "optionsTitle": "",
        "answerOptions": answer_options,
        "matchingItems": items,
    }
    return {
        "type": "matching", "title": None, "question_text": "",
        "instructions": instruction_of(legend), "question_form": form,
        "list_of_questions": None, "list_of_options": None,
        "matching_question": mq, "matrix_question": None, "explanations": None,
    }

def q_radio(q, answers, form):
    """TFNG / YNG / multiple_choice -> one radio row."""
    n = q.get("number")
    ans = q.get("answer") or answers.get(str(n)) or ""
    if q["type"] == "multiple_choice":
        raw = q.get("options") or []
        labels = [o.get("option", "") for o in raw]
        options = [{"option_text": despace(o.get("text", ""))} for o in raw]
        qtext = despace(re.sub(r"^\s*\d+\s*\.\s*", "", q.get("question") or q.get("statement") or ""))
    else:
        labels = q.get("choices") or []
        options = [{"option_text": c} for c in labels]
        qtext = despace(strip_num_prefix(q.get("statement") or q.get("question") or ""))
    try:
        correct = labels.index(ans)
    except ValueError:
        correct = 0
    return {
        "type": "radio", "title": None, "question_text": "",
        "instructions": "", "question_form": form,
        "list_of_questions": [{"question": qtext, "correct": correct, "options": options}],
        "list_of_options": None, "matching_question": None,
        "matrix_question": None, "explanations": None,
    }

RUBRIC = re.compile(
    r"^(complete|write|choose|label|answer|do the following)\b|each answer|your answers"
    r"|no more than|one word|in boxes", re.I)

def q_fillup(group, answers):
    """Run of fill_blank sharing one context -> one fillup row.

    Drop the leading run of rubric sentences into `instructions`; the rest is the
    gapped body. Each '[___N___]' (with its glued question number) becomes
    '{answer}'."""
    ctx = group[0].get("context") or ""
    sentences = re.split(r"(?<=\.)\s*", ctx)
    i = 0
    while i < len(sentences) and RUBRIC.search(sentences[i].strip()):
        i += 1
    instr = despace(" ".join(sentences[:i]))
    body = despace(" ".join(sentences[i:])) if i < len(sentences) else despace(ctx)
    for q in group:
        n = q.get("number")
        ans = q.get("answer") or answers.get(str(n)) or ""
        body = re.sub(r"(?:\d+\s*)?\[___" + str(n) + r"___\]", " {" + ans + "} ", body)
    body = re.sub(r"(?:\d+\s*)?\[___\d+___\]", " {} ", body)
    body = re.sub(r"\s+", " ", body).strip()
    return {
        "type": "fillup", "title": None, "question_text": despace(body),
        "instructions": instr, "question_form": "gap_filling",
        "list_of_questions": None, "list_of_options": None,
        "matching_question": None, "matrix_question": None, "explanations": None,
    }

# ---------------------------------------------------------------- per-file
def html_paragraphs(text):
    parts = [p.strip() for p in (text or "").split("\n") if p.strip()]
    return "".join(f"<p>{p}</p>" for p in parts)

def build(path):
    d = json.load(open(path, encoding="utf-8"))
    answers = (d.get("solution") or {}).get("answers") or {}
    skill = "listening" if "listening" in os.path.basename(path) else "reading"
    passages = []
    for pi, part in enumerate(d["parts"]):
        qs = part["questions"]
        rows, i = [], 0
        while i < len(qs):
            q = qs[i]
            t = q["type"]
            if t in ("matching", "matching_headings"):
                leg = q.get("legend")
                grp = [q]; i += 1
                while i < len(qs) and qs[i]["type"] == t and qs[i].get("legend") == leg:
                    grp.append(qs[i]); i += 1
                rows.append(q_matching(grp, answers))
            elif t == "fill_blank":
                ctx = q.get("context")
                grp = [q]; i += 1
                while i < len(qs) and qs[i]["type"] == "fill_blank" and qs[i].get("context") == ctx:
                    grp.append(qs[i]); i += 1
                rows.append(q_fillup(grp, answers))
            elif t == "true_false_notgiven":
                rows.append(q_radio(q, answers, "true_false_not_given")); i += 1
            elif t == "yes_no_notgiven":
                rows.append(q_radio(q, answers, "yes_no_not_given")); i += 1
            elif t == "multiple_choice":
                rows.append(q_radio(q, answers, "multiple_choice_single")); i += 1
            else:
                print(f"  !! unknown type {t} q{q.get('number')}"); i += 1
        for so, r in enumerate(rows):
            r["sort_order"] = so
        nums = [q.get("number") for q in qs if q.get("number")]
        title = f"Reading Passage {pi + 1}" if skill == "reading" else f"Part {pi + 1}"
        passages.append({
            "title": title,
            "content": html_paragraphs(part.get("passage", "")),
            "sort_order": pi,
            "start_question_number": min(nums) if nums else None,
            "audio_start": None, "audio_end": None,
            "_questions": rows,
        })
    return skill, passages

# ---------------------------------------------------------------- supabase
def load_env():
    env = {}
    p = os.path.join(ROOT, ".env.local")
    for line in open(p, encoding="utf-8"):
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            env[k] = v.strip().strip('"').strip("'")
    return env

def req(method, url, key, payload=None):
    data = json.dumps(payload).encode() if payload is not None else None
    r = urllib.request.Request(url, data=data, method=method, headers={
        "apikey": key, "Authorization": f"Bearer {key}",
        "Content-Type": "application/json", "Prefer": "return=representation",
    })
    try:
        with urllib.request.urlopen(r) as resp:
            body = resp.read().decode()
            return json.loads(body) if body else []
    except urllib.error.HTTPError as e:
        raise SystemExit(f"{method} {url} -> {e.code}: {e.read().decode()}")

def apply(env):
    URL = env["NEXT_PUBLIC_SUPABASE_URL"].rstrip("/")
    KEY = env["SUPABASE_SERVICE_ROLE_KEY"]
    for fn, qid in FILE_QUIZ.items():
        skill, passages = build(os.path.join(DATA, fn))
        # wipe existing passages (cascades questions)
        req("DELETE", f"{URL}/rest/v1/passages?quiz_id=eq.{qid}", KEY)
        total_q = 0
        for p in passages:
            qrows = p.pop("_questions")
            p["quiz_id"] = qid
            ins = req("POST", f"{URL}/rest/v1/passages", KEY, p)
            pid = ins[0]["id"]
            for r in qrows:
                r["passage_id"] = pid
            if qrows:
                req("POST", f"{URL}/rest/v1/questions", KEY, qrows)
            total_q += sum(len(r.get("matching_question", {}).get("matchingItems", []))
                           if r["type"] == "matching" else
                           (r["question_text"].count("{") if r["type"] == "fillup" else 1)
                           for r in qrows)
        # ensure published
        req("PATCH", f"{URL}/rest/v1/quizzes?id=eq.{qid}", KEY, {"status": "published"})
        print(f"[OK] {fn}  {skill}  passages={len(passages)} questions≈{total_q}")

def dry():
    for fn in FILE_QUIZ:
        skill, passages = build(os.path.join(DATA, fn))
        print(f"\n===== {fn}  ({skill}) =====")
        for p in passages:
            rows = p["_questions"]
            print(f"  [{p['sort_order']}] title={p['title']!r}  start_q={p['start_question_number']}  rows={len(rows)}")
            for r in rows:
                if r["type"] == "matching":
                    mq = r["matching_question"]
                    print(f"      matching/{r['question_form']} layout={mq['layoutType']} "
                          f"items={len(mq['matchingItems'])} opts={[o['optionText'][:40] for o in mq['answerOptions']]}")
                    print(f"        instr: {r['instructions'][:90]!r}")
                    for it in mq["matchingItems"][:2]:
                        print(f"        - {it['correctAnswer']}: {it['questionPart'][:60]!r}")
                elif r["type"] == "radio":
                    lq = r["list_of_questions"][0]
                    print(f"      radio/{r['question_form']} correct={lq['correct']} "
                          f"opts={[o['option_text'][:18] for o in lq['options']]} q={lq['question'][:55]!r}")
                else:
                    print(f"      fillup/{r['question_form']} text={r['question_text'][:80]!r}")

def selftest():
    # options BEFORE items (classify, letters)
    leg = ("Classify...Choose the correct letter, A, B or C, in boxes 1-6 below."
           "A.early adolescenceB.middle adolescenceC.late adolescence"
           "1.[___1___] becoming interested")
    assert parse_options(leg, ["A", "B", "C"]) == [
        "early adolescence", "middle adolescence", "late adolescence"], parse_options(leg, ["A", "B", "C"])
    # options AFTER items ("List of People")
    leg = ("Match each issue, A-F.1.[___1___] cost.2.[___2___] effects."
           "List of People and organisationsA.Scott KlaraB.Intergovernmental PanelC.Energy Agency")
    assert parse_options(leg, ["A", "B", "C"]) == [
        "Scott Klara", "Intergovernmental Panel", "Energy Agency"]
    # stray question number glued into the label: 'A36.' -> option A
    leg = "ending, A-C below.A36.first.B.second.C.third.36.[___36___] x"
    assert parse_options(leg, ["A", "B", "C"]) == ["first.", "second.", "third"]
    # roman headings
    leg = ("List of Headingsi.Aii.Biii.C14.[___14___] Paragraph A")
    assert parse_options(leg, ["i", "ii", "iii"]) == ["A", "B", "C"]
    # bare letters (which paragraph) -> no labelled defs
    leg = "Which paragraph contains...A-G.27.[___27___] overview"
    assert parse_options(leg, ["A", "B", "C", "D", "E", "F", "G"]) is None
    print("selftest OK")


if __name__ == "__main__":
    if "--apply" in sys.argv:
        apply(load_env())
    elif "--selftest" in sys.argv:
        selftest()
    else:
        dry()
