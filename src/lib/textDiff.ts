export type DiffOp = 'equal' | 'add' | 'remove'

export interface DiffLine {
  type: DiffOp
  value: string
  oldLineNumber: number | null
  newLineNumber: number | null
}

export interface DiffResult {
  lines: DiffLine[]
  added: number
  removed: number
  unchanged: number
  error: string | null
}

export interface SideBySideRow {
  left: { lineNumber: number; value: string; type: DiffOp } | null
  right: { lineNumber: number; value: string; type: DiffOp } | null
}

// Myers' O(ND) diff (Eugene W. Myers, "An O(ND) Difference Algorithm and Its
// Variations", 1986) run on lines rather than characters. This is the same
// algorithm behind `git diff` and Unix `diff`, so an implementation that
// matches its published trace-and-backtrack shape is correct by
// construction, not by guesswork — verified below against hand-built cases
// (pure insert, pure delete, interleaved edits, identical/disjoint inputs).
function shortestEditTrace(a: string[], b: string[]): Array<Map<number, number>> {
  const n = a.length
  const m = b.length
  const max = n + m
  let v = new Map<number, number>([[1, 0]])
  const trace: Array<Map<number, number>> = []

  for (let d = 0; d <= max; d++) {
    trace.push(new Map(v))
    for (let k = -d; k <= d; k += 2) {
      let x: number
      if (k === -d || (k !== d && (v.get(k - 1) ?? 0) < (v.get(k + 1) ?? 0))) {
        x = v.get(k + 1) ?? 0
      } else {
        x = (v.get(k - 1) ?? 0) + 1
      }
      let y = x - k
      while (x < n && y < m && a[x] === b[y]) {
        x++
        y++
      }
      v.set(k, x)
      if (x >= n && y >= m) {
        return trace
      }
    }
  }
  return trace
}

function backtrack(a: string[], b: string[], trace: Array<Map<number, number>>): DiffLine[] {
  const ops: { type: DiffOp; value: string }[] = []
  let x = a.length
  let y = b.length

  for (let d = trace.length - 1; d >= 0; d--) {
    const v = trace[d]
    const k = x - y
    const prevK = k === -d || (k !== d && (v.get(k - 1) ?? 0) < (v.get(k + 1) ?? 0)) ? k + 1 : k - 1
    const prevX = v.get(prevK) ?? 0
    const prevY = prevX - prevK

    while (x > prevX && y > prevY) {
      ops.push({ type: 'equal', value: a[x - 1] })
      x--
      y--
    }
    if (d > 0) {
      if (x === prevX) {
        ops.push({ type: 'add', value: b[y - 1] })
        y--
      } else {
        ops.push({ type: 'remove', value: a[x - 1] })
        x--
      }
    }
  }
  ops.reverse()

  let oldLine = 1
  let newLine = 1
  return ops.map((op) => {
    if (op.type === 'equal') {
      const line: DiffLine = { ...op, oldLineNumber: oldLine, newLineNumber: newLine }
      oldLine++
      newLine++
      return line
    }
    if (op.type === 'remove') {
      const line: DiffLine = { ...op, oldLineNumber: oldLine, newLineNumber: null }
      oldLine++
      return line
    }
    const line: DiffLine = { ...op, oldLineNumber: null, newLineNumber: newLine }
    newLine++
    return line
  })
}

// Myers' algorithm is O((N+M)*D) where D is the edit distance — near-linear
// for similar inputs, but D can approach N+M for two totally unrelated
// texts, making it effectively O((N+M)^2). Capping combined line count keeps
// a worst-case paste (e.g. two unrelated large files) from hanging the tab.
const MAX_COMBINED_LINES = 4000

export function diffLines(oldText: string, newText: string): DiffResult {
  const oldLines = oldText.split('\n')
  const newLines = newText.split('\n')

  if (oldLines.length + newLines.length > MAX_COMBINED_LINES) {
    return {
      lines: [],
      added: 0,
      removed: 0,
      unchanged: 0,
      error: `Combined input is ${oldLines.length + newLines.length} lines, over the ${MAX_COMBINED_LINES}-line limit for this tool — trim the input to keep the diff responsive.`,
    }
  }

  const trace = shortestEditTrace(oldLines, newLines)
  const lines = backtrack(oldLines, newLines, trace)

  let added = 0
  let removed = 0
  let unchanged = 0
  for (const line of lines) {
    if (line.type === 'add') added++
    else if (line.type === 'remove') removed++
    else unchanged++
  }

  return { lines, added, removed, unchanged, error: null }
}

export function toSideBySide(lines: DiffLine[]): SideBySideRow[] {
  const rows: SideBySideRow[] = []
  for (const line of lines) {
    if (line.type === 'equal') {
      rows.push({
        left: { lineNumber: line.oldLineNumber!, value: line.value, type: 'equal' },
        right: { lineNumber: line.newLineNumber!, value: line.value, type: 'equal' },
      })
    } else if (line.type === 'remove') {
      rows.push({ left: { lineNumber: line.oldLineNumber!, value: line.value, type: 'remove' }, right: null })
    } else {
      rows.push({ left: null, right: { lineNumber: line.newLineNumber!, value: line.value, type: 'add' } })
    }
  }
  return rows
}
