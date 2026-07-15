import { MediaQuery } from 'svelte/reactivity';

// Single reactive source of truth for whether motion is allowed. Every animation,
// confetti burst, and haptic in the app consults `motion.ok` so `prefers-reduced-motion`
// is respected in exactly one place.
const reduced = new MediaQuery('(prefers-reduced-motion: reduce)', false);

export const motion = {
	get ok(): boolean {
		return !reduced.current;
	}
};
