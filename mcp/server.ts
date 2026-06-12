import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { config } from 'dotenv'
import { z } from 'zod'
import { resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
config({ path: resolve(__dirname, '../.env') })

const PAYLOAD_URL = process.env.PAYLOAD_API_URL ?? 'https://content.ourmoon.org.uk'
const API_KEY = process.env.PAYLOAD_API_KEY ?? ''

const CONTENT_COLLECTIONS = ['programmes', 'blog-posts', 'events', 'student-stories'] as const
const ALL_COLLECTIONS = [...CONTENT_COLLECTIONS, 'media', 'users'] as const

type ContentCollection = (typeof CONTENT_COLLECTIONS)[number]
type AnyCollection = (typeof ALL_COLLECTIONS)[number]

async function payloadFetch(path: string, init?: RequestInit): Promise<unknown> {
  const res = await fetch(`${PAYLOAD_URL}/api${path}`, {
    ...init,
    headers: {
      Authorization: `users API-Key ${API_KEY}`,
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`Payload ${res.status}: ${text}`)
  return JSON.parse(text)
}

const server = new McpServer({ name: 'ourmoon-payload', version: '1.0.0' })

server.tool(
  'find_documents',
  'Query documents from a Payload CMS collection. Returns paginated results with total count.',
  {
    collection: z.enum(ALL_COLLECTIONS).describe(
      'Collection slug: programmes, blog-posts, events, student-stories, media, users',
    ),
    where: z
      .string()
      .optional()
      .describe('JSON where clause e.g. {"status":{"equals":"published"}}'),
    limit: z.number().int().min(1).max(100).default(10),
    page: z.number().int().min(1).default(1),
    sort: z
      .string()
      .optional()
      .describe('Sort field, prefix - for descending e.g. -publishedDate'),
    depth: z.number().int().min(0).max(3).default(1).describe('Relationship population depth'),
    draft: z.boolean().optional().describe('Include draft versions'),
  },
  async ({ collection, where, limit, page, sort, depth, draft }) => {
    const params = new URLSearchParams({
      limit: String(limit),
      page: String(page),
      depth: String(depth),
    })
    if (where) params.set('where', where)
    if (sort) params.set('sort', sort)
    if (draft) params.set('draft', 'true')
    const data = await payloadFetch(`/${collection}?${params}`)
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }
  },
)

server.tool(
  'get_document',
  'Get a single document by ID from a Payload CMS collection.',
  {
    collection: z.enum(ALL_COLLECTIONS),
    id: z.string().describe('Document ID'),
    depth: z.number().int().min(0).max(3).default(1),
    draft: z.boolean().optional(),
  },
  async ({ collection, id, depth, draft }) => {
    const params = new URLSearchParams({ depth: String(depth) })
    if (draft) params.set('draft', 'true')
    const data = await payloadFetch(`/${collection}/${id}?${params}`)
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }
  },
)

server.tool(
  'create_document',
  'Create a new document in a content collection.',
  {
    collection: z.enum(CONTENT_COLLECTIONS),
    data: z.string().describe('JSON object with the document fields'),
    draft: z.boolean().optional().describe('Save as draft (default false = published)'),
  },
  async ({ collection, data, draft }) => {
    const params = new URLSearchParams()
    if (draft) params.set('draft', 'true')
    const result = await payloadFetch(`/${collection}?${params}`, {
      method: 'POST',
      body: data,
    })
    return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
  },
)

server.tool(
  'update_document',
  'Update an existing document in a content collection.',
  {
    collection: z.enum(CONTENT_COLLECTIONS),
    id: z.string().describe('Document ID'),
    data: z.string().describe('JSON object with only the fields to update'),
    draft: z.boolean().optional().describe('Save as a new draft version'),
  },
  async ({ collection, id, data, draft }) => {
    const params = new URLSearchParams()
    if (draft) params.set('draft', 'true')
    const result = await payloadFetch(`/${collection}/${id}?${params}`, {
      method: 'PATCH',
      body: data,
    })
    return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
  },
)

server.tool(
  'delete_document',
  'Permanently delete a document from a content collection.',
  {
    collection: z.enum(CONTENT_COLLECTIONS),
    id: z.string().describe('Document ID'),
  },
  async ({ collection, id }) => {
    const result = await payloadFetch(`/${collection}/${id}`, { method: 'DELETE' })
    return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
  },
)

server.tool(
  'get_site_settings',
  'Get OurMoon global site settings: branding, homepage hero, contact info, social links.',
  {},
  async () => {
    const data = await payloadFetch('/globals/site-settings?depth=2')
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }
  },
)

server.tool(
  'update_site_settings',
  'Update OurMoon global site settings. Pass only the fields you want to change.',
  {
    data: z.string().describe('JSON object with fields to update'),
  },
  async ({ data }) => {
    const result = await payloadFetch('/globals/site-settings', {
      method: 'POST',
      body: data,
    })
    return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
  },
)

const transport = new StdioServerTransport()
await server.connect(transport)
