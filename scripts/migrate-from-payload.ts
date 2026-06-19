/**
 * Content Migration Script — Payload v3 (Supabase PostgreSQL) → Directus
 *
 * Payload is no longer running; this script reads its tables directly from
 * the Supabase PostgreSQL database and writes to the Directus REST API.
 *
 * Usage:
 *   SUPABASE_DATABASE_URL="postgresql://..." \
 *   DIRECTUS_URL=https://cms.ourmoon.org.uk \
 *   DIRECTUS_TOKEN=<your-directus-static-token> \
 *   npx tsx scripts/migrate-from-payload.ts [--dry-run] [--discover] [--collection blog_posts]
 *
 * Options:
 *   --dry-run        Log what would be done without writing to Directus
 *   --discover       Print all Payload table names and columns, then exit
 *   --collection X   Only migrate a single collection
 *   --skip-images    Skip media import (leave image fields null)
 *
 * Required env vars:
 *   SUPABASE_DATABASE_URL   Supabase PostgreSQL connection string
 *   DIRECTUS_URL            Directus instance URL
 *   DIRECTUS_TOKEN          Directus admin static token
 *
 * Optional:
 *   AZURE_STORAGE_PREFIX    Override for media URL prefix
 *                           Default: https://ourmoonwebassets.blob.core.windows.net/assets
 */

import pg from 'pg'
import { randomUUID } from 'crypto'

const { Pool } = pg

// ── Config ────────────────────────────────────────────────────────────────────

const DATABASE_URL = process.env.SUPABASE_DATABASE_URL ?? ''
const DIRECTUS_URL = process.env.DIRECTUS_URL ?? 'https://cms.ourmoon.org.uk'
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN ?? ''
const AZURE_STORAGE_PREFIX =
  process.env.AZURE_STORAGE_PREFIX ??
  'https://ourmoonwebassets.blob.core.windows.net/assets'

const args = process.argv.slice(2)
const DRY_RUN = args.includes('--dry-run')
const DISCOVER = args.includes('--discover')
const SKIP_IMAGES = args.includes('--skip-images')
const ONLY_COLLECTION = args.find((a, i) => args[i - 1] === '--collection')

// ── PostgreSQL pool ────────────────────────────────────────────────────────────

let pool: pg.Pool | null = null

function getPool(): pg.Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    })
  }
  return pool
}

async function dbQuery<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const client = await getPool().connect()
  try {
    const result = await client.query(sql, params)
    return result.rows as T[]
  } finally {
    client.release()
  }
}

// ── Discover mode ─────────────────────────────────────────────────────────────

async function discoverSchema(): Promise<void> {
  console.log('\n=== Discovering Payload tables in Supabase ===\n')
  const tables = await dbQuery<{ table_name: string }>(
    `SELECT table_name FROM information_schema.tables
     WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
     ORDER BY table_name`
  )
  for (const { table_name } of tables) {
    const cols = await dbQuery<{ column_name: string; data_type: string }>(
      `SELECT column_name, data_type FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = $1
       ORDER BY ordinal_position`,
      [table_name]
    )
    const colList = cols.map((c) => `${c.column_name} (${c.data_type})`).join(', ')
    console.log(`${table_name}:\n  ${colList}\n`)
  }
}

// ── Lexical JSON → HTML ────────────────────────────────────────────────────────

type LexicalNode =
  | { type: 'root'; children: LexicalNode[] }
  | { type: 'paragraph'; children: LexicalNode[] }
  | { type: 'heading'; tag: string; children: LexicalNode[] }
  | { type: 'list'; listType: 'bullet' | 'number'; children: LexicalNode[] }
  | { type: 'listitem'; children: LexicalNode[] }
  | { type: 'quote'; children: LexicalNode[] }
  | { type: 'link'; url: string; children: LexicalNode[] }
  | { type: 'text'; text: string; format: number }
  | { type: 'linebreak' }
  | { type: 'upload'; value?: { url?: string; alt?: string }; fields?: { alt?: string } }
  | { type: string; [key: string]: any }

