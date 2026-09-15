// Splits on: non-alphanumeric separators (snake_case, kebab-case, spaces),
// lower-to-upper boundaries (camelCase, PascalCase), and acronym boundaries
// (XMLParser -> XML, Parser) so any common input style becomes a clean word
// list before re-joining into a target case.
export function toWords(input: string): string[] {
  return input
    .split(/[^A-Za-z0-9]+/)
    .flatMap((part) => part.split(/(?<=[a-z0-9])(?=[A-Z])/))
    .flatMap((part) => part.split(/(?<=[A-Z])(?=[A-Z][a-z])/))
    .filter(Boolean)
}

function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
}

export function toCamelCase(input: string, fallback = ''): string {
  const words = toWords(input)
  if (words.length === 0) return fallback
  return words.map((w, i) => (i === 0 ? w.toLowerCase() : capitalize(w))).join('')
}

export function toPascalCase(input: string, fallback = ''): string {
  const words = toWords(input)
  if (words.length === 0) return fallback
  return words.map(capitalize).join('')
}

export function toSnakeCase(input: string): string {
  return toWords(input)
    .map((w) => w.toLowerCase())
    .join('_')
}

export function toKebabCase(input: string): string {
  return toWords(input)
    .map((w) => w.toLowerCase())
    .join('-')
}

export function toConstantCase(input: string): string {
  return toWords(input)
    .map((w) => w.toUpperCase())
    .join('_')
}

export function toDotCase(input: string): string {
  return toWords(input)
    .map((w) => w.toLowerCase())
    .join('.')
}

export function toTitleCase(input: string): string {
  return toWords(input).map(capitalize).join(' ')
}

export function toSentenceCase(input: string): string {
  const words = toWords(input).map((w) => w.toLowerCase())
  if (words.length === 0) return ''
  const joined = words.join(' ')
  return joined.charAt(0).toUpperCase() + joined.slice(1)
}

export function toLowerCaseWords(input: string): string {
  return toWords(input)
    .map((w) => w.toLowerCase())
    .join(' ')
}

export function toUpperCaseWords(input: string): string {
  return toWords(input)
    .map((w) => w.toUpperCase())
    .join(' ')
}
