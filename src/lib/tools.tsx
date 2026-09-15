import {
  Braces,
  Terminal,
  Database,
  KeyRound,
  PackageSearch,
  Calculator,
  ShieldAlert,
  Fingerprint,
  Palette,
  ArrowDownUp,
  Globe,
  CaseSensitive,
  type LucideIcon,
} from 'lucide-react'
import JsonFormatter from '@/tools/json-formatter/JsonFormatter'
import CurlToFetch from '@/tools/curl-to-fetch/CurlToFetch'
import JwtDecoder from '@/tools/jwt-decoder/JwtDecoder'
import EnvSanitizer from '@/tools/env-sanitizer/EnvSanitizer'
import HashHmacGenerator from '@/tools/hash-hmac/HashHmacGenerator'
import SqlToZod from '@/tools/sql-to-zod/SqlToZod'
import ColorConverter from '@/tools/color-converter/ColorConverter'
import LineTools from '@/tools/line-tools/LineTools'
import UrlParser from '@/tools/url-parser/UrlParser'
import StringCaseConverter from '@/tools/string-case/StringCaseConverter'
// Code-split: js-tiktoken bundles multi-megabyte BPE rank tables, so these
// tools are loaded on demand instead of bloating every page's initial bundle.
import TokenCounter from '@/tools/token-counter/lazy'
import ContextWindowPacker from '@/tools/context-window-packer/lazy'
import type { ComponentType, LazyExoticComponent } from 'react'

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
  component?: ComponentType | LazyExoticComponent<ComponentType>
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
    component: JwtDecoder,
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
    component: SqlToZod,
  },
  {
    slug: 'color-converter',
    title: 'Color Converter',
    description: 'Convert between HEX, RGB, HSL, HSB, and CMYK, all synced live.',
    category: 'Converters',
    icon: Palette,
    tag: 'NEW',
    component: ColorConverter,
  },
  {
    slug: 'string-case-converter',
    title: 'String Case Converter',
    description: 'Convert text between camelCase, snake_case, kebab-case, and more.',
    category: 'Converters',
    icon: CaseSensitive,
    tag: 'NEW',
    component: StringCaseConverter,
  },
  {
    slug: 'line-sort-dedupe',
    title: 'Line Sort/Dedupe',
    description: 'Sort, deduplicate, and clean up multiline text.',
    category: 'Formatters & Parsers',
    icon: ArrowDownUp,
    tag: 'NEW',
    component: LineTools,
  },
  {
    slug: 'url-parser',
    title: 'URL Parser',
    description: 'Break a URL down into its protocol, host, path, and query parameters.',
    category: 'Formatters & Parsers',
    icon: Globe,
    tag: 'NEW',
    component: UrlParser,
  },
  {
    slug: 'context-window-packer',
    title: 'Context Window Packer',
    description: 'Pack files and snippets into an LLM context window with token budgeting.',
    category: 'AI & LLM Helpers',
    icon: PackageSearch,
    tag: 'NEW',
    component: ContextWindowPacker,
  },
  {
    slug: 'token-counter',
    title: 'Token Counter',
    description: 'Estimate token counts for popular LLM tokenizers before you hit send.',
    category: 'AI & LLM Helpers',
    icon: Calculator,
    component: TokenCounter,
  },
  {
    slug: 'env-sanitizer',
    title: 'Environment Sanitizer',
    description: 'Strip secrets from .env files before sharing configs with teammates.',
    category: 'Security & Infrastructure',
    icon: ShieldAlert,
    component: EnvSanitizer,
  },
  {
    slug: 'hash-hmac',
    title: 'Hash / HMAC Generator',
    description: 'Generate MD5, SHA-1, SHA-256, and HMAC digests entirely in-browser.',
    category: 'Security & Infrastructure',
    icon: Fingerprint,
    component: HashHmacGenerator,
  },
]

export function getToolBySlug(slug: string | undefined): ToolMeta | undefined {
  return TOOLS.find((tool) => tool.slug === slug)
}

export function getToolsByCategory(category: Category): ToolMeta[] {
  return TOOLS.filter((tool) => tool.category === category)
}
