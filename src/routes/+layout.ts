// Fully client-rendered SPA: all state is stored in the browser (IndexedDB /
// localStorage), so there is nothing to server-render. Served via the fallback page.
export const ssr = false;
export const prerender = false;
