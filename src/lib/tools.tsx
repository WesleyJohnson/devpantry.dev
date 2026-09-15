import {
  Braces,
  Terminal,
  Database,
  KeyRound,
  PackageSearch,
  Calculator,
  ShieldAlert,
  Fingerprint,
  type LucideIcon,
} from 'lucide-react'
import JsonFormatter from '@/tools/json-formatter/JsonFormatter'
import CurlToFetch from '@/tools/curl-to-fetch/CurlToFetch'
import type { ComponentType } from 'react'

export type ToolTag = 'POPULAR' | 'NEW'

export const CATEGORIES = [
  'Converters',
  'Formatters & Parsers',
  'AI & LLM Helpers',
  'Security & Infrastructure',
] as const

export type Category = (typeof CATEGORIES)[number]

export interface ToolMeta {
  slug: string
  title: string
  description: string
  category: Category
  icon: LucideIcon
  tag?: ToolTag
  /** Present only for tools that are actually wired up; others render a "coming soon" state. */
  component?: ComponentType
}

export const TOOLS: ToolMeta[] = [
  {
    slug: 'json-formatter',
    title: 'JSON Formatter & Validator',
    description: 'Pretty-print, minify, and validate JSON with inline error detection.',
    category: 'Formatters & Parsers',
    icon: Braces,
    tag: 'POPULAR',
    component: JsonFormatter,
  },
  {
    slug: 'jwt-decoder',
    title: 'JWT Decoder',
    description: 'Decode JSON Web Tokens and inspect header, payload, and expiry.',
    category: 'Formatters & Parsers',
    icon: KeyRound,
  },
  {
    slug: 'curl-to-fetch',
    title: 'cURL to Fetch',
    description: 'Convert cURL commands into JavaScript fetch() calls.',
    category: 'Converters',
    icon: Terminal,
    tag: 'NEW',
    component: CurlToFetch,
  },
  {
    slug: 'sql-to-zod',
    title: 'SQL to Zod',
    description: 'Generate Zod schemas straight from a SQL CREATE TABLE statement.',
    category: 'Converters',
    icon: Database,
  },
  {
    slug: 'context-window-packer',
    title: 'Context Window Packer',
    description: 'Pack files and snippets into an LLM context window with token budgeting.',
    category: 'AI & LLM Helpers',
    icon: PackageSearch,
    tag: 'NEW',
  },
  {
    slug: 'token-counter',
    title: 'Token Counter',
    description: 'Estimate token counts for popular LLM tokenizers before you hit send.',
    category: 'AI & LLM Helpers',
    icon: Calculator,
  },
  {
    slug: 'env-sanitizer',
    title: 'Environment Sanitizer',
    description: 'Strip secrets from .env files before sharing configs with teammates.',
    category: 'Security & Infrastructure',
    icon: ShieldAlert,
  },
  {
    slug: 'hash-hmac',
    title: 'Hash / HMAC Generator',
    description: 'Generate MD5, SHA-1, SHA-256, and HMAC digests entirely in-browser.',
    category: 'Security & Infrastructure',
    icon: Fingerprint,
  },
]

export function getToolBySlug(slug: string | undefined): ToolMeta | undefined {
  return TOOLS.find((tool) => tool.slug === slug)
}

export function getToolsByCategory(category: Category): ToolMeta[] {
  return TOOLS.filter((tool) => tool.category === category)
}
