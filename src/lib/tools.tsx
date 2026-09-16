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
  FileTerminal,
  FileStack,
  BookOpenText,
  TableProperties,
  FileCode,
  LayoutTemplate,
  Layers,
  QrCode,
  BadgeCheck,
  Network,
  Contrast,
  SearchCode,
  ShieldCheck,
  FileSearch,
  FileType2,
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
import CurlToCodeTool from '@/tools/curl-to-code/CurlToCodeTool'
import JsonToCodeTool from '@/tools/json-to-code/JsonToCodeTool'
// Code-split: these pull in a real npm dependency (multi-megabyte BPE rank
// tables for js-tiktoken, ~18KB gzipped for js-yaml, ~13KB for marked, ~32KB
// for a curated subset of sql-formatter) that only the one tool needs, so
// they're loaded on demand instead of bloating every page's initial bundle.
import TokenCounter from '@/tools/token-counter/lazy'
import ContextWindowPacker from '@/tools/context-window-packer/lazy'
import YamlJsonTool from '@/tools/yaml-json/lazy'
import MarkdownPreviewTool from '@/tools/markdown-preview/lazy'
import SqlFormatterTool from '@/tools/sql-formatter/lazy'
import JsFormatterTool from '@/tools/js-formatter/lazy'
import HtmlFormatterTool from '@/tools/html-formatter/lazy'
import PreprocessorFormatterTool from '@/tools/preprocessor-formatter/lazy'
import QrCodeTool from '@/tools/qr-code/lazy'
import X509DecoderTool from '@/tools/x509-decoder/lazy'
import SubnetCalculatorTool from '@/tools/subnet-calculator/SubnetCalculatorTool'
import ContrastCheckerTool from '@/tools/contrast-checker/ContrastCheckerTool'
import CharInspectorTool from '@/tools/char-inspector/CharInspectorTool'
import JsonSchemaValidatorTool from '@/tools/json-schema-validator/lazy'
import JsonQueryTool from '@/tools/json-query/lazy'
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
    slug: 'json-query',
    title: 'JMESPath/JSONPath Tester',
    description: 'Run a JMESPath or JSONPath query against JSON data and see the matches live.',
    category: 'Formatters & Parsers',
    icon: FileSearch,
    tag: 'NEW',
    component: JsonQueryTool,
  },
  {
    slug: 'json-schema-validator',
    title: 'JSON Schema Validator',
    description: 'Validate a JSON document against a JSON Schema (draft-07, 2019-09, or 2020-12).',
    category: 'Formatters & Parsers',
    icon: ShieldCheck,
    tag: 'NEW',
    component: JsonSchemaValidatorTool,
  },
  {
    slug: 'jwt-decoder',
    title: 'JWT Decoder',
    description: 'Decode JSON Web Tokens, inspect header, payload, and expiry, and verify the signature.',
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
    slug: 'contrast-checker',
    title: 'Color Contrast Checker',
    description: 'Check a foreground/background color pair against WCAG AA and AAA contrast thresholds.',
    category: 'Converters',
    icon: Contrast,
    tag: 'NEW',
    component: ContrastCheckerTool,
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
    slug: 'char-inspector',
    title: 'Unicode/Character Inspector',
    description: 'Break text down per codepoint: hex, UTF-8/UTF-16 bytes, Unicode category, and HTML entity.',
    category: 'Formatters & Parsers',
    icon: SearchCode,
    tag: 'NEW',
    component: CharInspectorTool,
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
    slug: 'x509-decoder',
    title: 'Certificate Decoder',
    description: 'Decode a PEM X.509 certificate: subject, issuer, validity, fingerprints, and extensions.',
    category: 'Security & Infrastructure',
    icon: BadgeCheck,
    tag: 'NEW',
    component: X509DecoderTool,
  },
  {
    slug: 'qr-code',
    title: 'QR Code Reader/Generator',
    description: 'Generate a QR code from text or a URL, or decode one from an uploaded image.',
    category: 'Generators',
    icon: QrCode,
    tag: 'NEW',
    component: QrCodeTool,
  },
  {
    slug: 'preprocessor-formatter',
    title: 'LESS/SCSS to CSS',
    description: 'Compile LESS or SCSS (nesting, mixins, variables) to plain CSS, beautified or minified.',
    category: 'Converters',
    icon: Layers,
    tag: 'NEW',
    component: PreprocessorFormatterTool,
  },
  {
    slug: 'html-formatter',
    title: 'HTML Beautify/Minify',
    description: 'Pretty-print HTML, or minify it with real JS and CSS minification for inline scripts and styles.',
    category: 'Formatters & Parsers',
    icon: LayoutTemplate,
    tag: 'NEW',
    component: HtmlFormatterTool,
  },
  {
    slug: 'js-formatter',
    title: 'JS Beautify/Minify',
    description: 'Beautify JavaScript with Prettier, or minify it with Terser.',
    category: 'Formatters & Parsers',
    icon: FileCode,
    tag: 'NEW',
    component: JsFormatterTool,
  },
  {
    slug: 'sql-formatter',
    title: 'SQL Formatter',
    description: 'Beautify SQL queries across MySQL, PostgreSQL, SQLite, SQL Server, BigQuery, and more.',
    category: 'Formatters & Parsers',
    icon: TableProperties,
    tag: 'NEW',
    component: SqlFormatterTool,
  },
  {
    slug: 'markdown-preview',
    title: 'Markdown Preview',
    description: 'Render GitHub-flavored Markdown live in a sandboxed frame with no script execution.',
    category: 'Formatters & Parsers',
    icon: BookOpenText,
    tag: 'NEW',
    component: MarkdownPreviewTool,
  },
  {
    slug: 'yaml-json',
    title: 'YAML ↔ JSON',
    description: 'Convert between YAML and JSON, including multi-document streams and anchor merge keys.',
    category: 'Formatters & Parsers',
    icon: FileStack,
    tag: 'NEW',
    component: YamlJsonTool,
  },
  {
    slug: 'json-to-code',
    title: 'JSON to Code',
    description: 'Infer types from a JSON sample and generate a TypeScript interface, Python dataclass, or Go struct.',
    category: 'Converters',
    icon: FileType2,
    tag: 'NEW',
    component: JsonToCodeTool,
  },
  {
    slug: 'curl-to-code',
    title: 'cURL to Code',
    description: 'Convert a curl command into Python requests, Node axios, or Go net/http code.',
    category: 'Converters',
    icon: FileTerminal,
    tag: 'NEW',
    component: CurlToCodeTool,
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
    slug: 'subnet-calculator',
    title: 'IP/CIDR Subnet Calculator',
    description: 'Compute network, broadcast, host range, and mask details for an IPv4 or IPv6 CIDR block.',
    category: 'Security & Infrastructure',
    icon: Network,
    tag: 'NEW',
    component: SubnetCalculatorTool,
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
