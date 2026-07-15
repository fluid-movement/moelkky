import { motion } from './reduced-motion.svelte.js';

interface Particle {
	x: number;
	y: number;
	vx: number;
	vy: number;
	rot: number;
	vr: number;
	size: number;
	color: string;
	life: number;
}

// Coin gold, XP cyan, blood red, gem green, soul white — pixel pickups.
const COLORS = ['#ffce3a', '#43cdea', '#ff4d5e', '#6ce06c', '#f3ecd6'];

/**
 * A small, dependency-free confetti burst rendered on a throwaway full-screen canvas.
 * No-ops under `prefers-reduced-motion`. Self-cleaning: removes its canvas when done.
 */
export function confettiBurst(origin: { x: number; y: number } = { x: 0.5, y: 0.3 }): void {
	if (!motion.ok || typeof document === 'undefined') return;

	const dpr = Math.min(window.devicePixelRatio || 1, 2);
	const canvas = document.createElement('canvas');
	canvas.style.cssText =
		'position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:9999';
	canvas.width = window.innerWidth * dpr;
	canvas.height = window.innerHeight * dpr;
	document.body.appendChild(canvas);

	const ctx = canvas.getContext('2d');
	if (!ctx) {
		canvas.remove();
		return;
	}
	ctx.scale(dpr, dpr);

	const w = window.innerWidth;
	const h = window.innerHeight;
	const ox = origin.x * w;
	const oy = origin.y * h;

	const particles: Particle[] = Array.from({ length: 140 }, () => {
		const angle = Math.random() * Math.PI * 2;
		const speed = 4 + Math.random() * 9;
		return {
			x: ox,
			y: oy,
			vx: Math.cos(angle) * speed,
			vy: Math.sin(angle) * speed - 6,
			rot: Math.random() * Math.PI,
			vr: (Math.random() - 0.5) * 0.4,
			size: 5 + Math.random() * 7,
			color: COLORS[(Math.random() * COLORS.length) | 0],
			life: 1
		};
	});

	const gravity = 0.28;
	const start = performance.now();

	function frame(now: number) {
		if (!ctx) return;
		const elapsed = now - start;
		ctx.clearRect(0, 0, w, h);

		let alive = false;
		for (const p of particles) {
			p.vy += gravity;
			p.x += p.vx;
			p.y += p.vy;
			p.rot += p.vr;
			if (elapsed > 1400) p.life -= 0.03;
			if (p.life > 0 && p.y < h + 40) {
				alive = true;
				ctx.save();
				ctx.globalAlpha = Math.max(0, p.life);
				ctx.translate(p.x, p.y);
				ctx.rotate(p.rot);
				ctx.fillStyle = p.color;
				ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
				ctx.restore();
			}
		}

		if (alive && elapsed < 4000) {
			requestAnimationFrame(frame);
		} else {
			canvas.remove();
		}
	}

	requestAnimationFrame(frame);
}
