/**
 * Layer 11: Content Migration Script — Payload CMS → Directus
 *
 * Usage:
 *   PAYLOAD_URL=https://content.ourmoon.org.uk \
 *   PAYLOAD_EMAIL=admin@ourmoon.org.uk \
 *   PAYLOAD_PASSWORD=yourpassword \
 *   DIRECTUS_URL=https://cms.ourmoon.org.uk \
 *   DIRECTUS_TOKEN=<your-directus-static-token> \
 *   npx tsx scripts/migrate-from-payload.ts [--dry-run] [--collection blog_posts]
 *
 * Options:
 *   --dry-run        Log what would be done without writing to Directus
 *   --collection X   Only migrate a single collection (slug)
 *   --skip-images    Skip image import (use null for image fields)
 */

const PAYLOAD_URL = process.env.PAYLOAD_URL ?? 'https://content.ourmoon.org.uk'
const DIRECTUS_URL = process.env.DIRECTUS_URL ?? 'https://cms.ourmoon.org.uk'
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN ?? ''

const args = process.argv.slice(2)
const DRY_RUN = args.includes('--dry-run')
const SKIP_IMAGES = args.includes('--skip-images')
const ONLY_COLLECTION = args.find((a, i) => args[i - 1] === '--collection')

// --- Lexical JSON → HTML ---

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
    case 'heading':
      return `<${node.tag}>${node.children.map(serializeNode).join('')}</${node.tag}>`
    case 'list':
      const tag = node.listType === 'number' ? 'ol' : 'ul'
      return `<${tag}>${node.children.map(serializeNode).join('')}</${tag}>`
    case 'listitem':
      return `<li>${node.children.map(serializeNode).join('')}</li>`
    case 'quote':
      return `<blockquote>${node.children.map(serializeNode).join('')}</blockquote>`
    case 'link':
      return `<a href="${escapeHtml(node.url)}">${node.children.map(serializeNode).join('')}</a>`
    case 'text': {
      let t = escapeHtml(node.text)
      const fmt = node.format
      if (fmt & 1) t = `<strong>${t}</strong>`  // bold
      if (fmt & 2) t = `<em>${t}</em>`            // italic
      if (fmt & 8) t = `<u>${t}</u>`              // underline
      if (fmt & 4) t = `<s>${t}</s>`              // strikethrough
      if (fmt & 16) t = `<code>${t}</code>`        // code
      return t
    }
    case 'linebreak':
      return '<br>'
    case 'upload': {
      const url = node.value?.url ?? node.url ?? ''
      const alt = node.fields?.alt ?? node.value?.alt ?? ''
      if (!url) return ''
      return `<figure><img src="${escapeHtml(url)}" alt="${escapeHtml(alt)}"></figure>`
    }
    default:
      if ('children' in node && Array.isArray(node.children)) {
        return node.children.map(serializeNode).join('')
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
  if (typeof lexical === 'string') return lexical
  try {
    const root = lexical.root ?? lexical
    return serializeNode(root as LexicalNode).trim()
  } catch {
    return ''
  }
}

// --- Directus file import ---

const imageCache = new Map<string, string>()

async function importImageToDirectus(payloadUrl: string, alt?: string): Promise<string | null> {
  if (!payloadUrl) return null
  if (SKIP_IMAGES) return null
  if (imageCache.has(payloadUrl)) return imageCache.get(payloadUrl)!

  if (DRY_RUN) {
    console.log(`  [dry-run] Would import image: ${payloadUrl}`)
    return null
  }

  try {
    const res = await directusFetch('/files/import', {
      method: 'POST',
      body: JSON.stringify({ url: payloadUrl, data: { title: alt ?? '' } }),
    })
    const id = res?.data?.id
    if (id) {
      imageCache.set(payloadUrl, id)
      return id
    }
    return null
  } catch (e) {
    console.warn(`  Failed to import image ${payloadUrl}:`, (e as Error).message)
    return null
  }
}

// --- HTTP helpers ---

// Set PAYLOAD_USER_SLUG if your Payload users collection has a custom slug
const PAYLOAD_USER_SLUG = process.env.PAYLOAD_USER_SLUG ?? ''

let payloadToken: string | null = null
let payloadAuthResolved = false

