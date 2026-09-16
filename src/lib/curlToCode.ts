import { parseCurl, type ParsedCurl } from '@/lib/curlFetch'

export type CodeTarget = 'python' | 'node' | 'go'

export interface CurlToCodeResult {
  output: string
  error: string | null
  warnings: string[]
}

function pyStr(s: string): string {
  return `"${s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
}

function generatePython(parsed: ParsedCurl): string {
  const lines: string[] = ['import requests', '']
  const kwargs: string[] = []

  if (parsed.headers.length > 0) {
    lines.push('headers = {')
    for (const [k, v] of parsed.headers) lines.push(`    ${pyStr(k)}: ${pyStr(v)},`)
    lines.push('}')
    kwargs.push('headers=headers')
  }

  if (parsed.formFields) {
    const fileFields = parsed.formFields.filter((f) => f.isFile)
    const plainFields = parsed.formFields.filter((f) => !f.isFile)
    if (fileFields.length > 0) {
      lines.push('files = {')
      for (const f of fileFields) lines.push(`    ${pyStr(f.name)}: open(${pyStr(f.value)}, "rb"),`)
      lines.push('}')
      kwargs.push('files=files')
    }
    if (plainFields.length > 0) {
      lines.push('data = {')
      for (const f of plainFields) lines.push(`    ${pyStr(f.name)}: ${pyStr(f.value)},`)
      lines.push('}')
      kwargs.push('data=data')
    }
  } else if (parsed.body !== null) {
    lines.push(`data = ${pyStr(parsed.body)}`)
    kwargs.push('data=data')
  }

  if (lines.length > 2) lines.push('')

  const kwargsBlock = kwargs.length > 0 ? `,\n    ${kwargs.join(',\n    ')},\n` : ''
  lines.push(`response = requests.request(\n    ${pyStr(parsed.method)},\n    ${pyStr(parsed.url)}${kwargsBlock}${kwargs.length > 0 ? ')' : '\n)'}`)
  lines.push('')
  lines.push('print(response.status_code)')
  lines.push('print(response.text)')
  return lines.join('\n')
}

function jsStr(s: string): string {
  return JSON.stringify(s)
}

function generateNode(parsed: ParsedCurl): string {
  const lines: string[] = ["const axios = require('axios');", '']
  const optionEntries: string[] = [`method: ${jsStr(parsed.method.toLowerCase())}`, `url: ${jsStr(parsed.url)}`]

  if (parsed.headers.length > 0) {
    const headerBody = parsed.headers.map(([k, v]) => `    ${jsStr(k)}: ${jsStr(v)},`).join('\n')
    optionEntries.push(`headers: {\n${headerBody}\n  }`)
  }

  if (parsed.formFields) {
    lines.push('const formData = new FormData();')
    for (const f of parsed.formFields) {
      if (f.isFile) lines.push(`// formData.append(${jsStr(f.name)}, fs.createReadStream(${jsStr(f.value)})); // wire up a real file stream`)
      else lines.push(`formData.append(${jsStr(f.name)}, ${jsStr(f.value)});`)
    }
    lines.push('')
    optionEntries.push('data: formData')
  } else if (parsed.body !== null) {
    optionEntries.push(`data: ${jsStr(parsed.body)}`)
  }

  const optionsBlock = optionEntries.map((e) => `  ${e},`).join('\n')
  lines.push(`axios({\n${optionsBlock}\n})`)
  lines.push('  .then((res) => console.log(res.data))')
  lines.push('  .catch((err) => console.error(err));')
  return lines.join('\n')
}

function goStr(s: string): string {
  return `"${s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`
}

// Go backtick raw string literals can't contain a backtick or "${" escaping
// concerns the way Python/JS string literals can — using a regular quoted
// string with escapes sidesteps that entirely rather than special-casing it.
function generateGo(parsed: ParsedCurl): { code: string; warning: string | null } {
  const lines: string[] = [
    'package main',
    '',
    'import (',
    '\t"fmt"',
    '\t"io"',
    '\t"net/http"',
  ]
  const hasBody = parsed.body !== null
  if (hasBody) lines.push('\t"strings"')
  lines.push(')', '', 'func main() {')
  lines.push(`\turl := ${goStr(parsed.url)}`)

  let bodyExpr = 'nil'
  if (hasBody) {
    lines.push(`\tpayload := strings.NewReader(${goStr(parsed.body as string)})`)
    bodyExpr = 'payload'
  }
  lines.push('')
  lines.push(`\treq, err := http.NewRequest(${goStr(parsed.method)}, url, ${bodyExpr})`)
  lines.push('\tif err != nil {')
  lines.push('\t\tpanic(err)')
  lines.push('\t}')

  for (const [k, v] of parsed.headers) {
    lines.push(`\treq.Header.Set(${goStr(k)}, ${goStr(v)})`)
  }

  lines.push('')
  lines.push('\tres, err := http.DefaultClient.Do(req)')
  lines.push('\tif err != nil {')
  lines.push('\t\tpanic(err)')
  lines.push('\t}')
  lines.push('\tdefer res.Body.Close()')
  lines.push('')
  lines.push('\tbody, err := io.ReadAll(res.Body)')
  lines.push('\tif err != nil {')
  lines.push('\t\tpanic(err)')
  lines.push('\t}')
  lines.push('\tfmt.Println(res.StatusCode)')
  lines.push('\tfmt.Println(string(body))')
  lines.push('}')

  const warning = parsed.formFields
    ? 'Go output does not generate multipart form-file code — wire up a multipart.Writer for the form fields manually.'
    : null

  return { code: lines.join('\n'), warning }
}

export function curlToCode(input: string, target: CodeTarget): CurlToCodeResult {
  if (!input.trim()) return { output: '', error: null, warnings: [] }
  const parsed = parseCurl(input)
  if ('error' in parsed) return { output: '', error: parsed.error, warnings: [] }

  if (target === 'python') return { output: generatePython(parsed), error: null, warnings: parsed.warnings }
  if (target === 'node') return { output: generateNode(parsed), error: null, warnings: parsed.warnings }

  const { code, warning } = generateGo(parsed)
  return { output: code, error: null, warnings: warning ? [...parsed.warnings, warning] : parsed.warnings }
}
