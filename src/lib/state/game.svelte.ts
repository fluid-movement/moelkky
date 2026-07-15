import { games } from '$lib/db';
import { computeStandings, nextActiveCell } from '$lib/game/engine';
import type {
	ActiveCell,
	ActiveGame,
	GameRecord,
	GameSettings,
	RoundGrid,
	Standings
} from '$lib/game/types';

export interface GamePlayer {
	id: string;
	name: string;
}

/**
 * The reactive active-game store. Holds the raw throw grid in `$state` and derives
 * standings / the next active cell from the pure engine, so every read is always
 * consistent with the throws. Mutations auto-persist the game (resume-after-refresh)
 * and finalize a completed game into the stats history.
 */
class ActiveGameStore {
	id = $state('');
	players = $state<GamePlayer[]>([]);
	settings = $state<GameSettings>({ eliminationRule: true });
	grid = $state<RoundGrid>([]);
	startedAt = $state(0);

	standings: Standings = $derived(computeStandings(this.grid, this.players.length, this.settings));
	activeCell: ActiveCell | null = $derived(
		nextActiveCell(this.grid, this.standings, this.players.length)
	);
	winner: GamePlayer | null = $derived(
		this.standings.winnerIndex === null ? null : this.players[this.standings.winnerIndex]
	);

	get hasGame(): boolean {
		return this.players.length > 0;
	}

	/** Begin a fresh game with the chosen players and rules. */
	start(players: GamePlayer[], settings: GameSettings) {
		this.id = crypto.randomUUID();
		this.players = players.map((p) => ({ ...p }));
		this.settings = { ...settings };
		this.grid = [];
		this.startedAt = Date.now();
		void games.saveActive(this.snapshot());
	}

	/** Rehydrate from a persisted snapshot (e.g. after a page refresh). */
	resume(snapshot: ActiveGame) {
		this.id = snapshot.playerIds.join(':') + ':' + snapshot.startedAt;
		this.players = snapshot.playerIds.map((id, i) => ({
			id,
			name: snapshot.playerNames[i]
		}));
		this.settings = { ...snapshot.settings };
		this.grid = snapshot.grid.map((row) => [...row]);
		this.startedAt = snapshot.startedAt;
	}

	/** Fill the currently highlighted cell (used by the keypad). */
	enterScore(points: number) {
		if (!this.activeCell) return;
		this.setCell(this.activeCell.round, this.activeCell.playerIndex, points);
	}

	/** Set (or clear, with `null`) any cell — powers editing existing scores. */
	setCell(round: number, playerIndex: number, value: number | null) {
		while (this.grid.length <= round) {
			this.grid.push(Array(this.players.length).fill(null));
		}
		this.grid[round][playerIndex] = value;
		this.#afterChange();
	}

	reset() {
		this.id = '';
		this.players = [];
		this.grid = [];
		this.startedAt = 0;
	}

	snapshot(): ActiveGame {
		return {
			playerIds: this.players.map((p) => p.id),
			playerNames: this.players.map((p) => p.name),
			settings: { ...this.settings },
			grid: $state.snapshot(this.grid) as RoundGrid,
			startedAt: this.startedAt
		};
	}

	#afterChange() {
		if (this.standings.status === 'finished') {
			void games.saveCompleted(this.#buildRecord());
			void games.clearActive();
		} else {
			void games.saveActive(this.snapshot());
		}
	}

	#buildRecord(): GameRecord {
		const finalScores: Record<string, number> = {};
		for (const s of this.standings.players) {
			finalScores[this.players[s.playerIndex].id] = s.total;
		}
		const winnerId =
			this.standings.winnerIndex === null ? '' : this.players[this.standings.winnerIndex].id;
		return {
			id: this.id,
			playedAt: Date.now(),
			settings: { ...this.settings },
			playerIds: this.players.map((p) => p.id),
			winnerId,
			finalScores
		};
	}
}

export const activeGame = new ActiveGameStore();
