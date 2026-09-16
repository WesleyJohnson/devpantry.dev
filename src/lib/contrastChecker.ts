import { hexToRgba, parseHslString, parseRgbString, type RGBA } from '@/lib/colorConverter'

// Reuses the same hex/rgb/hsl parsers as the Color Converter tool. Dispatch
// has to go by the string's own prefix rather than just trying each parser
// in turn: parseRgbString and parseHslString both delegate to the same
// format-agnostic "numbers inside parens" extractor, so a plain fallback
// chain would silently misparse "hsl(0, 0%, 100%)" as rgb(0, 0, 100) — the
// wrong color — since parseRgbString would happily match numbers it was
// never meant to receive.
export function parseAnyColor(text: string): RGBA | null {
  const trimmed = text.trim()
  if (!trimmed) return null
  if (/^hsla?\(/i.test(trimmed)) return parseHslString(trimmed)
  if (/^rgba?\(/i.test(trimmed)) return parseRgbString(trimmed)
  return hexToRgba(trimmed)
}

// WCAG 2.x relative luminance (https://www.w3.org/TR/WCAG21/#dfn-relative-luminance):
// each sRGB channel is linearized, then combined with the standard
// perceptual weights. This is the exact published formula, not an
// approximation — contrast ratios computed from it are directly comparable
// to what a real accessibility auditor (axe, Lighthouse) reports.
function relativeLuminance({ r, g, b }: RGBA): number {
  const linearize = (channel: number) => {
    const c = channel / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  const [rl, gl, bl] = [linearize(r), linearize(g), linearize(b)]
  return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl
}

export function contrastRatio(a: RGBA, b: RGBA): number {
  const la = relativeLuminance(a)
  const lb = relativeLuminance(b)
  const lighter = Math.max(la, lb)
  const darker = Math.min(la, lb)
  return (lighter + 0.05) / (darker + 0.05)
}

export interface WcagVerdict {
  ratio: number
  aaNormal: boolean
  aaLarge: boolean
  aaaNormal: boolean
  aaaLarge: boolean
  aaUiComponent: boolean
}

// Thresholds from WCAG 2.1 SC 1.4.3 (Contrast Minimum), 1.4.6 (Contrast
// Enhanced), and 1.4.11 (Non-text Contrast). "Large text" is >=18pt, or
// >=14pt bold, per the same spec.
export function evaluateContrast(a: RGBA, b: RGBA): WcagVerdict {
  const ratio = contrastRatio(a, b)
  return {
    ratio,
    aaNormal: ratio >= 4.5,
    aaLarge: ratio >= 3,
    aaaNormal: ratio >= 7,
    aaaLarge: ratio >= 4.5,
    aaUiComponent: ratio >= 3,
  }
}
