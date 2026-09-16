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
  Binary,
  Clock,
  FileDigit,
  Link2,
  Code2,
  Slash,
  Hash,
  IdCard,
  Dices,
  ScanText,
  Regex,
  CalendarClock,
  Shapes,
  Diff,
  Table,
  Paintbrush,
  FileCode2,
  FileJson2,
  Parentheses,
  ImageIcon,
  AppWindow,
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
import NumberBaseConverter from '@/tools/number-base/NumberBaseConverter'
import UnixTimeConverter from '@/tools/unix-time/UnixTimeConverter'
import Base64Tool from '@/tools/base64/Base64Tool'
import UrlEncodeTool from '@/tools/url-encode/UrlEncodeTool'
import HtmlEntityTool from '@/tools/html-entity/HtmlEntityTool'
import BackslashEscapeTool from '@/tools/backslash-escape/BackslashEscapeTool'
import HexAsciiTool from '@/tools/hex-ascii/HexAsciiTool'
import UuidUlidTool from '@/tools/uuid-ulid/UuidUlidTool'
import RandomStringTool from '@/tools/random-string/RandomStringTool'
import StringInspector from '@/tools/string-inspector/StringInspector'
import RegexTester from '@/tools/regex-tester/RegexTester'
import CronParserTool from '@/tools/cron-parser/CronParserTool'
import SvgToCssTool from '@/tools/svg-to-css/SvgToCssTool'
import TextDiffTool from '@/tools/text-diff/TextDiffTool'
import CsvJsonTool from '@/tools/csv-json/CsvJsonTool'
import CssFormatterTool from '@/tools/css-formatter/CssFormatterTool'
import XmlFormatterTool from '@/tools/xml-formatter/XmlFormatterTool'
import PhpSerializeTool from '@/tools/php-serialize/PhpSerializeTool'
import PhpJsonTool from '@/tools/php-json/PhpJsonTool'
import Base64ImageTool from '@/tools/base64-image/Base64ImageTool'
import HtmlPreviewTool from '@/tools/html-preview/HtmlPreviewTool'
// Code-split: js-tiktoken bundles multi-megabyte BPE rank tables, so these
// tools are loaded on demand instead of bloating every page's initial bundle.
import TokenCounter from '@/tools/token-counter/lazy'
import ContextWindowPacker from '@/tools/context-window-packer/lazy'
import type { ComponentType, LazyExoticComponent } from 'react'

export type ToolTag = 'POPULAR' | 'NEW'

