<script lang="ts">
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { Button } from '$lib/components/ui/button/index.js';
	import SettingsDialog from '$lib/components/settings-dialog.svelte';
	import InstallButton from '$lib/components/install-button.svelte';
	import { motion } from '$lib/motion/reduced-motion.svelte.js';
	import { ChartColumn, Play } from '@lucide/svelte';

	function enter(delay = 0, y = 14) {
		return motion.ok ? { y, delay, duration: 450, easing: cubicOut } : { duration: 0 };
	}
</script>

<div class="mx-auto flex min-h-svh w-full max-w-md flex-col px-6">
	<header class="flex items-center justify-end py-4">
		<SettingsDialog />
	</header>

	<main class="flex flex-1 flex-col items-center justify-center gap-10 pb-16">
		<div class="flex flex-col items-center gap-3 text-center">
			<div in:fly={enter(0, 18)}>
				<img
					src="/icons/icon.svg"
					alt=""
					width="96"
					height="96"
					class="animate-bob [image-rendering:pixelated]"
				/>
			</div>
			<h1
				class="font-display text-primary text-glow mt-1 text-2xl leading-tight"
				in:fly={enter(80)}
			>
				Mölkky
			</h1>
			<p class="text-muted-foreground" in:fly={enter(140)}>Let's Finnish this.</p>
		</div>

		<div class="flex w-full flex-col gap-3">
			<div in:fly={enter(220)}>
				<Button
					href="/game/new"
					size="lg"
					class="group h-14 w-full text-base transition-transform active:scale-[.97]"
				>
					<Play class="transition-transform group-hover:translate-x-0.5" />
					Start new game
				</Button>
			</div>
			<div in:fly={enter(290)}>
				<Button
					href="/stats"
					variant="outline"
					size="lg"
					class="group h-14 w-full text-base transition-transform active:scale-[.97]"
				>
					<ChartColumn class="transition-transform group-hover:-translate-y-0.5" />
					Stats
				</Button>
			</div>
			<InstallButton />
		</div>
	</main>
</div>