function serializeNode(node: LexicalNode): string {
  switch (node.type) {
    case 'root':
      return node.children.map(serializeNode).join('')
    case 'paragraph':
      return `<p>${node.children.map(serializeNode).join('')}</p>`
    case 'heading': {
      const tag = (node as any).tag ?? 'h2'
      return `<${tag}>${node.children.map(serializeNode).join('')}</${tag}>`
    }
    case 'list': {
      const tag = (node as any).listType === 'number' ? 'ol' : 'ul'
      return `<${tag}>${node.children.map(serializeNode).join('')}</${tag}>`
    }
    case 'listitem':
      return `<li>${node.children.map(serializeNode).join('')}</li>`
    case 'quote':
      return `<blockquote>${node.children.map(serializeNode).join('')}</blockquote>`
    case 'link':
      return `<a href="${escapeHtml((node as any).url ?? '')}">${node.children.map(serializeNode).join('')}</a>`
    case 'text': {
      let t = escapeHtml((node as any).text ?? '')
      const fmt = (node as any).format ?? 0
      if (fmt & 1) t = `<strong>${t}</strong>`
      if (fmt & 2) t = `<em>${t}</em>`
      if (fmt & 8) t = `<u>${t}</u>`
      if (fmt & 4) t = `<s>${t}</s>`
      if (fmt & 16) t = `<code>${t}</code>`
      return t
    }
    case 'linebreak':
      return '<br>'
    case 'upload': {
      const url = (node as any).value?.url ?? (node as any).url ?? ''
      const alt = (node as any).fields?.alt ?? (node as any).value?.alt ?? ''
      if (!url) return ''
      return `<figure><img src="${escapeHtml(url)}" alt="${escapeHtml(alt)}"></figure>`
    }
    default:
      if ('children' in node && Array.isArray((node as any).children)) {
        return (node as any).children.map(serializeNode).join('')
      }
      return ''
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function lexicalToHtml(lexical: any): string {
  if (!lexical) return ''
  if (typeof lexical === 'string') {
    try { lexical = JSON.parse(lexical) } catch { return lexical }
  }
  try {
    const root = lexical.root ?? lexical
    return serializeNode(root as LexicalNode).trim()
  } catch {
    return ''
  }
}

// ── Media import cache ────────────────────────────────────────────────────────

// Map from Payload media ID → Directus file ID
const mediaIdCache = new Map<string, string>()

interface PayloadMedia {
  id: string
  filename: string
  alt: string | null
  url: string | null
  mime_type: string | null
}

async function getPayloadMedia(payloadId: string | number | null): Promise<string | null> {
  if (!payloadId) return null
  if (SKIP_IMAGES) return null
  const key = String(payloadId)
  if (mediaIdCache.has(key)) return mediaIdCache.get(key)!

  const rows = await dbQuery<PayloadMedia>(
    `SELECT id, filename, alt, url, mime_type FROM media WHERE id = $1 LIMIT 1`,
    [Number(payloadId)]
  ).catch(async () =>
    dbQuery<PayloadMedia>(
      `SELECT id, filename, alt, url FROM media WHERE id = $1 LIMIT 1`,
      [Number(payloadId)]
    )
  )
  const row = rows[0]
  if (!row) return null

  const fileUrl = row.url ?? `${AZURE_STORAGE_PREFIX}/${row.filename}`
  const directusId = await importUrlToDirectus(fileUrl, row.alt ?? row.filename ?? '')
  if (directusId) mediaIdCache.set(key, directusId)
  return directusId
}

async function importUrlToDirectus(url: string, title: string): Promise<string | null> {
  if (!url) return null
  if (DRY_RUN) {
    console.log(`  [dry-run] Would import: ${url}`)
    return null
  }
  try {
    const res = await directusFetch('/files/import', {
      method: 'POST',
      body: JSON.stringify({ url, data: { title } }),
    })
    const id: string | undefined = res?.data?.id
    if (id) {
      mediaIdCache.set(url, id)
      return id
    }
    return null
  } catch (e) {
    console.warn(`  Failed to import ${url}:`, (e as Error).message)
    return null
  }
}

// ── Directus helpers ──────────────────────────────────────────────────────────

async function directusFetch(path: string, options: RequestInit = {}): Promise<any> {
  const res = await fetch(`${DIRECTUS_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${DIRECTUS_TOKEN}`,
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) ?? {}),
    },
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Directus ${res.status} ${path}: ${err.slice(0, 300)}`)
  }
  return res.json()
}

async function upsertBySlug(
  collection: string,
  slug: string,
  data: Record<string, any>
): Promise<void> {
  if (DRY_RUN) {
    console.log(`  [dry-run] upsert ${collection} slug="${slug}":`, JSON.stringify(data).slice(0, 120))
    return
  }
  const existing = await directusFetch(
    `/items/${collection}?filter[slug][_eq]=${encodeURIComponent(slug)}&limit=1`
  ).catch(() => null)

  if (existing?.data?.[0]) {
    const id = existing.data[0].id
    await directusFetch(`/items/${collection}/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
    console.log(`  Updated ${collection} id=${id} slug="${slug}"`)
  } else {
    const created = await directusFetch(`/items/${collection}`, { method: 'POST', body: JSON.stringify(data) })
    console.log(`  Created ${collection} id=${created?.data?.id} slug="${slug}"`)
  }
}