export const CATEGORIES = [
  'Converters',
  'Formatters & Parsers',
  'Encoders & Decoders',
  'Generators',
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
    slug: 'number-base-converter',
    title: 'Number Base Converter',
    description: 'Convert numbers between binary, octal, decimal, hex, and any custom base.',
    category: 'Converters',
    icon: Binary,
    tag: 'NEW',
    component: NumberBaseConverter,
  },
  {
    slug: 'unix-time-converter',
    title: 'Unix Time Converter',
    description: 'Convert between Unix timestamps, ISO 8601, and local date/time.',
    category: 'Converters',
    icon: Clock,
    tag: 'NEW',
    component: UnixTimeConverter,
  },
  {
    slug: 'base64',
    title: 'Base64 Encode/Decode',
    description: 'Encode text to Base64 or decode it back, with a URL-safe option.',
    category: 'Encoders & Decoders',
    icon: FileDigit,
    tag: 'NEW',
    component: Base64Tool,
  },
  {
    slug: 'url-encode-decode',
    title: 'URL Encode/Decode',
    description: 'Percent-encode or decode text, as a URL component or a full URI.',
    category: 'Encoders & Decoders',
    icon: Link2,
    tag: 'NEW',
    component: UrlEncodeTool,
  },
  {
    slug: 'html-entity',
    title: 'HTML Entity Encode/Decode',
    description: 'Escape text for safe HTML embedding, or decode HTML entities back to text.',
    category: 'Encoders & Decoders',
    icon: Code2,
    tag: 'NEW',
    component: HtmlEntityTool,
  },
  {
    slug: 'backslash-escape',
    title: 'Backslash Escape/Unescape',
    description: 'Escape a string for use as a JS/JSON string literal, or unescape it back.',
    category: 'Encoders & Decoders',
    icon: Slash,
    tag: 'NEW',
    component: BackslashEscapeTool,
  },
  {
    slug: 'hex-ascii',
    title: 'Hex to ASCII',
    description: 'Convert text to its hex byte representation, or decode hex back to text.',
    category: 'Encoders & Decoders',
    icon: Hash,
    tag: 'NEW',
    component: HexAsciiTool,
  },
  {
    slug: 'uuid-ulid',
    title: 'UUID/ULID Generate/Decode',
    description: 'Generate UUID v4s and ULIDs, or decode an existing one.',
    category: 'Generators',
    icon: IdCard,
    tag: 'NEW',
    component: UuidUlidTool,
  },
  {
    slug: 'random-string-generator',
    title: 'Random String Generator',
    description: 'Generate cryptographically random strings with a custom character set.',
    category: 'Generators',
    icon: Dices,
    tag: 'NEW',
    component: RandomStringTool,
  },
  {
    slug: 'string-inspector',
    title: 'String Inspector',
    description: 'Count characters, words, lines, sentences, and bytes in a block of text.',
    category: 'Formatters & Parsers',
    icon: ScanText,
    tag: 'NEW',
    component: StringInspector,
  },
  {
    slug: 'regex-tester',
    title: 'RegExp Tester',
    description: 'Test a JS regular expression against real text, with match highlighting and a token-by-token breakdown.',
    category: 'Formatters & Parsers',
    icon: Regex,
    tag: 'NEW',
    component: RegexTester,
  },
  {
    slug: 'cron-parser',
    title: 'Cron Job Parser',
    description: 'Paste a cron expression to get a plain-English explanation and the next upcoming run times.',
    category: 'Formatters & Parsers',
    icon: CalendarClock,
    tag: 'NEW',
    component: CronParserTool,
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
    slug: 'html-preview',
    title: 'HTML Preview',
    description: 'Paste HTML and see it rendered live in a sandboxed frame.',
    category: 'Formatters & Parsers',
    icon: AppWindow,
    tag: 'NEW',
    component: HtmlPreviewTool,
  },
  {
    slug: 'base64-image',
    title: 'Base64 Image Encode/Decode',
    description: 'Encode an image file to a data URI, or decode a data URI back into a previewable image.',
    category: 'Encoders & Decoders',
    icon: ImageIcon,
    tag: 'NEW',
    component: Base64ImageTool,
  },
  {
    slug: 'php-json',
    title: 'PHP ↔ JSON',
    description: 'Convert between JSON and literal PHP array syntax, array() or short [] form.',
    category: 'Formatters & Parsers',
    icon: Parentheses,
    tag: 'NEW',
    component: PhpJsonTool,
  },
  {
    slug: 'php-serialize',
    title: 'PHP Serializer/Unserializer',
    description: 'Convert between JSON and PHP serialize() strings, byte-accurate for multi-byte strings.',
    category: 'Formatters & Parsers',
    icon: FileJson2,
    tag: 'NEW',
    component: PhpSerializeTool,
  },
  {
    slug: 'xml-formatter',
    title: 'XML Beautify/Minify',
    description: 'Pretty-print or minify XML, with strict well-formedness checks along the way.',
    category: 'Formatters & Parsers',
    icon: FileCode2,
    tag: 'NEW',
    component: XmlFormatterTool,
  },
  {
    slug: 'css-formatter',
    title: 'CSS Beautify/Minify',
    description: 'Pretty-print or minify CSS, including at-rules like @media and @font-face.',
    category: 'Formatters & Parsers',
    icon: Paintbrush,
    tag: 'NEW',
    component: CssFormatterTool,
  },
  {
    slug: 'csv-json',
    title: 'CSV ↔ JSON',
    description: 'Convert between CSV and a JSON array of objects, handling quoted fields per RFC 4180.',
    category: 'Formatters & Parsers',
    icon: Table,
    tag: 'NEW',
    component: CsvJsonTool,
  },
  {
    slug: 'text-diff',
    title: 'Text Diff Checker',
    description: 'Compare two blocks of text line by line, unified or side by side.',
    category: 'Formatters & Parsers',
    icon: Diff,
    tag: 'NEW',
    component: TextDiffTool,
  },
  {
    slug: 'svg-to-css',
    title: 'SVG to CSS',
    description: 'Turn SVG source into a ready-to-paste background-image or mask-image data URI.',
    category: 'Encoders & Decoders',
    icon: Shapes,
    tag: 'NEW',
    component: SvgToCssTool,
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
