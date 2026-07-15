import { defineConfig } from 'vitest/config';

// Unit tests target the pure game logic in `src/lib/game`, which has no Svelte or
// browser dependencies — so we deliberately skip the SvelteKit/Vite plugin here.
export default defineConfig({
	test: {
		include: ['src/lib/**/*.{test,spec}.ts'],
		environment: 'node'
	}
});
