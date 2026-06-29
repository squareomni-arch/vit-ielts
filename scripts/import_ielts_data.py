#!/usr/bin/env python3
"""
One-shot importer: ielts-data/  ->  Supabase (quizzes/passages/questions + audio).

Maps every scraped test to the app's quiz schema. All source question types
collapse to two DB types the take-the-test UI + scoring engine already handle:
  - fillup : answers embedded in question_text as {answer} (| = alt answers)
  - radio  : list_of_questions[].options[].option_text, correct = option index

Decisions (confirmed with user): status=draft, pro_user_only=true,
listening audio uploaded to the `media` bucket (study4 4-part files are
concatenated with ffmpeg; per-passage audio_start/end = cumulative durations).

Idempotent: quiz slug is deterministic (name + md5(relpath)[:6]); existing
slugs are skipped, so re-runs resume.

Usage:
  python3 scripts/import_ielts_data.py --dry-run [--limit N] [--only reading|listening]
  python3 scripts/import_ielts_data.py [--limit N] [--only ...]
# ponytail: inlines the 3-step quiz insert instead of importing the TS service
# (avoids tsx alias resolution). Logic mirrors services/quiz.ts createQuiz.
"""
import argparse, hashlib, json, os, re, subprocess, sys, tempfile, urllib.request, urllib.error
from glob import glob

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "ielts-data", "ielts-data")

# ---------- env ----------
def load_env():
    env = {}
    with open(os.path.join(ROOT, ".env.local")) as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            env[k.strip()] = v.strip().strip('"').strip("'")
    return env

ENV = load_env()
URL = ENV["NEXT_PUBLIC_SUPABASE_URL"].rstrip("/")
KEY = ENV["SUPABASE_SERVICE_ROLE_KEY"]
H = {"apikey": KEY, "Authorization": f"Bearer {KEY}", "Content-Type": "application/json"}

# ---------- http ----------
def req(method, path, body=None, headers=None, raw=None, expect_json=True):
    url = path if path.startswith("http") else URL + path
    data = raw if raw is not None else (json.dumps(body).encode() if body is not None else None)
    r = urllib.request.Request(url, data=data, method=method, headers={**H, **(headers or {})})
    try:
        with urllib.request.urlopen(r) as resp:
            payload = resp.read()
            return json.loads(payload) if (expect_json and payload) else payload
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"{method} {url} -> {e.code}: {e.read().decode()[:400]}")

def insert(table, rows):
    return req("POST", f"/rest/v1/{table}", body=rows,
               headers={"Prefer": "return=representation"})

def quiz_exists(slug):
    rows = req("GET", f"/rest/v1/quizzes?slug=eq.{slug}&select=id")
    return rows[0]["id"] if rows else None

# ---------- storage ----------
def upload_audio(local_or_buf, dest_name):
    key = f"audio/{dest_name}"
    public = f"{URL}/storage/v1/object/public/media/{key}"
    buf = local_or_buf if isinstance(local_or_buf, bytes) else open(local_or_buf, "rb").read()
    req("POST", f"/storage/v1/object/media/{key}", raw=buf,
        headers={"Content-Type": "audio/mpeg", "x-upsert": "true"}, expect_json=False)
    return public

def ffprobe_dur(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                          "-of", "default=nw=1:nk=1", path], capture_output=True, text=True)
    return float(out.stdout.strip())

def concat_mp3(parts, out_path):
    listfile = out_path + ".txt"
    with open(listfile, "w") as f:
        for p in parts:
            f.write(f"file '{p}'\n")
    subprocess.run(["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", listfile,
                    "-c", "copy", out_path], check=True, capture_output=True)
    os.remove(listfile)

# ---------- text helpers ----------
def slugify(s):
    s = re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")
    return s[:80] or "quiz"

def humanize(name):
    t = re.sub(r"[-_]+", " ", name).strip()
    t = re.sub(r"\bremix\b", "", t, flags=re.I).strip()
    t = " ".join(w.upper() if w.lower() == "ielts" else w.capitalize() for w in t.split())
    return t

def html_paragraphs(text):
    if not text:
        return ""
    return "".join(f"<p>{ln.strip()}</p>" for ln in text.splitlines() if ln.strip())

def brace(ans):
    return "{" + str(ans).replace("/", "|").strip() + "}"

UNDERSCORE = re.compile(r"_{2,}")
def fillup_text(text, ans):
    text = (text or "").strip()
    if UNDERSCORE.search(text):
        return UNDERSCORE.sub(brace(ans), text, count=1)
    return (text + " " + brace(ans)).strip()

