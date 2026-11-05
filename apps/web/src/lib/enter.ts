// After a demo sign-in, open the area with a full page load instead of a client-side push. A change of identity must
// not reuse anything the client router cached for the previous visitor: an anonymous prefetch of /app, for example,
// is a cached redirect to /demo, and router.push("/app") would replay it (found by the e2e test in a fresh browser).
export function enterAs(path: string): void {
  window.location.assign(path);
}

/** Areas behind a demo sign-in. Links into them from public pages must not prefetch (see enterAs). */
export function isSignedInArea(href: string): boolean {
  return /^\/(app|clinic|admin)(\/|$|\?)/.test(href);
}