// ── Migrators ─────────────────────────────────────────────────────────────────

async function migrateBlogPosts() {
  console.log('\n=== Migrating blog_posts ===')
  // _status is Payload's versioning field; status is the custom "Draft/Published" select
  const rows = await dbQuery(`
    SELECT id, title, slug, _status, published_date, author, excerpt, content, featured_image_id
    FROM blog_posts
    ORDER BY published_date DESC NULLS LAST
  `)

  console.log(`  Found ${rows.length} blog posts`)
  for (const row of rows) {
    const imageId = await getPayloadMedia(row.featured_image_id)
    const slug = row.slug ?? slugify(row.title ?? 'untitled')
    await upsertBySlug('blog_posts', slug, {
      title: row.title,
      slug,
      status: row._status === 'published' ? 'published' : 'draft',
      date_published: row.published_date ?? null,
      excerpt: row.excerpt ?? null,
      content: lexicalToHtml(row.content),
      featured_image: imageId ?? null,
    })
  }
}

async function migrateEvents() {
  console.log('\n=== Migrating events ===')
  // Directus events schema: name (not title), location=integer FK to locations, no content/excerpt/date_published
  const rows = await dbQuery(`
    SELECT id, title, slug, _status, start_date, end_date,
           registration_link, featured_image_id
    FROM events
    ORDER BY start_date DESC NULLS LAST
  `)

  console.log(`  Found ${rows.length} events`)
  for (const row of rows) {
    const imageId = await getPayloadMedia(row.featured_image_id)
    const slug = row.slug ?? slugify(row.title ?? 'untitled')
    // Extract date portion only — Directus start_date/end_date are type 'date' not timestamp
    const toDate = (v: any) => v ? (v instanceof Date ? v.toISOString() : String(v)).split('T')[0] : null
    await upsertBySlug('events', slug, {
      name: row.title,   // Directus uses 'name' not 'title'
      slug,
      status: row._status === 'published' ? 'published' : 'draft',
      start_date: toDate(row.start_date),
      end_date: toDate(row.end_date),
      registration_url: row.registration_link ?? null,
      featured_image: imageId ?? null,
    })
  }
}

async function migrateProgrammes() {
  console.log('\n=== Migrating programmes ===')
  const rows = await dbQuery(`
    SELECT id, title, slug, _status, published_date, short_description,
           description, featured_image_id, age_range, duration
    FROM programmes
    ORDER BY created_at DESC NULLS LAST
  `)

  console.log(`  Found ${rows.length} programmes`)
  for (const row of rows) {
    if (!row.title) { console.log('  Skipping programme with null title'); continue }
    const imageId = await getPayloadMedia(row.featured_image_id)
    const slug = row.slug ?? slugify(row.title ?? 'untitled')
    await upsertBySlug('programmes', slug, {
      title: row.title,
      slug,
      status: row._status === 'published' ? 'published' : 'draft',
      date_published: row.published_date ?? null,
      short_description: row.short_description ?? null,
      description: lexicalToHtml(row.description),
      featured_image: imageId ?? null,
      age_range: row.age_range ?? null,
      duration: row.duration ?? null,
    })
  }
}

async function migrateStudentStories() {
  console.log('\n=== Migrating student_stories ===')
  const rows = await dbQuery(`
    SELECT id, student_name, slug, _status, featured, short_quote, story, photo_id
    FROM student_stories
    ORDER BY created_at DESC NULLS LAST
  `)

  console.log(`  Found ${rows.length} student stories`)
  for (const row of rows) {
    const photoId = await getPayloadMedia(row.photo_id)
    const name: string = row.student_name ?? 'Unknown'
    const slug = row.slug ?? slugify(name)
    await upsertBySlug('student_stories', slug, {
      name,
      slug,
      status: row._status === 'published' ? 'published' : 'draft',
      featured: row.featured ?? false,
      short_quote: row.short_quote ?? null,
      story: lexicalToHtml(row.story),
      photo: photoId ?? null,
    })
  }
}