def letter_idx(ans):
    a = re.sub(r"[^A-Za-z]", "", str(ans)).upper()
    return ord(a[0]) - 65 if a else 0

def idx_of(options, ans):
    a = str(ans).strip().lower()
    for i, o in enumerate(options):
        if str(o).strip().lower() == a:
            return i
    return -1

def roman_idx(options, ans):
    a = re.split(r"[.\s]", str(ans).strip(), maxsplit=1)[0].lower()
    for i, o in enumerate(options):
        head = re.split(r"[.\s]", str(o).strip(), maxsplit=1)[0].lower()
        if head == a:
            return i
    return -1

# ---------- question builders ----------
def q_radio(question, option_texts, correct, expl=None, instructions=None):
    return {
        "type": "radio", "title": None, "question_text": "",
        "instructions": instructions or "", "question_form": None,
        "list_of_questions": [{
            "question": question or "",
            "correct": correct,
            "options": [{"option_text": str(o)} for o in option_texts],
        }],
        "list_of_options": None, "matching_question": None, "matrix_question": None,
        "explanations": [{"content": expl}] if expl else None,
    }

def q_fillup(question_text, expl=None, instructions=None):
    return {
        "type": "fillup", "title": None, "question_text": question_text,
        "instructions": instructions or "", "question_form": None,
        "list_of_questions": None, "list_of_options": None,
        "matching_question": None, "matrix_question": None,
        "explanations": [{"content": expl}] if expl else None,
    }

WARN = []
def warn(msg):
    WARN.append(msg)

# ---------- study4 family (General, study4-reading, study4-listening) ----------
def convert_study4_question(q, ctx, src):
    t = q.get("type")
    text = q.get("text", "")
    ans = q.get("answer", "")
    opts = q.get("options", []) or []
    expl = q.get("explanation")

    if t in ("fill_blank", "summary_completion", "short_answer"):
        return q_fillup(fillup_text(text, ans), expl, ctx)
    if t in ("true_false_notgiven", "yes_no_notgiven"):
        ol = [str(o) for o in opts] or (
            ["TRUE", "FALSE", "NOT GIVEN"] if "true" in t else ["YES", "NO", "NOT GIVEN"])
        ci = idx_of(ol, ans)
    elif t == "choice":
        if opts and isinstance(opts[0], dict):
            ol = [o.get("label", o.get("value")) for o in opts]
            vals = [o.get("value") for o in opts]
            ci = vals.index(ans) if ans in vals else idx_of(ol, ans)
        else:  # letter-prefixed strings ("A. endorphins"), answer = letter or text
            ol = [str(o) for o in opts]
            ci = idx_of(ol, ans)
            if ci < 0:
                ci = letter_idx(ans)
    elif t == "multiple_choice":
        ol = [str(o) for o in opts]
        ci = idx_of(ol, ans)
        if ci < 0:
            ci = letter_idx(ans)
    elif t == "matching_headings":
        ol = [str(o) for o in opts]
        ci = idx_of(ol, ans)
        if ci < 0:
            ci = roman_idx(ol, ans)
        if ci < 0:
            ci = roman_idx(ol, str(ans).split(".", 1)[0])
    else:
        warn(f"{src}: unknown type {t!r} -> fillup fallback")
        return q_fillup(fillup_text(text, ans), expl, ctx)

    if ci < 0:
        warn(f"{src}: answer {ans!r} not in options for {t} -> idx 0")
        ci = 0
    return q_radio(text, ol, ci, expl, ctx)

def build_ctx_map(d):
    m = {}
    for b in d.get("context_blocks", []):
        txt = " ".join(x for x in [b.get("instruction"), b.get("text")] if x)
        for n in b.get("numbers", []):
            try:
                m[int(n)] = txt
            except (ValueError, TypeError):
                pass
    return m

