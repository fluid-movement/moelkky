<script lang="ts">
	import { Tween } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	import { motion } from '$lib/motion/reduced-motion.svelte.js';

	let {
		value,
		duration = 500,
		suffix = '',
		class: className = ''
	}: {
		value: number;
		duration?: number;
		suffix?: string;
		class?: string;
	} = $props();

	// Rolls to `value` on change; snaps instantly under `prefers-reduced-motion`.
	const tween = Tween.of(() => value, {
		duration: () => (motion.ok ? duration : 0),
		easing: cubicOut
	});

	const display = $derived(Math.round(tween.current));
</script>

<span class={className}>{display}{suffix}</span>