async function migrateTeamMembers() {
  console.log('\n=== Migrating team_members ===')
  const rows = await dbQuery(`
    SELECT id, name, role, region, status, "order", bio, photo_id
    FROM team_members
    ORDER BY "order" ASC NULLS LAST
  `)

  console.log(`  Found ${rows.length} team members`)
  for (const row of rows) {
    const photoId = await getPayloadMedia(row.photo_id)
    if (!row.name) continue
    if (DRY_RUN) {
      console.log(`  [dry-run] Would upsert team_members: ${row.name}`)
      continue
    }
    // team_members has no slug — match by name
    const existing = await directusFetch(
      `/items/team_members?filter[name][_eq]=${encodeURIComponent(row.name)}&limit=1`
    ).catch(() => null)

    // Directus uses 'category' not 'region'; UUID id must be provided explicitly on create
    const data = {
      name: row.name,
      role: row.role ?? '',
      category: row.region ?? 'uk',
      status: row.status === 'published' ? 'published' : 'draft',
      sort: row.order ?? 0,
      bio: row.bio ?? null,
      photo: photoId ?? null,
    }

    if (existing?.data?.[0]) {
      const id = existing.data[0].id
      await directusFetch(`/items/team_members/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
      console.log(`  Updated team_members id=${id} name="${row.name}"`)
    } else {
      const created = await directusFetch('/items/team_members', { method: 'POST', body: JSON.stringify({ id: randomUUID(), ...data }) })
      console.log(`  Created team_members id=${created?.data?.id} name="${row.name}"`)
    }
  }
}

async function migrateImpactStats() {
  console.log('\n=== Migrating impact_stats ===')
  const rows = await dbQuery(`
    SELECT id, value, label, status, "order"
    FROM impact_stats
    ORDER BY "order" ASC NULLS LAST
  `)

  console.log(`  Found ${rows.length} impact stats`)
  for (const row of rows) {
    if (!row.value || !row.label) continue
    if (DRY_RUN) {
      console.log(`  [dry-run] Would upsert impact_stats: ${row.value} — ${row.label}`)
      continue
    }
    // Match by label
    const existing = await directusFetch(
      `/items/impact_stats?filter[label][_eq]=${encodeURIComponent(row.label)}&limit=1`
    ).catch(() => null)

    const data = {
      value: row.value,
      label: row.label,
      status: row.status === 'published' ? 'published' : 'draft',
      sort: row.order ?? 0,
    }

    if (existing?.data?.[0]) {
      const id = existing.data[0].id
      await directusFetch(`/items/impact_stats/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
      console.log(`  Updated impact_stats id=${id} label="${row.label}"`)
    } else {
      // UUID id must be provided explicitly on create for this collection
      const created = await directusFetch('/items/impact_stats', { method: 'POST', body: JSON.stringify({ id: randomUUID(), ...data }) })
      console.log(`  Created impact_stats id=${created?.data?.id} label="${row.label}"`)
    }
  }
}

// ── Utilities ─────────────────────────────────────────────────────────────────

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

// ── Entry point ───────────────────────────────────────────────────────────────

async function main() {
  if (!DIRECTUS_TOKEN) {
    console.error('Error: DIRECTUS_TOKEN is required')
    process.exit(1)
  }
  if (!DATABASE_URL) {
    console.error('Error: SUPABASE_DATABASE_URL is required')
    process.exit(1)
  }

  if (DISCOVER) {
    await discoverSchema()
    await getPool().end()
    return
  }

  if (DRY_RUN) console.log('DRY RUN — no writes will be made to Directus\n')

  const collections: Record<string, () => Promise<void>> = {
    blog_posts: migrateBlogPosts,
    events: migrateEvents,
    programmes: migrateProgrammes,
    student_stories: migrateStudentStories,
    team_members: migrateTeamMembers,
    impact_stats: migrateImpactStats,
  }

  const toRun = ONLY_COLLECTION ? [ONLY_COLLECTION] : Object.keys(collections)

  for (const name of toRun) {
    if (!collections[name]) {
      console.error(`Unknown collection: ${name}. Valid: ${Object.keys(collections).join(', ')}`)
      continue
    }
    try {
      await collections[name]()
    } catch (e) {
      console.error(`Error migrating ${name}:`, (e as Error).message)
    }
  }

  await getPool().end()
  console.log('\nMigration complete.')
}

main()
