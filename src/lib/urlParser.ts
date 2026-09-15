export interface ParsedUrlInfo {
  href: string
  protocol: string
  username: string
  password: string
  host: string
  hostname: string
  port: string
  pathname: string
  search: string
  hash: string
  origin: string
  params: { key: string; value: string }[]
}

export interface ParseUrlResult {
  info: ParsedUrlInfo | null
  error: string | null
}

// Just a thin wrapper around the browser's own WHATWG URL implementation —
// there's no hand-rolled parsing here, so accuracy is guaranteed by
// construction rather than something we need to verify against test vectors.
export function parseUrl(input: string): ParseUrlResult {
  const trimmed = input.trim()
  if (!trimmed) return { info: null, error: null }

  try {
    const url = new URL(trimmed)
    const params: { key: string; value: string }[] = []
    url.searchParams.forEach((value, key) => params.push({ key, value }))

    return {
      info: {
        href: url.href,
        protocol: url.protocol.replace(/:$/, ''),
        username: url.username,
        password: url.password,
        host: url.host,
        hostname: url.hostname,
        port: url.port,
        pathname: url.pathname,
        search: url.search,
        hash: url.hash,
        origin: url.origin,
        params,
      },
      error: null,
    }
  } catch {
    return {
      info: null,
      error: "Couldn't parse — is this a valid absolute URL? Try including a scheme, like https://",
    }
  }
}

export function formatUrlSummary(info: ParsedUrlInfo): string {
  const lines = [
    `URL: ${info.href}`,
    `Protocol: ${info.protocol}`,
    ...(info.username ? [`Username: ${info.username}`] : []),
    ...(info.password ? [`Password: ${info.password}`] : []),
    `Host: ${info.host}`,
    `Hostname: ${info.hostname}`,
    ...(info.port ? [`Port: ${info.port}`] : []),
    `Path: ${info.pathname}`,
    ...(info.search ? [`Query: ${info.search}`] : []),
    ...(info.hash ? [`Hash: ${info.hash}`] : []),
  ]
  if (info.params.length > 0) {
    lines.push('', 'Query parameters:')
    for (const { key, value } of info.params) lines.push(`  ${key} = ${value}`)
  }
  return lines.join('\n')
}
