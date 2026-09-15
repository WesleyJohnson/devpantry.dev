export interface RGBA {
  r: number
  g: number
  b: number
  a: number // 0-1
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

// --- HEX --------------------------------------------------------------

export function rgbaToHex(c: RGBA): string {
  const toHex2 = (n: number) => clamp(Math.round(n), 0, 255).toString(16).padStart(2, '0')
  const alphaHex = c.a < 1 ? toHex2(Math.round(c.a * 255)) : ''
  return `#${toHex2(c.r)}${toHex2(c.g)}${toHex2(c.b)}${alphaHex}`.toUpperCase()
}

export function hexToRgba(hex: string): RGBA | null {
  const h = hex.trim().replace(/^#/, '')
  if (/^[0-9a-fA-F]{3}$/.test(h)) {
    return {
      r: parseInt(h[0] + h[0], 16),
      g: parseInt(h[1] + h[1], 16),
      b: parseInt(h[2] + h[2], 16),
      a: 1,
    }
  }
  if (/^[0-9a-fA-F]{4}$/.test(h)) {
    return {
      r: parseInt(h[0] + h[0], 16),
      g: parseInt(h[1] + h[1], 16),
      b: parseInt(h[2] + h[2], 16),
      a: parseInt(h[3] + h[3], 16) / 255,
    }
  }
  if (/^[0-9a-fA-F]{6}$/.test(h)) {
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
      a: 1,
    }
  }
  if (/^[0-9a-fA-F]{8}$/.test(h)) {
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
      a: parseInt(h.slice(6, 8), 16) / 255,
    }
  }
  return null
}

// --- HSL ----------------------------------------------------------------

export function rgbaToHsl(c: RGBA): { h: number; s: number; l: number; a: number } {
  const r = c.r / 255
  const g = c.g / 255
  const b = c.b / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  const d = max - min
  let h = 0
  let s = 0
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1))
    switch (max) {
      case r:
        h = 60 * (((g - b) / d) % 6)
        break
      case g:
        h = 60 * ((b - r) / d + 2)
        break
      default:
        h = 60 * ((r - g) / d + 4)
    }
  }
  if (h < 0) h += 360
  return { h, s, l, a: c.a }
}

export function hslToRgba(h: number, s: number, l: number, a = 1): RGBA {
  h = ((h % 360) + 360) % 360
  s = clamp(s, 0, 1)
  l = clamp(l, 0, 1)
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2
  let [r1, g1, b1] = [0, 0, 0]
  if (h < 60) [r1, g1, b1] = [c, x, 0]
  else if (h < 120) [r1, g1, b1] = [x, c, 0]
  else if (h < 180) [r1, g1, b1] = [0, c, x]
  else if (h < 240) [r1, g1, b1] = [0, x, c]
  else if (h < 300) [r1, g1, b1] = [x, 0, c]
  else [r1, g1, b1] = [c, 0, x]
  return {
    r: Math.round((r1 + m) * 255),
    g: Math.round((g1 + m) * 255),
    b: Math.round((b1 + m) * 255),
    a: clamp(a, 0, 1),
  }
}

// --- HSV / HSB ------------------------------------------------------------

export function rgbaToHsv(c: RGBA): { h: number; s: number; v: number; a: number } {
  const r = c.r / 255
  const g = c.g / 255
  const b = c.b / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min
  let h = 0
  if (d !== 0) {
    switch (max) {
      case r:
        h = 60 * (((g - b) / d) % 6)
        break
      case g:
        h = 60 * ((b - r) / d + 2)
        break
      default:
        h = 60 * ((r - g) / d + 4)
    }
  }
  if (h < 0) h += 360
  const s = max === 0 ? 0 : d / max
  const v = max
  return { h, s, v, a: c.a }
}

export function hsvToRgba(h: number, s: number, v: number, a = 1): RGBA {
  h = ((h % 360) + 360) % 360
  s = clamp(s, 0, 1)
  v = clamp(v, 0, 1)
  const c = v * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = v - c
  let [r1, g1, b1] = [0, 0, 0]
  if (h < 60) [r1, g1, b1] = [c, x, 0]
  else if (h < 120) [r1, g1, b1] = [x, c, 0]
  else if (h < 180) [r1, g1, b1] = [0, c, x]
  else if (h < 240) [r1, g1, b1] = [0, x, c]
  else if (h < 300) [r1, g1, b1] = [x, 0, c]
  else [r1, g1, b1] = [c, 0, x]
  return {
    r: Math.round((r1 + m) * 255),
    g: Math.round((g1 + m) * 255),
    b: Math.round((b1 + m) * 255),
    a: clamp(a, 0, 1),
  }
}