def convert_study4(path, rel):
    d = json.load(open(path))
    skill = d.get("skill") or ("listening" if "listening" in rel else "reading")
    name = d.get("name") or os.path.splitext(os.path.basename(path))[0]
    ctx = build_ctx_map(d)
    qs = sorted(d.get("questions", []), key=lambda q: q.get("number", 0))
    src = os.path.basename(path)

    quiz = base_quiz(name, rel, skill)
    audio_parts = None

    if skill == "listening":
        # 4 sections × 10 Q (standard). transcripts/audio align by part.
        transcripts = d.get("transcripts", [])
        passages = []
        for i in range(4):
            grp = [q for q in qs if (q.get("number", 0) - 1) // 10 == i]
            if not grp:
                continue
            passages.append({
                "title": f"Part {i + 1}",
                "content": html_paragraphs(transcripts[i]) if i < len(transcripts) else "",
                "sort_order": i,
                "start_question_number": grp[0].get("number", i * 10 + 1),
                "audio_start": None, "audio_end": None,  # filled after concat
                "_questions": grp, "_part": i,
            })
        # local part mp3 files: <basename>_audio/partN.mp3
        adir = os.path.join(os.path.dirname(path),
                            os.path.splitext(os.path.basename(path))[0] + "_audio")
        if os.path.isdir(adir):
            audio_parts = [os.path.join(adir, f"part{i + 1}.mp3") for i in range(4)
                           if os.path.exists(os.path.join(adir, f"part{i + 1}.mp3"))]
    else:
        passages = [{
            "title": "Reading Passage", "sort_order": 0,
            "content": "".join(html_paragraphs(p) for p in d.get("passages", [])),
            "start_question_number": qs[0].get("number", 1) if qs else 1,
            "audio_start": None, "audio_end": None, "_questions": qs, "_part": None,
        }]

    for p in passages:
        p["_built"] = [
            {**convert_study4_question(q, ctx.get(q.get("number")), src), "sort_order": j}
            for j, q in enumerate(p.pop("_questions"))
        ]
    return quiz, passages, audio_parts, "study4"

# ---------- mock 2026 (ieltsonlinetests) ----------
def convert_mock(path, rel):
    d = json.load(open(path))
    skill = "listening" if "listening" in rel else "reading"
    answers = (d.get("solution") or {}).get("answers", {})
    src = os.path.basename(path)
    quiz = base_quiz(d.get("title") or os.path.basename(path), rel, skill, mock=True)

    passages = []
    for pi, part in enumerate(d.get("parts", [])):
        built = []
        # group consecutive fill_blanks sharing the same context into one fillup
        fb_groups = {}
        order = []
        for q in part.get("questions", []):
            t = q.get("type")
            num = q.get("number")
            ans = q.get("answer") or answers.get(str(num), "")
            if t == "fill_blank":
                ctx = q.get("context", "")
                key = ctx or f"_{num}"
                if key not in fb_groups:
                    fb_groups[key] = {"ctx": ctx, "blanks": []}
                    order.append(("fb", key))
                fb_groups[key]["blanks"].append((num, ans))
            elif t == "multiple_choice":
                ol = [o.get("text", o.get("option", "")) for o in q.get("options", [])]
                order.append(("q", q_radio(q.get("question") or q.get("statement", ""),
                                           ol, letter_idx(ans), q.get("explanation"))))
            elif t in ("matching", "true_false_notgiven", "yes_no_notgiven",
                       "matching_headings", "choice"):
                ol = q.get("choices") or [str(o) for o in q.get("options", [])]
                ci = idx_of(ol, ans)
                if ci < 0:
                    ci = roman_idx(ol, ans)
                if ci < 0:
                    ci = letter_idx(ans)
                order.append(("q", q_radio(q.get("statement") or q.get("question", ""),
                                           ol, ci, q.get("explanation"), q.get("legend"))))
            else:
                warn(f"{src}: mock unknown type {t!r}")
        for kind, val in order:
            if kind == "q":
                built.append(val)
            else:
                g = fb_groups[val]
                txt = g["ctx"]
                if txt:
                    for num, ans in g["blanks"]:
                        txt = re.sub(rf"\[_+{num}_+\]", brace(ans), txt, count=1)
                    # any leftover [___N___] with no answer -> leave as blank input
                    txt = re.sub(r"\[_+\d+_+\]", "{}", txt)
                else:
                    txt = " ".join(brace(a) for _, a in g["blanks"])
                built.append(q_fillup(html_paragraphs(txt) if "\n" in g["ctx"] else txt))
        for j, b in enumerate(built):
            b["sort_order"] = j
        nums = [q.get("number") for q in part.get("questions", []) if q.get("number")]
        passages.append({
            "title": part.get("passage_title") or part.get("part_title") or f"Part {pi + 1}",
            "content": html_paragraphs(part.get("passage", "")),
            "sort_order": pi, "start_question_number": min(nums) if nums else None,
            "audio_start": None, "audio_end": None, "_built": built,
        })

    audio = None
    if skill == "listening":
        local = os.path.splitext(path)[0] + ".mp3"
        if os.path.exists(local):
            audio = local
    return quiz, passages, audio, "mock"

# ---------- quiz scaffold ----------
def base_quiz(name, rel, skill, mock=False):
    h = hashlib.md5(rel.encode()).hexdigest()[:6]
    title = name if mock else humanize(name)
    qtype = "practice" if mock else ("general" if rel.startswith("IELTS General") else "academic")
    return {
        "title": title,
        "slug": f"{slugify(name)}-{h}",
        "excerpt": None, "type": qtype, "skill": skill,
        "time_minutes": 60 if skill == "reading" else 40,
        "pro_user_only": True, "score_type": None, "featured_image": None,
        "audio_url": None, "pdf_url": None,
        "source": "IELTS Online Tests" if mock else "Study4",
        "year": "2026" if mock else None,
        "quarter": None, "part": None, "question_form": None, "status": "draft",
    }

# ---------- persist ----------
def persist(quiz, passages, audio, family, dry):
    slug = quiz["slug"]
    existing = quiz_exists(slug)
    if existing:
        return "skip"
    if dry:
        return "ok"

    # audio: concat study4 parts or use single mock file, then upload
    if audio:
        if family == "study4" and isinstance(audio, list):
            with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as tf:
                out = tf.name
            concat_mp3(audio, out)
            durs = [ffprobe_dur(p) for p in audio]
            acc = 0.0
            for i, p in enumerate(passages):
                if i < len(durs):
                    p["audio_start"] = int(acc)
                    acc += durs[i]
                    p["audio_end"] = int(round(acc))
            quiz["audio_url"] = upload_audio(out, f"{slug}.mp3")
            os.remove(out)
        else:
            quiz["audio_url"] = upload_audio(audio, f"{slug}.mp3")

    row = insert("quizzes", quiz)[0]
    qid = row["id"]
    try:  # roll back the quiz row if nested inserts fail (no orphan quizzes)
        prows = insert("passages", [{
            "quiz_id": qid, "title": p["title"], "content": p["content"],
            "sort_order": p["sort_order"], "audio_start": p["audio_start"],
            "audio_end": p["audio_end"], "start_question_number": p["start_question_number"],
        } for p in passages])
        prows.sort(key=lambda r: r["sort_order"])
        questions = []
        for p, pr in zip(sorted(passages, key=lambda x: x["sort_order"]), prows):
            for b in p["_built"]:
                questions.append({**b, "passage_id": pr["id"]})
        for i in range(0, len(questions), 200):  # chunk under payload limits
            insert("questions", questions[i:i + 200])
    except Exception:
        req("DELETE", f"/rest/v1/quizzes?id=eq.{qid}", expect_json=False)
        raise
    return "ok"

# ---------- main ----------
def discover():
    files = []
    for f in sorted(glob(os.path.join(DATA, "IELTS General", "*.json"))):
        files.append((f, os.path.relpath(f, DATA), convert_study4))
    for f in sorted(glob(os.path.join(DATA, "IELTS Academic", "study4-*", "*", "*.json"))):
        files.append((f, os.path.relpath(f, DATA), convert_study4))
    for f in sorted(glob(os.path.join(DATA, "Bộ đề thi máy 2026", "*.json"))):
        files.append((f, os.path.relpath(f, DATA), convert_mock))
    return files

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--limit", type=int, default=0)
    ap.add_argument("--only", choices=["reading", "listening"], default=None)
    args = ap.parse_args()

    files = discover()
    stats = {"ok": 0, "skip": 0, "error": 0, "questions": 0}
    done = 0
    for path, rel, conv in files:
        try:
            quiz, passages, audio, family = conv(path, rel)
        except Exception as e:
            print(f"  PARSE ERROR {rel}: {e}")
            stats["error"] += 1
            continue
        if args.only and quiz["skill"] != args.only:
            continue
        nq = sum(len(p["_built"]) for p in passages)
        try:
            res = persist(quiz, passages, audio, family, args.dry_run)
        except Exception as e:
            print(f"  WRITE ERROR {rel}: {e}")
            stats["error"] += 1
            continue
        stats[res] += 1
        if res == "ok":
            stats["questions"] += nq
        flag = {"ok": "DRY" if args.dry_run else "OK ", "skip": "SKIP"}[res]
        print(f"  [{flag}] {quiz['skill']:9} {nq:3}q  {quiz['title'][:60]}")
        done += 1
        if args.limit and done >= args.limit:
            break

    print("\n--- summary ---")
    print(f"quizzes ok/skip/error: {stats['ok']}/{stats['skip']}/{stats['error']}"
          f"   questions: {stats['questions']}")
    if WARN:
        print(f"warnings: {len(WARN)} (showing 15)")
        for w in WARN[:15]:
            print("  !", w)

if __name__ == "__main__":
    main()
