// Static site generation: every route is a non-dynamic page, so we prerender the
// whole app to real HTML at build time (adapter-static). SSR must stay enabled
// (i.e. not `false`) for prerendering to emit content rather than empty shells;
// the client-only data (IndexedDB) still loads in `onMount` after hydration.
export const prerender = true;
// Emit `route/index.html` (not `route.html`) so a plain static host like nginx
// serves each route without extra rewrite rules.
export const trailingSlash = 'always';
