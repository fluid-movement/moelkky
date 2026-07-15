import { motion } from './reduced-motion.svelte.js';

// Tiny wrappers over the Vibration API. No-op when unsupported (desktop/iOS Safari) or
// when the user prefers reduced motion — so callers never need to guard.
function vibrate(pattern: number | number[]): void {
	if (!motion.ok) return;
	if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
	try {
		navigator.vibrate(pattern);
	} catch {
		// some browsers throw if called without a user gesture — ignore
	}
}

export const haptics = {
	/** A light tick for taps (keypad, selection). */
	tap: () => vibrate(8),
	/** A jolt for busting over 50. */
	bust: () => vibrate([25, 40, 25]),
	/** A celebratory pattern for a win. */
	celebrate: () => vibrate([12, 30, 12, 30, 60])
};
