import { bigquery, formatDialect, mariadb, mysql, postgresql, sql, sqlite, transactsql, type KeywordCase } from 'sql-formatter'

// A curated subset of sql-formatter's ~20 supported dialects rather than the
// full set — each dialect object is its own tree-shakeable grammar module,
// so importing only these keeps the (lazy-loaded) bundle for this tool at
// roughly 32KB gzipped instead of ~76KB for every dialect the library ships.
export const DIALECTS = {
  sql: { label: 'Standard SQL', dialect: sql },
  mysql: { label: 'MySQL', dialect: mysql },
  postgresql: { label: 'PostgreSQL', dialect: postgresql },
  sqlite: { label: 'SQLite', dialect: sqlite },
  mariadb: { label: 'MariaDB', dialect: mariadb },
  transactsql: { label: 'SQL Server (T-SQL)', dialect: transactsql },
  bigquery: { label: 'BigQuery', dialect: bigquery },
} as const

export type DialectKey = keyof typeof DIALECTS
export type { KeywordCase }

export interface SqlFormatResult {
  output: string
  error: string | null
}

export function formatSql(input: string, dialectKey: DialectKey, keywordCase: KeywordCase): SqlFormatResult {
  if (!input.trim()) return { output: '', error: null }
  try {
    const output = formatDialect(input, {
      dialect: DIALECTS[dialectKey].dialect,
      keywordCase,
      tabWidth: 2,
    })
    return { output, error: null }
  } catch (e) {
    // sql-formatter's parser errors include a full grammar production trace
    // after the first line (tens of thousands of characters listing every
    // rule the parser was trying to match) — genuinely useful for debugging
    // the grammar itself, but useless noise for a user who just mistyped a
    // query. The first line alone is a clean "Parse error at token X at
    // line Y column Z" across every case tried (unterminated parens, a
    // stray closing paren, an empty CREATE TABLE body).
    const message = e instanceof Error ? e.message.split('\n')[0] : "Couldn't format SQL"
    return { output: '', error: message }
  }
}
