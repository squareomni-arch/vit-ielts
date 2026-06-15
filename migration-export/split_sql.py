"""
Split pg_dump INSERT-format SQL into per-table SQL Editor-compatible files.
Fixes: removes \restrict token, comments transaction_timeout, wraps in session_replication_role.
Large tables (>2MB) are split into numbered chunks.
"""

import re
import os

INPUT = r"D:\Projects\00-vitielts\Vit-IELTS\migration-export\data-inserts-v3.sql"
OUT_DIR = r"D:\Projects\00-vitielts\Vit-IELTS\migration-export\sql-editor"
MAX_BYTES = 2 * 1024 * 1024  # 2 MB per file

HEADER = """\
-- ============================================================
-- Supabase SQL Editor — table: {table}  chunk: {chunk}
-- Run with: session_replication_role=replica (FK triggers off)
-- ============================================================
SET session_replication_role = replica;

"""

FOOTER = """\

SET session_replication_role = DEFAULT;
"""

os.makedirs(OUT_DIR, exist_ok=True)

# ── Parse: split by table block ──────────────────────────────
table_pattern = re.compile(
    r"--\s*\n-- Data for Name: (\w+); Type: TABLE DATA; Schema: public",
    re.MULTILINE,
)

with open(INPUT, encoding="utf-8") as f:
    raw = f.read()

# Remove \restrict line (psql-only token)
raw = re.sub(r"^\\restrict .*\n", "", raw, flags=re.MULTILINE)

# Comment out transaction_timeout (PG17-only)
raw = raw.replace(
    "SET transaction_timeout = 0;",
    "-- SET transaction_timeout = 0;  -- PG17 only, commented out",
)

# Remove SET SESSION AUTHORIZATION DEFAULT (not needed)
raw = re.sub(r"^SET SESSION AUTHORIZATION DEFAULT;\n?", "", raw, flags=re.MULTILINE)

# ── Find table block boundaries ───────────────────────────────
splits = list(table_pattern.finditer(raw))
blocks = []
for i, m in enumerate(splits):
    start = m.start()
    end = splits[i + 1].start() if i + 1 < len(splits) else len(raw)
    blocks.append((m.group(1), raw[start:end].strip()))

print(f"Found {len(blocks)} table blocks\n")

summary = []

for table, block in blocks:
    # Split block into individual INSERT statements (each ends with ;)
    # Keep comment header as part of first chunk
    stmts = re.split(r"(?<=;)\n", block)

    chunk = 1
    current_lines = []
    current_size = 0

    def flush(lines, c):
        if not lines:
            return
        body = "\n".join(lines)
        fname = f"data_{table}_{c:03d}.sql"
        fpath = os.path.join(OUT_DIR, fname)
        with open(fpath, "w", encoding="utf-8") as f:
            f.write(HEADER.format(table=table, chunk=c))
            f.write(body)
            f.write(FOOTER)
        size_kb = os.path.getsize(fpath) / 1024
        print(f"  {fname}  ({size_kb:.0f} KB)")
        summary.append((table, c, fname, size_kb))

    for stmt in stmts:
        stmt_bytes = len(stmt.encode("utf-8"))
        if current_size + stmt_bytes > MAX_BYTES and current_lines:
            flush(current_lines, chunk)
            chunk += 1
            current_lines = []
            current_size = 0
        current_lines.append(stmt)
        current_size += stmt_bytes

    flush(current_lines, chunk)

print(f"\nDone — {len(summary)} files written to {OUT_DIR}")
