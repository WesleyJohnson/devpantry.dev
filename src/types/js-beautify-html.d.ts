// js-beautify has no type declarations for its deep per-language subpaths
// (only the combined top-level package, which would bundle the JS and CSS
// beautifiers we don't use here alongside the HTML one). This covers just
// the one export this app actually imports.
declare module 'js-beautify/js/lib/beautify-html.js' {
  export function html_beautify(html_source: string, options?: Record<string, unknown>): string
}
