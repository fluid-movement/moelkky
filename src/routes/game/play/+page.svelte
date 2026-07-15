<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { goto } from '$app/navigation';
	import { fly, scale } from 'svelte/transition';
	import { backOut } from 'svelte/easing';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { games } from '$lib/db/index.js';
	import { activeGame } from '$lib/state/game.svelte.js';
	import type { ActiveCell } from '$lib/game/types';
	import { MAX_THROW, OVERSHOOT_RESET, WIN_SCORE } from '$lib/game/constants.js';
	import { motion } from '$lib/motion/reduced-motion.svelte.js';
	import { haptics } from '$lib/motion/haptics.js';
	import { confettiBurst } from '$lib/motion/confetti.js';
	import AnimatedNumber from '$lib/motion/animated-number.svelte';
	import { Trophy, X } from '@lucide/svelte';

	let ready = $state(false);
	/** A cell the user tapped to edit; otherwise we follow the auto-advancing active cell. */
	let selectedCell = $state<ActiveCell | null>(null);
	/** Set when the user closes the win dialog to review scores. */
	let winDismissed = $state(false);

	// Transient feedback state
	let bustFlash = $state<number | null>(null);
	let shakeCol = $state<number | null>(null);
	let flash = $state<{ text: string; tone: 'bust' | 'out' } | null>(null);
	let flashTimer: ReturnType<typeof setTimeout> | undefined;

	const players = $derived(activeGame.players);
	const standings = $derived(activeGame.standings);
	const showWin = $derived(standings.status === 'finished' && !winDismissed);
	const targetCell = $derived(selectedCell ?? activeGame.activeCell);
	const rowCount = $derived(
		Math.max(1, activeGame.grid.length, targetCell ? targetCell.round + 1 : 0)
	);
	const rounds = $derived(Array.from({ length: rowCount }, (_, i) => i));
	const keypad = Array.from({ length: MAX_THROW }, (_, i) => i + 1); // 1..12

	const cellPop = () =>
		motion.ok ? { duration: 260, start: 0.3, easing: backOut } : { duration: 0 };

	onMount(async () => {
		if (!activeGame.hasGame) {
			const snapshot = await games.loadActive();
			if (snapshot) {
				activeGame.resume(snapshot);
			} else {
				goto('/game/new');
				return;
			}
		}
		ready = true;
	});

	function showFlash(text: string, tone: 'bust' | 'out') {
		flash = { text, tone };
		clearTimeout(flashTimer);
		flashTimer = setTimeout(() => (flash = null), 1500);
	}

	function cellValue(round: number, playerIndex: number): number | null {
		return activeGame.grid[round]?.[playerIndex] ?? null;
	}

	function isTarget(round: number, playerIndex: number): boolean {
		return targetCell?.round === round && targetCell?.playerIndex === playerIndex;
	}

	function selectCell(round: number, playerIndex: number) {
		selectedCell = { round, playerIndex };
	}

	async function press(points: number) {
		const cell = targetCell;
		if (!cell) return;
		const p = cell.playerIndex;
		const before = standings.players[p];
		const prevTotal = before.total;
		const prevEliminated = before.eliminated;
		const wasFinished = standings.status === 'finished';

		activeGame.setCell(cell.round, p, points);
		selectedCell = null; // resume auto-advance
		haptics.tap();

		await tick();
		const after = standings.players[p];

		if (
			!prevEliminated &&
			points > 0 &&
			prevTotal + points > WIN_SCORE &&
			after.total === OVERSHOOT_RESET
		) {
			bustFlash = p;
			showFlash('Bust! Back to 25', 'bust');
			haptics.bust();
			setTimeout(() => (bustFlash = null), 700);
		}
		if (!prevEliminated && after.eliminated) {
			shakeCol = p;
			showFlash(`${players[p]?.name} is out!`, 'out');
			setTimeout(() => (shakeCol = null), 500);
		}
		if (!wasFinished && standings.status === 'finished') {
			confettiBurst({ x: 0.5, y: 0.28 });
			haptics.celebrate();
		}
	}

	function playAgain() {
		activeGame.reset();
		goto('/game/new');
	}
</script>

