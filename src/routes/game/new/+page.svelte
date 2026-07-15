<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { flip } from 'svelte/animate';
	import { scale } from 'svelte/transition';
	import { backOut, cubicOut } from 'svelte/easing';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { players as playerRepo } from '$lib/db/index.js';
	import { activeGame } from '$lib/state/game.svelte.js';
	import { settings } from '$lib/state/settings.svelte.js';
	import { motion } from '$lib/motion/reduced-motion.svelte.js';
	import { haptics } from '$lib/motion/haptics.js';
	import AnimatedNumber from '$lib/motion/animated-number.svelte';
	import type { Player } from '$lib/game/types';
	import { ArrowLeft, Check, Plus, Trash2, UserPlus } from '@lucide/svelte';

	let pool = $state<Player[]>([]);
	let selectedIds = $state<string[]>([]);
	let newName = $state('');
	let loading = $state(true);

	const canStart = $derived(selectedIds.length >= 2);

	onMount(async () => {
		pool = await playerRepo.list();
		loading = false;
	});

	const flipDuration = $derived(motion.ok ? 260 : 0);
	const badgePop = () =>
		motion.ok ? { duration: 320, start: 0.2, easing: backOut } : { duration: 0 };
	const rowIn = () =>
		motion.ok ? { duration: 240, start: 0.94, easing: cubicOut } : { duration: 0 };
	const startPop = () =>
		canStart && motion.ok ? { duration: 380, start: 0.9, easing: backOut } : { duration: 0 };

	function turnNumber(id: string): number {
		return selectedIds.indexOf(id) + 1;
	}

	function toggle(id: string) {
		haptics.tap();
		if (selectedIds.includes(id)) {
			selectedIds = selectedIds.filter((x) => x !== id);
		} else {
			selectedIds = [...selectedIds, id];
		}
	}

	async function addPlayer() {
		const name = newName.trim();
		if (!name) return;
		newName = ''; // clear synchronously so rapid entry can't concatenate into the next name
		haptics.tap();
		const player = await playerRepo.create(name);
		pool = [...pool, player].sort((a, b) => a.name.localeCompare(b.name));
		selectedIds = [...selectedIds, player.id];
	}

	async function removePlayer(id: string) {
		await playerRepo.remove(id);
		pool = pool.filter((p) => p.id !== id);
		selectedIds = selectedIds.filter((x) => x !== id);
	}

	function start() {
		if (!canStart) return;
		const chosen = selectedIds
			.map((id) => pool.find((p) => p.id === id))
			.filter((p): p is Player => p !== undefined)
			.map((p) => ({ id: p.id, name: p.name }));
		activeGame.start(chosen, settings.snapshot());
		goto('/game/play');
	}
</script>

<div class="mx-auto flex min-h-svh w-full max-w-md flex-col px-4">
	<header class="flex items-center gap-2 py-3">
		<Button href="/" variant="ghost" size="icon" aria-label="Back">
			<ArrowLeft />
		</Button>
		<h1 class="text-xl font-semibold">New game</h1>
	</header>

	<form
		class="flex gap-2 py-2"
		onsubmit={(e) => {
			e.preventDefault();
			addPlayer();
		}}
	>
		<Input bind:value={newName} placeholder="Add a player" maxlength={24} />
		<Button
			type="submit"
			size="icon"
			aria-label="Add player"
			disabled={!newName.trim()}
			class="transition-transform active:scale-90"
		>
			<Plus />
		</Button>
	</form>

	<div class="flex-1 overflow-y-auto py-2">
		{#if loading}
			<p class="text-muted-foreground py-8 text-center text-sm">Loading players…</p>
		{:else if pool.length === 0}
			<div class="text-muted-foreground flex flex-col items-center gap-2 py-12 text-center">
				<UserPlus class="animate-bob size-8 opacity-50" />
				<p class="text-sm">No players yet. Add one above to get started.</p>
			</div>
		{:else}
			<ul class="flex flex-col gap-2">
				{#each pool as player (player.id)}
					{@const selected = selectedIds.includes(player.id)}
					<li
						class="flex items-center gap-1"
						animate:flip={{ duration: flipDuration }}
						in:scale={rowIn()}
					>
						<button
							type="button"
							onclick={() => toggle(player.id)}
							aria-pressed={selected}
							class="flex flex-1 items-center gap-3 rounded-xl border p-3 text-left transition-all active:scale-[.99] {selected
								? 'border-primary bg-primary/5'
								: 'border-border hover:bg-muted'}"
						>
							<span
								class="flex size-7 shrink-0 items-center justify-center rounded-full border text-sm font-semibold transition-colors {selected
									? 'border-primary bg-primary text-primary-foreground'
									: 'border-border text-muted-foreground'}"
							>
								{#if selected}
									<span in:scale={badgePop()}>{turnNumber(player.id)}</span>
								{:else}
									<Check class="size-4 opacity-0" />
								{/if}
							</span>
							<span class="font-medium">{player.name}</span>
						</button>
						<Button
							variant="ghost"
							size="icon"
							aria-label={`Remove ${player.name}`}
							onclick={() => removePlayer(player.id)}
							class="transition-transform active:scale-90"
						>
							<Trash2 class="text-muted-foreground size-4" />
						</Button>
					</li>
				{/each}
			</ul>
		{/if}
	</div>

	<footer class="sticky bottom-0 py-3">
		{#key canStart}
			<div in:scale={startPop()}>
				<Button
					class="h-12 w-full text-base transition-transform active:scale-[.98]"
					disabled={!canStart}
					onclick={start}
				>
					{#if selectedIds.length < 2}
						Select at least 2 players
					{:else}
						Start with <AnimatedNumber value={selectedIds.length} duration={300} /> players
					{/if}
				</Button>
			</div>
		{/key}
	</footer>
</div>
