<script lang="ts">
	import { onMount } from 'svelte';
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { games as gameRepo, players as playerRepo } from '$lib/db/index.js';
	import { computeAllStats } from '$lib/game/stats.js';
	import { motion } from '$lib/motion/reduced-motion.svelte.js';
	import AnimatedNumber from '$lib/motion/animated-number.svelte';
	import type { GameRecord, Player, PlayerStats } from '$lib/game/types';
	import { ArrowLeft, ChartColumn } from '@lucide/svelte';

	let players = $state<Player[]>([]);
	let history = $state<GameRecord[]>([]);
	let loading = $state(true);
	let selectedId = $state<string | null>(null);

	const MEDALS = ['🥇', '🥈', '🥉'];

	function nameOf(id: string): string {
		return players.find((p) => p.id === id)?.name ?? 'Unknown';
	}

	const stats = $derived(
		computeAllStats(
			history,
			players.map((p) => p.id)
		).sort((a, b) => b.winRate - a.winRate || b.gamesPlayed - a.gamesPlayed)
	);

	const selected = $derived<PlayerStats | null>(
		selectedId === null ? null : (stats.find((s) => s.playerId === selectedId) ?? null)
	);

	onMount(async () => {
		[players, history] = await Promise.all([playerRepo.list(), gameRepo.listCompleted()]);
		loading = false;
	});

	function pct(rate: number, games: number): string {
		return games === 0 ? '—' : `${Math.round(rate * 100)}%`;
	}

	const rowIn = (i: number) =>
		motion.ok
			? { y: 10, delay: Math.min(i, 8) * 45, duration: 320, easing: cubicOut }
			: { duration: 0 };
</script>

<div class="mx-auto flex min-h-svh w-full max-w-md flex-col px-4">
	<header class="flex items-center gap-2 py-3">
		<Button href="/" variant="ghost" size="icon" aria-label="Back">
			<ArrowLeft />
		</Button>
		<h1 class="text-xl font-semibold">Stats</h1>
	</header>

	{#if loading}
		<p class="text-muted-foreground py-12 text-center text-sm">Loading stats…</p>
	{:else if history.length === 0}
		<div
			class="text-muted-foreground flex flex-1 flex-col items-center justify-center gap-2 text-center"
		>
			<ChartColumn class="animate-bob size-8 opacity-50" />
			<p class="text-sm">No games played yet. Finish a game to see stats here.</p>
		</div>
	{:else}
		<ul class="flex flex-col gap-2 py-2">
			{#each stats as s, i (s.playerId)}
				{@const medal = s.gamesPlayed > 0 && i < 3 ? MEDALS[i] : null}
				<li in:fly={rowIn(i)}>
					<button
						type="button"
						onclick={() => (selectedId = s.playerId)}
						class="border-border hover:bg-muted flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all active:scale-[.99]"
					>
						<span class="w-6 shrink-0 text-center text-lg">
							{#if medal}
								{medal}
							{:else}
								<span class="text-muted-foreground text-sm tabular-nums">{i + 1}</span>
							{/if}
						</span>
						<div class="flex-1">
							<p class="font-medium">{nameOf(s.playerId)}</p>
							<p class="text-muted-foreground text-sm">
								{s.gamesPlayed} game{s.gamesPlayed === 1 ? '' : 's'} · {s.wins} win{s.wins === 1
									? ''
									: 's'}
							</p>
						</div>
						<div class="text-right">
							{#if s.gamesPlayed > 0}
								<p class="text-primary text-xl font-bold tabular-nums">
									<AnimatedNumber value={Math.round(s.winRate * 100)} suffix="%" />
								</p>
							{:else}
								<p class="text-muted-foreground text-xl font-bold">—</p>
							{/if}
							<p class="text-muted-foreground text-xs">win rate</p>
						</div>
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<Dialog.Root bind:open={() => selected !== null, (v) => (selectedId = v ? selectedId : null)}>
	<Dialog.Content class="sm:max-w-sm">
		{#if selected}
			<Dialog.Header>
				<Dialog.Title>{nameOf(selected.playerId)}</Dialog.Title>
				<Dialog.Description>
					{selected.wins} win{selected.wins === 1 ? '' : 's'} in {selected.gamesPlayed} game{selected.gamesPlayed ===
					1
						? ''
						: 's'} · {pct(selected.winRate, selected.gamesPlayed)} win rate
				</Dialog.Description>
			</Dialog.Header>
			<Separator />
			<div>
				<h3 class="text-muted-foreground mb-2 text-xs font-semibold uppercase">Head to head</h3>
				{#if Object.keys(selected.headToHead).length === 0}
					<p class="text-muted-foreground text-sm">No shared games yet.</p>
				{:else}
					<ul class="flex flex-col gap-2.5">
						{#each Object.values(selected.headToHead) as h, i (h.opponentId)}
							<li class="flex flex-col gap-1" in:fly={rowIn(i)}>
								<div class="flex items-center justify-between gap-2 text-sm">
									<span class="truncate">vs {nameOf(h.opponentId)}</span>
									<span class="text-muted-foreground tabular-nums">
										{h.wins}–{h.games - h.wins}
										<span class="text-foreground ml-1 font-medium">{pct(h.winRate, h.games)}</span>
									</span>
								</div>
								<div class="bg-muted h-1.5 w-full overflow-hidden rounded-full">
									<div
										class="bg-primary h-full rounded-full"
										style="width: {Math.round(h.winRate * 100)}%"
									></div>
								</div>
							</li>
						{/each}
					</ul>
				{/if}
			</div>
		{/if}
	</Dialog.Content>
</Dialog.Root>