<div class="relative mx-auto flex min-h-svh w-full max-w-2xl flex-col">
	<header class="flex items-center justify-between gap-2 px-4 py-3">
		<h1 class="font-display text-sm">Scoring</h1>
		<Button
			href="/"
			variant="ghost"
			size="icon"
			aria-label="Quit to home"
			class="transition-transform active:scale-90"
		>
			<X />
		</Button>
	</header>

	{#if flash}
		<div
			class="pointer-events-none absolute inset-x-0 top-14 z-20 flex justify-center"
			in:fly={motion.ok ? { y: -12, duration: 260 } : { duration: 0 }}
			out:scale={motion.ok ? { start: 0.9, duration: 200 } : { duration: 0 }}
		>
			<span
				class="font-display px-4 py-2 text-[10px] shadow-lg {flash.tone === 'bust'
					? 'bg-destructive text-white'
					: 'bg-primary text-primary-foreground'}"
			>
				{flash.text}
			</span>
		</div>
	{/if}

	{#if !ready}
		<p class="text-muted-foreground py-12 text-center text-sm">Loading game…</p>
	{:else}
		<!-- Score table -->
		<div class="flex-1 overflow-auto px-2">
			<table class="w-full border-separate border-spacing-0">
				<thead class="sticky top-0 z-10">
					<tr>
						<th class="bg-background text-muted-foreground w-8 p-1 text-xs font-normal"></th>
						{#each players as player, p (player.id)}
							{@const st = standings.players[p]}
							<th class="bg-background p-1 text-center {st.eliminated ? 'opacity-40' : ''}">
								<div
									class="flex flex-col items-center gap-0.5"
									class:animate-shake={shakeCol === p}
								>
									<span class="flex max-w-24 items-center gap-1 truncate text-sm font-medium">
										{#if st.hasWon}
											<Trophy class="text-gold size-3.5 shrink-0" />
										{/if}
										{player.name}
									</span>
									<span
										class="font-display text-xl tabular-nums {st.hasWon
											? 'text-primary text-glow'
											: ''}"
										class:animate-bust={bustFlash === p}
									>
										<AnimatedNumber value={st.total} />
									</span>
									{#if st.eliminated}
										<span
											class="text-destructive animate-stamp text-[10px] font-semibold uppercase"
										>
											Out
										</span>
									{:else if activeGame.settings.eliminationRule && st.consecutiveMisses > 0}
										<span class="text-muted-foreground text-[10px]">
											{st.consecutiveMisses} miss{st.consecutiveMisses > 1 ? 'es' : ''}
										</span>
									{/if}
								</div>
							</th>
						{/each}
					</tr>
				</thead>
				<tbody>
					{#each rounds as round (round)}
						<tr>
							<td class="text-muted-foreground p-1 text-center text-xs tabular-nums">
								{round + 1}
							</td>
							{#each players as player, p (player.id)}
								{@const value = cellValue(round, p)}
								{@const target = isTarget(round, p)}
								<td class="p-0.5">
									<button
										type="button"
										onclick={() => selectCell(round, p)}
										class="flex h-11 w-full items-center justify-center rounded-md border text-lg font-semibold tabular-nums transition-all active:scale-95 {target
											? 'glow-pulse border-primary bg-primary/10'
											: 'border-border hover:bg-muted'} {standings.players[p].eliminated
											? 'opacity-40'
											: ''}"
									>
										{#if value === null}
											<span class="text-muted-foreground/40">·</span>
										{:else}
											{#key value}
												<span
													in:scale={cellPop()}
													class={value === 0 ? 'text-muted-foreground' : ''}
												>
													{value === 0 ? '–' : value}
												</span>
											{/key}
										{/if}
									</button>
								</td>
							{/each}
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<!-- Keypad -->
		<div class="bg-background sticky bottom-0 border-t px-3 pt-2 pb-4">
			<p class="text-muted-foreground mb-2 text-center text-sm">
				{#if targetCell}
					<span class="text-foreground font-medium">{players[targetCell.playerIndex]?.name}</span>
					— tap a score
				{:else}
					Game over
				{/if}
			</p>
			<div class="grid grid-cols-4 gap-2">
				{#each keypad as n (n)}
					<Button
						variant="outline"
						class="font-display h-12 text-sm transition-transform active:scale-95"
						disabled={!targetCell}
						onclick={() => press(n)}
					>
						{n}
					</Button>
				{/each}
				<Button
					variant="secondary"
					class="col-span-4 h-11 font-medium transition-transform active:scale-[.98]"
					disabled={!targetCell}
					onclick={() => press(0)}
				>
					Miss (0)
				</Button>
			</div>
		</div>
	{/if}
</div>

<Dialog.Root bind:open={() => showWin, (v) => (winDismissed = !v)}>
	<Dialog.Content class="sm:max-w-sm">
		<Dialog.Header>
			<div class="flex flex-col items-center gap-3 py-2 text-center">
				<div
					class="bg-primary/10 animate-pop flex size-16 items-center justify-center rounded-full"
				>
					<Trophy class="text-gold size-8" />
				</div>
				<Dialog.Title class="font-display text-primary text-glow text-lg leading-relaxed">
					{activeGame.winner?.name} wins!
				</Dialog.Title>
				<Dialog.Description>Reached 50. Nicely thrown.</Dialog.Description>
			</div>
		</Dialog.Header>
		<div class="flex flex-col gap-2">
			<Button onclick={playAgain} class="transition-transform active:scale-[.98]">New game</Button>
			<Button href="/" variant="outline">Home</Button>
			<Button variant="ghost" onclick={() => (winDismissed = true)}>Review scores</Button>
		</div>
	</Dialog.Content>
</Dialog.Root>
