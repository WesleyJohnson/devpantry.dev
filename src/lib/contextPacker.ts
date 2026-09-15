export interface Snippet {
  id: string
  label: string
  content: string
  source: 'file' | 'paste'
}

export interface PackResult {
  includedIds: Set<string>
  includedTokens: number
  totalTokens: number
}

// Greedy, order-respecting pack: walks the list in priority order and keeps
// adding whole snippets while they still fit. Once one doesn't fit, packing
// stops entirely (later, smaller snippets are not pulled ahead of it) — this
// keeps "included" a direct, predictable read of the list's own order rather
// than a bin-packing result that could feel arbitrary.
export function packSnippets(snippets: Snippet[], tokenCounts: Map<string, number>, budget: number): PackResult {
  const includedIds = new Set<string>()
  let includedTokens = 0
  let totalTokens = 0
  let stopped = false

  for (const snippet of snippets) {
    const count = tokenCounts.get(snippet.id) ?? 0
    totalTokens += count
    if (!stopped && includedTokens + count <= budget) {
      includedIds.add(snippet.id)
      includedTokens += count
    } else {
      stopped = true
    }
  }

  return { includedIds, includedTokens, totalTokens }
}

export function formatPackedOutput(snippets: Snippet[], includedIds: Set<string>): string {
  return snippets
    .filter((s) => includedIds.has(s.id))
    .map((s) => `=== ${s.label} ===\n${s.content}`)
    .join('\n\n')
}

// --- File reading ------------------------------------------------------

const MAX_FILE_BYTES = 2 * 1024 * 1024 // 2MB — generous for source/text files

export interface RejectedFile {
  label: string
  reason: string
}

export interface ReadFilesResult {
  accepted: { label: string; content: string }[]
  rejected: RejectedFile[]
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// A NUL byte is the classic binary-content signal (valid UTF-8 text never
// contains one); a high ratio of other control characters is the fallback
// signal for encodings that decoded "successfully" but aren't really text.
function looksBinary(text: string): boolean {
  const sampleLength = Math.min(text.length, 8000)
  let controlCount = 0
  for (let i = 0; i < sampleLength; i++) {
    const code = text.charCodeAt(i)
    if (code === 0) return true
    if (code < 9 || (code > 13 && code < 32)) controlCount++
  }
  return sampleLength > 0 && controlCount / sampleLength > 0.05
}

export async function readTextFiles(files: File[]): Promise<ReadFilesResult> {
  const accepted: { label: string; content: string }[] = []
  const rejected: RejectedFile[] = []

  for (const file of files) {
    if (file.size > MAX_FILE_BYTES) {
      rejected.push({
        label: file.name,
        reason: `too large (${formatBytes(file.size)}, limit ${formatBytes(MAX_FILE_BYTES)})`,
      })
      continue
    }
    try {
      const text = await file.text()
      if (looksBinary(text)) {
        rejected.push({ label: file.name, reason: 'looks like a binary file, not text' })
        continue
      }
      accepted.push({ label: file.name, content: text })
    } catch {
      rejected.push({ label: file.name, reason: "couldn't be read as text" })
    }
  }

  return { accepted, rejected }
}
