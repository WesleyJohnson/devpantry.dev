// Infers a type schema from a JSON sample and renders it as a TypeScript
// interface, Python dataclass, or Go struct — the "schema generation"
// counterpart to SQL-to-Zod, but working from example data instead of a
// CREATE TABLE statement.

export type TypeNode =
  | { kind: 'string' }
  | { kind: 'number' }
  | { kind: 'boolean' }
  | { kind: 'null' }
  | { kind: 'unknown' }
  | { kind: 'array'; of: TypeNode }
  | { kind: 'object'; fields: Map<string, TypeNode>; optional: Set<string> }
  | { kind: 'union'; options: TypeNode[] }

export type Lang = 'typescript' | 'python' | 'go'

export interface JsonToCodeResult {
  output: string
  error: string | null
}

function inferType(value: unknown): TypeNode {
  if (value === null) return { kind: 'null' }
  if (typeof value === 'boolean') return { kind: 'boolean' }
  if (typeof value === 'number') return { kind: 'number' }
  if (typeof value === 'string') return { kind: 'string' }
  if (Array.isArray(value)) {
    if (value.length === 0) return { kind: 'array', of: { kind: 'unknown' } }
    return { kind: 'array', of: mergeTypes(value.map(inferType)) }
  }
  const fields = new Map<string, TypeNode>()
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) fields.set(k, inferType(v))
  return { kind: 'object', fields, optional: new Set() }
}

function mergeObjectTypes(objs: Extract<TypeNode, { kind: 'object' }>[]): TypeNode {
  const allKeys = new Set<string>()
  for (const o of objs) for (const k of o.fields.keys()) allKeys.add(k)

  const fields = new Map<string, TypeNode>()
  const optional = new Set<string>()
  for (const key of allKeys) {
    const presentIn = objs.filter((o) => o.fields.has(key))
    if (presentIn.length < objs.length) optional.add(key)
    fields.set(
      key,
      mergeTypes(presentIn.map((o) => o.fields.get(key) as TypeNode)),
    )
  }
  return { kind: 'object', fields, optional }
}

function mergeTypes(types: TypeNode[]): TypeNode {
  const objectTypes = types.filter((t): t is Extract<TypeNode, { kind: 'object' }> => t.kind === 'object')
  const arrayTypes = types.filter((t): t is Extract<TypeNode, { kind: 'array' }> => t.kind === 'array')
  const scalarTypes = types.filter((t) => t.kind !== 'object' && t.kind !== 'array')

  const results: TypeNode[] = []
  if (objectTypes.length > 0) results.push(mergeObjectTypes(objectTypes))
  if (arrayTypes.length > 0) results.push({ kind: 'array', of: mergeTypes(arrayTypes.map((t) => t.of)) })

  const seen = new Set<string>()
  for (const t of scalarTypes) {
    if (!seen.has(t.kind)) {
      seen.add(t.kind)
      results.push(t)
    }
  }

  const nonUnknown = results.filter((r) => r.kind !== 'unknown')
  if (nonUnknown.length === 0) return { kind: 'unknown' }
  if (nonUnknown.length === 1) return nonUnknown[0]
  return { kind: 'union', options: nonUnknown }
}

export function inferRootType(json: string): { type: TypeNode; error: string | null } {
  try {
    const parsed = JSON.parse(json)
    return { type: inferType(parsed), error: null }
  } catch (e) {
    return { type: { kind: 'unknown' }, error: `Invalid JSON: ${(e as Error).message}` }
  }
}

// --- Naming ---------------------------------------------------------------

// Used to name types (TS interfaces, Python classes, Go structs) AND, for Go
// specifically, actual struct field identifiers — so a source key like
// "2fa" can't be allowed to produce a name starting with a digit, which is
// invalid in all three languages (and in Go, an identifier also has to start
// with an uppercase letter to be exported/visible to encoding/json).
function toPascalCase(name: string): string {
  const parts = name.split(/[^A-Za-z0-9]+/).filter(Boolean)
  if (parts.length === 0) return 'Item'
  const pascal = parts.map((p) => p[0].toUpperCase() + p.slice(1)).join('')
  return /^[0-9]/.test(pascal) ? `N${pascal}` : pascal
}

function singularize(name: string): string {
  if (/ies$/i.test(name)) return name.slice(0, -3) + 'y'
  if (/s$/i.test(name) && !/ss$/i.test(name)) return name.slice(0, -1)
  return name
}

// Used to name an array's element type from its container's name (e.g. field
// "tags" -> element hint "tag"). When singularize can't shorten the name —
// most notably the root name itself, e.g. "Root" has no trailing "s" — falls
// back to an "Item" suffix instead of returning the name unchanged, which
// would otherwise collide with a `type Root = Root[]` alias sharing the same
// name as its own element interface.
function elementNameHint(name: string): string {
  const singular = singularize(name)
  return singular !== name ? singular : `${name}Item`
}

