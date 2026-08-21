/**
 * Resolves a /products/*.png path.
 *
 * In dev the file is served from /public. In the single-file bundle there is no
 * server at all, so the build injects `window.__ASSETS` (hash stem -> data URI)
 * and every image is looked up here instead of fetched.
 */
declare global {
  interface Window { __ASSETS?: Record<string, string> }
}

export function asset(path: string): string {
  const stem = path.replace('/products/', '').replace('.png', '');
  return (typeof window !== 'undefined' && window.__ASSETS?.[stem]) || path;
}
