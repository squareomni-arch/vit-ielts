/**
 * Backup the Supabase Storage "media" bucket to an S3-compatible destination
 * (Cloudflare R2 recommended). Mirrors every object to `media/<path>` in the
 * backup bucket, incrementally (skips objects unchanged since the last run).
 *
 * Complements DB backups — run a nightly `pg_dump` / `supabase db dump` too.
 *
 * Usage:
 *   npx tsx scripts/backup-storage.ts            # incremental (default)
 *   npx tsx scripts/backup-storage.ts --full     # re-upload everything
 *
 * Env (see .env.example):
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY   (source bucket)
 *   BACKUP_S3_ENDPOINT, BACKUP_S3_REGION (default "auto"),
 *   BACKUP_S3_BUCKET, BACKUP_S3_ACCESS_KEY_ID, BACKUP_S3_SECRET_ACCESS_KEY
 *
 * Schedule on the VPS (service-role key already lives there), e.g. cron:
 *   0 3 * * *  cd /app && npx tsx scripts/backup-storage.ts >> /var/log/media-backup.log 2>&1
 *
 * Exits non-zero on any failure so cron can alert.
 */

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const BUCKET = "media";

const S3_ENDPOINT = process.env.BACKUP_S3_ENDPOINT!;
const S3_REGION = process.env.BACKUP_S3_REGION || "auto";
const S3_BUCKET = process.env.BACKUP_S3_BUCKET!;
const S3_ACCESS_KEY_ID = process.env.BACKUP_S3_ACCESS_KEY_ID!;
const S3_SECRET_ACCESS_KEY = process.env.BACKUP_S3_SECRET_ACCESS_KEY!;

const MANIFEST_KEY = "_manifest.json";
const FULL = process.argv.includes("--full");

function requireEnv(): void {
  const missing = [
    ["NEXT_PUBLIC_SUPABASE_URL", SUPABASE_URL],
    ["SUPABASE_SERVICE_ROLE_KEY", SERVICE_ROLE_KEY],
    ["BACKUP_S3_ENDPOINT", S3_ENDPOINT],
    ["BACKUP_S3_BUCKET", S3_BUCKET],
    ["BACKUP_S3_ACCESS_KEY_ID", S3_ACCESS_KEY_ID],
    ["BACKUP_S3_SECRET_ACCESS_KEY", S3_SECRET_ACCESS_KEY],
  ].filter(([, v]) => !v).map(([k]) => k);
  if (missing.length) {
    console.error(`❌ Missing env: ${missing.join(", ")}`);
    process.exit(1);
  }
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
const s3 = new S3Client({
  region: S3_REGION,
  endpoint: S3_ENDPOINT,
  credentials: { accessKeyId: S3_ACCESS_KEY_ID, secretAccessKey: S3_SECRET_ACCESS_KEY },
  forcePathStyle: true,
});

interface ObjectEntry {
  path: string;        // path within the media bucket, e.g. "images/foo.png"
  size: number;
  updatedAt: string;
  mimetype: string;
}

type Manifest = Record<string, { size: number; updatedAt: string }>;

// ─── source enumeration ───────────────────────────────────────────────────────

/** Recursively list every object under `prefix` in the media bucket. */
async function listAllObjects(prefix = ""): Promise<ObjectEntry[]> {
  const out: ObjectEntry[] = [];
  const pageSize = 100;
  let offset = 0;

  for (;;) {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .list(prefix, { limit: pageSize, offset, sortBy: { column: "name", order: "asc" } });
    if (error) throw new Error(`list("${prefix}") failed: ${error.message}`);
    if (!data || data.length === 0) break;

    for (const item of data) {
      const itemPath = prefix ? `${prefix}/${item.name}` : item.name;
      // Supabase returns folders as entries with a null `id` and no metadata.
      const isFolder = item.id === null;
      if (isFolder) {
        out.push(...(await listAllObjects(itemPath)));
      } else {
        const meta = (item.metadata ?? {}) as { size?: number; mimetype?: string };
        out.push({
          path: itemPath,
          size: meta.size ?? 0,
          updatedAt: item.updated_at ?? item.created_at ?? "",
          mimetype: meta.mimetype ?? "application/octet-stream",
        });
      }
    }

    if (data.length < pageSize) break;
    offset += pageSize;
  }
  return out;
}

// ─── manifest (stored remotely in the backup bucket) ──────────────────────────

async function streamToString(body: unknown): Promise<string> {
  // @aws-sdk Node stream → string
  const stream = body as NodeJS.ReadableStream;
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks).toString("utf-8");
}

async function loadManifest(): Promise<Manifest> {
  if (FULL) return {};
  try {
    const res = await s3.send(new GetObjectCommand({ Bucket: S3_BUCKET, Key: MANIFEST_KEY }));
    return JSON.parse(await streamToString(res.Body)) as Manifest;
  } catch {
    return {}; // first run / no manifest yet
  }
}

async function saveManifest(manifest: Manifest): Promise<void> {
  await s3.send(new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: MANIFEST_KEY,
    Body: JSON.stringify(manifest, null, 0),
    ContentType: "application/json",
  }));
}

// ─── transfer ─────────────────────────────────────────────────────────────────

function isUnchanged(obj: ObjectEntry, manifest: Manifest): boolean {
  const prev = manifest[obj.path];
  return !!prev && prev.size === obj.size && prev.updatedAt === obj.updatedAt;
}

async function backupOne(obj: ObjectEntry): Promise<void> {
  const { data, error } = await supabase.storage.from(BUCKET).download(obj.path);
  if (error || !data) throw new Error(`download ${obj.path} failed: ${error?.message}`);
  const buffer = Buffer.from(await data.arrayBuffer());
  await s3.send(new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: `${BUCKET}/${obj.path}`,
    Body: buffer,
    ContentType: obj.mimetype,
  }));
}

// ─── main ─────────────────────────────────────────────────────────────────────

async function main() {
  requireEnv();
  console.log(`╔══ Media backup → ${S3_BUCKET} (${FULL ? "FULL" : "incremental"}) ══╗`);

  const objects = await listAllObjects();
  console.log(`Found ${objects.length} object(s) in "${BUCKET}".`);

  const manifest = await loadManifest();
  const nextManifest: Manifest = {};
  let uploaded = 0, skipped = 0, failed = 0;

  for (const obj of objects) {
    const entry = { size: obj.size, updatedAt: obj.updatedAt };
    if (isUnchanged(obj, manifest)) {
      nextManifest[obj.path] = entry;
      skipped++;
      continue;
    }
    try {
      await backupOne(obj);
      nextManifest[obj.path] = entry; // record only after a successful upload
      uploaded++;
      if (uploaded % 25 === 0) console.log(`  …${uploaded} uploaded`);
    } catch (err) {
      // Leave out of the manifest so it is retried on the next run.
      failed++;
      console.error(`  ❌ ${obj.path}: ${(err as Error).message}`);
    }
  }

  await saveManifest(nextManifest);

  console.log(`╚══ Done — ${uploaded} uploaded, ${skipped} skipped, ${failed} failed ══╝`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error("\n❌ Fatal:", err.message);
  process.exit(1);
});