// --- CMYK -------------------------------------------------------------

export function rgbaToCmyk(c: RGBA): { c: number; m: number; y: number; k: number } {
  const r = c.r / 255
  const g = c.g / 255
  const b = c.b / 255
  const k = 1 - Math.max(r, g, b)
  if (k === 1) return { c: 0, m: 0, y: 0, k: 1 }
  return {
    c: (1 - r - k) / (1 - k),
    m: (1 - g - k) / (1 - k),
    y: (1 - b - k) / (1 - k),
    k,
  }
}

export function cmykToRgba(c: number, m: number, y: number, k: number, a = 1): RGBA {
  c = clamp(c, 0, 1)
  m = clamp(m, 0, 1)
  y = clamp(y, 0, 1)
  k = clamp(k, 0, 1)
  return {
    r: Math.round(255 * (1 - c) * (1 - k)),
    g: Math.round(255 * (1 - m) * (1 - k)),
    b: Math.round(255 * (1 - y) * (1 - k)),
    a: clamp(a, 0, 1),
  }
}

// --- Formatting for display ------------------------------------------------

export function formatHex(c: RGBA): string {
  return rgbaToHex(c)
}

export function formatRgb(c: RGBA): string {
  return c.a < 1 ? `rgba(${c.r}, ${c.g}, ${c.b}, ${round2(c.a)})` : `rgb(${c.r}, ${c.g}, ${c.b})`
}

export function formatHsl(c: RGBA): string {
  const { h, s, l } = rgbaToHsl(c)
  const hh = Math.round(h)
  const ss = Math.round(s * 100)
  const ll = Math.round(l * 100)
  return c.a < 1 ? `hsla(${hh}, ${ss}%, ${ll}%, ${round2(c.a)})` : `hsl(${hh}, ${ss}%, ${ll}%)`
}

export function formatHsv(c: RGBA): string {
  const { h, s, v } = rgbaToHsv(c)
  return `hsb(${Math.round(h)}, ${Math.round(s * 100)}%, ${Math.round(v * 100)}%)`
}

export function formatCmyk(c: RGBA): string {
  const { c: cc, m, y, k } = rgbaToCmyk(c)
  return `cmyk(${Math.round(cc * 100)}%, ${Math.round(m * 100)}%, ${Math.round(y * 100)}%, ${Math.round(k * 100)}%)`
}

// --- Parsing user input --------------------------------------------------

function parseNumberList(text: string): number[] | null {
  const inner = text.match(/\(([^)]*)\)/)?.[1] ?? text
  const parts = inner
    .split(/[,\s/]+/)
    .map((p) => p.trim())
    .filter(Boolean)
  if (parts.length === 0) return null
  const nums = parts.map((p) => parseFloat(p.replace('%', '')))
  if (nums.some((n) => Number.isNaN(n))) return null
  return nums
}

export function parseRgbString(text: string): RGBA | null {
  const nums = parseNumberList(text)
  if (!nums || nums.length < 3) return null
  const [r, g, b, a = 1] = nums
  if ([r, g, b].some((n) => n < 0 || n > 255)) return null
  return { r: Math.round(r), g: Math.round(g), b: Math.round(b), a: clamp(a, 0, 1) }
}

export function parseHslString(text: string): RGBA | null {
  const nums = parseNumberList(text)
  if (!nums || nums.length < 3) return null
  const [h, s, l, a = 1] = nums
  return hslToRgba(h, s / 100, l / 100, clamp(a, 0, 1))
}

export function parseHsvString(text: string): RGBA | null {
  const nums = parseNumberList(text)
  if (!nums || nums.length < 3) return null
  const [h, s, v, a = 1] = nums
  return hsvToRgba(h, s / 100, v / 100, clamp(a, 0, 1))
}

export function parseCmykString(text: string): RGBA | null {
  const nums = parseNumberList(text)
  if (!nums || nums.length < 4) return null
  const [c, m, y, k] = nums
  return cmykToRgba(c / 100, m / 100, y / 100, k / 100)
}
