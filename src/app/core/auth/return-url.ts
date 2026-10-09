/**
 * Returns `candidate` only if it is a safe in-app path, otherwise `fallback`.
 * Prevents open redirects through the `returnUrl` query parameter (`//evil.com`, `https://...`).
 */
export function safeReturnUrl(candidate: unknown, fallback = '/dashboard'): string {
  if (typeof candidate !== 'string') {
    return fallback;
  }
  const isInternalPath = candidate.startsWith('/') && !candidate.startsWith('//');
  const hasBackslash = candidate.includes('\\');
  return isInternalPath && !hasBackslash ? candidate : fallback;
}
