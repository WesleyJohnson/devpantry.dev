import type { Tiktoken } from 'js-tiktoken/lite'

export type ExactEncodingId = 'o200k_base' | 'cl100k_base'

export interface TokenizerRow {
  id: string
  label: string
  kind: 'exact' | 'approx'
  encoding?: ExactEncodingId
}

export const TOKENIZERS: TokenizerRow[] = [
  { id: 'o200k', label: 'GPT-4o / GPT-4.1 / o-series / GPT-5', kind: 'exact', encoding: 'o200k_base' },
  { id: 'cl100k', label: 'GPT-3.5 / GPT-4 (legacy)', kind: 'exact', encoding: 'cl100k_base' },
  { id: 'approx', label: 'Claude, Gemini, Llama & others', kind: 'approx' },
]

// Rank data is bundled locally (js-tiktoken/ranks/*) rather than fetched from
// js-tiktoken's CDN, so counting never touches the network — dynamic import()
// only pulls the ~1-2MB rank table out of the initial bundle, it doesn't fetch
// anything remote. Each encoding is loaded and built at most once.
const encoderCache = new Map<ExactEncodingId, Promise<Tiktoken>>()

async function loadEncoder(encoding: ExactEncodingId): Promise<Tiktoken> {
  let cached = encoderCache.get(encoding)
  if (!cached) {
    cached = (async () => {
      const { Tiktoken: TiktokenCtor } = await import('js-tiktoken/lite')
      const ranks =
        encoding === 'o200k_base'
          ? (await import('js-tiktoken/ranks/o200k_base')).default
          : (await import('js-tiktoken/ranks/cl100k_base')).default
      return new TiktokenCtor(ranks)
    })()
    encoderCache.set(encoding, cached)
  }
  return cached
}

export async function countExactTokens(encoding: ExactEncodingId, text: string): Promise<number> {
  if (!text) return 0
  const enc = await loadEncoder(encoding)
  return enc.encode(text).length
}

// A disclosed approximation for tokenizers that can't run locally — Claude
// and Gemini don't publish a downloadable vocabulary the way OpenAI does.
// Based on the commonly cited ~4-characters-per-token rule of thumb for
// English text; real counts for those models can differ meaningfully.
export function estimateApproxTokens(text: string): number {
  const trimmed = text.trim()
  if (!trimmed) return 0
  return Math.max(1, Math.round(trimmed.length / 4))
}

export function countCharsAndWords(text: string): { chars: number; words: number } {
  const trimmed = text.trim()
  return { chars: text.length, words: trimmed ? trimmed.split(/\s+/).length : 0 }
}