// --- TypeScript -------------------------------------------------------------

function tsFieldType(
  node: TypeNode,
  nameHint: string,
  interfaces: Map<string, string>,
): string {
  switch (node.kind) {
    case 'string':
      return 'string'
    case 'number':
      return 'number'
    case 'boolean':
      return 'boolean'
    case 'null':
      return 'null'
    case 'unknown':
      return 'unknown'
    case 'array':
      return `${tsFieldType(node.of, elementNameHint(nameHint), interfaces)}[]`
    case 'union':
      return [...new Set(node.options.map((o) => tsFieldType(o, nameHint, interfaces)))].join(' | ')
    case 'object':
      return registerTsInterface(node, toPascalCase(nameHint), interfaces)
  }
}

function objectSignature(node: Extract<TypeNode, { kind: 'object' }>): string {
  return [...node.fields.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}:${v.kind}`)
    .join(',')
}

function registerTsInterface(
  node: Extract<TypeNode, { kind: 'object' }>,
  baseName: string,
  interfaces: Map<string, string>,
): string {
  const signature = objectSignature(node)
  const existingByName = [...interfaces.keys()].filter((n) => n === baseName || n.startsWith(baseName))
  for (const n of existingByName) {
    if (interfaces.get(n) === signature) return n
  }
  let name = baseName
  let suffix = 2
  while (interfaces.has(name)) {
    name = `${baseName}${suffix}`
    suffix++
  }
  interfaces.set(name, signature)

  const lines: string[] = [`interface ${name} {`]
  for (const [key, fieldType] of node.fields) {
    const optional = node.optional.has(key) ? '?' : ''
    const safeKey = /^[A-Za-z_$][\w$]*$/.test(key) ? key : JSON.stringify(key)
    lines.push(`  ${safeKey}${optional}: ${tsFieldType(fieldType, key, interfaces)};`)
  }
  lines.push('}')
  interfaceBodies.set(name, lines.join('\n'))
  return name
}

// Populated as a side effect of registerTsInterface — keyed by the same
// names tracked in the `interfaces` signature map so a rendering pass can
// print every discovered interface after the walk finishes.
let interfaceBodies = new Map<string, string>()

function renderTypeScript(root: TypeNode, rootName: string): string {
  interfaceBodies = new Map()
  const signatures = new Map<string, string>()
  const topRef = tsFieldType(root, rootName, signatures)

  const parts: string[] = []
  if (topRef !== rootName) parts.push(`type ${rootName} = ${topRef};`)
  for (const body of interfaceBodies.values()) parts.push(body)
  return parts.join('\n\n')
}

// --- Python -----------------------------------------------------------------

const pyClassBodies = new Map<string, string>()

function pyFieldType(node: TypeNode, nameHint: string, signatures: Map<string, string>, imports: Set<string>): string {
  switch (node.kind) {
    case 'string':
      return 'str'
    case 'number':
      return 'float'
    case 'boolean':
      return 'bool'
    case 'null':
      return 'None'
    case 'unknown':
      imports.add('Any')
      return 'Any'
    case 'array':
      imports.add('List')
      return `List[${pyFieldType(node.of, elementNameHint(nameHint), signatures, imports)}]`
    case 'union': {
      imports.add('Union')
      const opts = [...new Set(node.options.map((o) => pyFieldType(o, nameHint, signatures, imports)))]
      return opts.length === 1 ? opts[0] : `Union[${opts.join(', ')}]`
    }
    case 'object':
      return registerPyClass(node, toPascalCase(nameHint), signatures, imports)
  }
}

function registerPyClass(
  node: Extract<TypeNode, { kind: 'object' }>,
  baseName: string,
  signatures: Map<string, string>,
  imports: Set<string>,
): string {
  const signature = objectSignature(node)
  const existingByName = [...signatures.keys()].filter((n) => n === baseName || n.startsWith(baseName))
  for (const n of existingByName) {
    if (signatures.get(n) === signature) return n
  }
  let name = baseName
  let suffix = 2
  while (signatures.has(name)) {
    name = `${baseName}${suffix}`
    suffix++
  }
  signatures.set(name, signature)

  const required: string[] = []
  const optional: string[] = []
  for (const [key, fieldType] of node.fields) {
    const safeKey = /^[A-Za-z_]\w*$/.test(key) ? key : key.replace(/[^A-Za-z0-9_]/g, '_').replace(/^(\d)/, '_$1')
    const comment = safeKey !== key ? `  # original key: ${JSON.stringify(key)}` : ''
    const typeStr = pyFieldType(fieldType, key, signatures, imports)
    if (node.optional.has(key)) {
      imports.add('Optional')
      optional.push(`    ${safeKey}: Optional[${typeStr}] = None${comment}`)
    } else {
      required.push(`    ${safeKey}: ${typeStr}${comment}`)
    }
  }

  const lines = ['@dataclass', `class ${name}:`, ...required, ...optional]
  if (required.length === 0 && optional.length === 0) lines.push('    pass')
  pyClassBodies.set(name, lines.join('\n'))
  return name
}