async function resolvePayloadToken(): Promise<void> {
  if (payloadAuthResolved) return
  payloadAuthResolved = true

  const email = process.env.PAYLOAD_EMAIL
  const password = process.env.PAYLOAD_PASSWORD
  if (!email || !password) {
    console.log('  No PAYLOAD_EMAIL/PASSWORD set — using unauthenticated access')
    return
  }

  // Build list of slugs to try: explicit override first, then common names
  const slugsToTry = PAYLOAD_USER_SLUG
    ? [PAYLOAD_USER_SLUG]
    : ['users', 'admins', 'staff', 'editors', 'members']

  for (const slug of slugsToTry) {
    try {
      const res = await fetch(`${PAYLOAD_URL}/api/${slug}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (data.token) {
        console.log(`  Authenticated via /api/${slug}/login`)
        payloadToken = data.token
        return
      }
    } catch {}
  }
  console.warn('  Warning: Payload login failed for all known slugs — continuing without auth (draft content may be excluded)')
}

async function payloadFetch(path: string): Promise<any> {
  await resolvePayloadToken()
  const headers: Record<string, string> = {}
  if (payloadToken) headers['Authorization'] = `Bearer ${payloadToken}`
  const res = await fetch(`${PAYLOAD_URL}/api${path}`, { headers })
  if (!res.ok) throw new Error(`Payload API error ${res.status} for ${path}`)
  return res.json()
}

async function directusFetch(path: string, options: RequestInit = {}): Promise<any> {
  const res = await fetch(`${DIRECTUS_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${DIRECTUS_TOKEN}`,
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> ?? {}),
    },
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Directus API error ${res.status} for ${path}: ${err.slice(0, 200)}`)
  }
  return res.json()
}

async function upsertDirectus(collection: string, data: Record<string, any>, slug: string): Promise<void> {
  if (DRY_RUN) {
    console.log(`  [dry-run] Would upsert ${collection} slug="${slug}":`, JSON.stringify(data).slice(0, 120))
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

// --- Collection migrators ---

async function migrateBlogPosts() {
  console.log('\n=== Migrating blog-posts ===')
  let page = 1
  while (true) {
    const res = await payloadFetch(`/blog-posts?depth=1&limit=100&page=${page}&where[status][equals]=published`)
    if (!res?.docs?.length) break
    for (const post of res.docs) {
      const imageId = post.heroImage?.url ? await importImageToDirectus(post.heroImage.url, post.heroImage.alt) : null
      await upsertDirectus('blog_posts', {
        title: post.title,
        slug: post.slug,
        status: post.status === 'published' ? 'published' : 'draft',
        excerpt: post.excerpt ?? null,
        content: lexicalToHtml(post.content),
        featured_image: imageId ?? null,
        date_published: post.publishedDate ?? post.createdAt ?? null,
        meta_title: post.meta?.title ?? null,
        meta_description: post.meta?.description ?? null,
      }, post.slug)
    }
    if (!res.hasNextPage) break
    page++
  }
}

async function migrateEvents() {
  console.log('\n=== Migrating events ===')
  let page = 1
  while (true) {
    const res = await payloadFetch(`/events?depth=1&limit=100&page=${page}`)
    if (!res?.docs?.length) break
    for (const ev of res.docs) {
      const imageId = ev.heroImage?.url ? await importImageToDirectus(ev.heroImage.url, ev.heroImage.alt) : null
      await upsertDirectus('events', {
        title: ev.title,
        slug: ev.slug,
        status: ev.status === 'published' ? 'published' : 'draft',
        excerpt: ev.excerpt ?? null,
        content: lexicalToHtml(ev.content),
        featured_image: imageId ?? null,
        start_date: ev.startDate ?? null,
        end_date: ev.endDate ?? null,
        location: ev.location ?? null,
        event_type: ev.eventType ?? 'in-person',
        registration_url: ev.registrationUrl ?? null,
        date_published: ev.publishedDate ?? ev.createdAt ?? null,
        meta_title: ev.meta?.title ?? null,
        meta_description: ev.meta?.description ?? null,
      }, ev.slug)
    }
    if (!res.hasNextPage) break
    page++
  }
}

async function migrateProgrammes() {
  console.log('\n=== Migrating programmes ===')
  let page = 1
  while (true) {
    const res = await payloadFetch(`/programmes?depth=1&limit=100&page=${page}`)
    if (!res?.docs?.length) break
    for (const prog of res.docs) {
      const imageId = prog.featuredImage?.url ? await importImageToDirectus(prog.featuredImage.url, prog.featuredImage.alt) : null
      await upsertDirectus('programmes', {
        title: prog.title,
        slug: prog.slug,
        status: prog.status === 'published' ? 'published' : 'draft',
        short_description: prog.shortDescription ?? prog.excerpt ?? null,
        description: lexicalToHtml(prog.description ?? prog.content),
        featured_image: imageId ?? null,
        age_range: prog.ageRange ?? null,
        duration: prog.duration ?? null,
        date_published: prog.publishedDate ?? prog.createdAt ?? null,
        meta_title: prog.meta?.title ?? null,
        meta_description: prog.meta?.description ?? null,
      }, prog.slug)
    }
    if (!res.hasNextPage) break
    page++
  }
}

async function migrateStudentStories() {
  console.log('\n=== Migrating student-stories ===')
  let page = 1
  while (true) {
    const res = await payloadFetch(`/student-stories?depth=1&limit=100&page=${page}`)
    if (!res?.docs?.length) break
    for (const story of res.docs) {
      const photoId = story.photo?.url ? await importImageToDirectus(story.photo.url, story.studentName) : null
      const slug = story.slug ?? story.studentName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      await upsertDirectus('student_stories', {
        name: story.studentName,
        slug,
        status: story.status === 'published' ? 'published' : 'draft',
        featured: story.featured ?? false,
        short_quote: story.shortQuote ?? null,
        story: lexicalToHtml(story.story ?? story.content),
        photo: photoId ?? null,
      }, slug)
    }
    if (!res.hasNextPage) break
    page++
  }
}

async function migrateTeamMembers() {
  console.log('\n=== Migrating team members (from site-settings or team collection) ===')
  // Try team-members collection first (may not exist in Payload)
  try {
    const res = await payloadFetch(`/team-members?depth=1&limit=100`)
    if (res?.docs?.length) {
      for (const member of res.docs) {
        const photoId = member.photo?.url ? await importImageToDirectus(member.photo.url, member.name) : null
        const slug = member.slug ?? member.name.toLowerCase().replace(/\s+/g, '-')
        await upsertDirectus('team_members', {
          name: member.name,
          role: member.role ?? '',
          region: member.region ?? 'uk',
          status: member.status === 'published' ? 'published' : 'draft',
          sort: member.order ?? 0,
          bio: member.bio ?? null,
          photo: photoId ?? null,
        }, slug)
      }
      return
    }
  } catch {
    // team-members collection doesn't exist in Payload — skip
    console.log('  No team-members collection found in Payload — skipping')
  }
}

async function migrateImpactStats() {
  console.log('\n=== Migrating impact stats (from site-settings global) ===')
  try {
    const settings = await payloadFetch(`/globals/site-settings`)
    const stats = settings?.impactStats ?? settings?.impact_stats ?? []
    for (let i = 0; i < stats.length; i++) {
      const stat = stats[i]
      if (DRY_RUN) {
        console.log(`  [dry-run] Would upsert impact_stats: ${stat.value} — ${stat.label}`)
        continue
      }
      await directusFetch('/items/impact_stats', {
        method: 'POST',
        body: JSON.stringify({
          value: stat.value,
          label: stat.label,
          status: 'published',
          sort: i,
        }),
      }).catch((e) => console.warn(`  Failed to create stat: ${(e as Error).message}`))
    }
  } catch {
    console.log('  Could not fetch site-settings global — skipping impact stats')
  }
}

// --- Entry point ---

async function main() {
  if (!DIRECTUS_TOKEN) {
    console.error('Error: DIRECTUS_TOKEN is required')
    process.exit(1)
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
      console.error(`Unknown collection: ${name}`)
      continue
    }
    try {
      await collections[name]()
    } catch (e) {
      console.error(`Error migrating ${name}:`, (e as Error).message)
    }
  }

  console.log('\nMigration complete.')
}

main()