function renderPython(root: TypeNode, rootName: string): string {
  pyClassBodies.clear()
  const signatures = new Map<string, string>()
  const imports = new Set<string>()
  const topRef = pyFieldType(root, rootName, signatures, imports)

  const header = ['from __future__ import annotations', 'from dataclasses import dataclass']
  if (imports.size > 0) header.push(`from typing import ${[...imports].sort().join(', ')}`)

  const parts = [header.join('\n')]
  for (const body of pyClassBodies.values()) parts.push(body)
  if (topRef !== rootName) parts.push(`${rootName} = ${topRef}`)
  return parts.join('\n\n\n')
}

// --- Go -----------------------------------------------------------------

const goStructBodies = new Map<string, string>()

function goFieldType(node: TypeNode, nameHint: string, signatures: Map<string, string>, optional: boolean): string {
  const ptr = optional ? '*' : ''
  switch (node.kind) {
    case 'string':
      return `${ptr}string`
    case 'number':
      return `${ptr}float64`
    case 'boolean':
      return `${ptr}bool`
    case 'null':
      return 'interface{}'
    case 'unknown':
      return 'interface{}'
    case 'array':
      return `[]${goFieldType(node.of, elementNameHint(nameHint), signatures, false)}`
    case 'union':
      return 'interface{}'
    case 'object':
      return `${ptr}${registerGoStruct(node, toPascalCase(nameHint), signatures)}`
  }
}

function registerGoStruct(
  node: Extract<TypeNode, { kind: 'object' }>,
  baseName: string,
  signatures: Map<string, string>,
): string {
  const signature = objectSignature(node)
  const existingByName = [...signatures.keys()].filter((n) => n === baseName || n.startsWith(baseName))
  for (const n of existingByName) {
    if (signatures.get(n) === signature) return n
  }
  let name = baseName
  let suffix = 2
  while (signatures.has(name)) {
    name = `${baseName}${suffix}`
    suffix++
  }
  signatures.set(name, signature)

  const usedFieldNames = new Set<string>()
  const rows: [string, string, string][] = []
  for (const [key, fieldType] of node.fields) {
    let fieldName = toPascalCase(key)
    while (usedFieldNames.has(fieldName)) fieldName += 'X'
    usedFieldNames.add(fieldName)
    const isOptional = node.optional.has(key)
    const typeStr = goFieldType(fieldType, key, signatures, isOptional)
    const tag = isOptional ? `\`json:"${key},omitempty"\`` : `\`json:"${key}"\``
    rows.push([fieldName, typeStr, tag])
  }

  const nameWidth = Math.max(...rows.map(([n]) => n.length), 0)
  const typeWidth = Math.max(...rows.map(([, t]) => t.length), 0)
  const lines = [`type ${name} struct {`]
  for (const [fieldName, typeStr, tag] of rows) {
    lines.push(`\t${fieldName.padEnd(nameWidth)} ${typeStr.padEnd(typeWidth)} ${tag}`)
  }
  lines.push('}')
  goStructBodies.set(name, lines.join('\n'))
  return name
}

function renderGo(root: TypeNode, rootName: string): string {
  goStructBodies.clear()
  const signatures = new Map<string, string>()
  const topRef = goFieldType(root, rootName, signatures, false)

  const parts = ['package main']
  for (const body of goStructBodies.values()) parts.push(body)
  if (topRef !== rootName) parts.push(`type ${rootName} = ${topRef}`)
  return parts.join('\n\n')
}

export function jsonToCode(json: string, lang: Lang, rootName = 'Root'): JsonToCodeResult {
  if (!json.trim()) return { output: '', error: null }
  const { type, error } = inferRootType(json)
  if (error) return { output: '', error }

  const safeRootName = /^[A-Za-z_]\w*$/.test(rootName) ? rootName : 'Root'
  if (lang === 'typescript') return { output: renderTypeScript(type, safeRootName), error: null }
  if (lang === 'python') return { output: renderPython(type, safeRootName), error: null }
  return { output: renderGo(type, safeRootName), error: null }
}
