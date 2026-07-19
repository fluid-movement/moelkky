import { MAX_MISSES, MAX_THROW, MIN_THROW, OVERSHOOT_RESET, WIN_SCORE } from './constants';
import type {
	ActiveCell,
	GameSettings,
	PlayerStanding,
	RoundGrid,
	Standings,
	WinReason
} from './types';

/** Whether `points` is a legal single-throw score (integer 0–12). */
export function isValidThrow(points: number): boolean {
	return Number.isInteger(points) && points >= MIN_THROW && points <= MAX_THROW;
}

interface PlayerRun extends PlayerStanding {
	/** Round index at which the player reached {@link WIN_SCORE}, else Infinity. */
	wonAtRound: number;
}

/**
 * Derive one player's standing by replaying their column of throws in order.
 * Throws after a win or elimination are ignored (the game has ended for them).
 */
function runPlayer(grid: RoundGrid, playerIndex: number, settings: GameSettings): PlayerRun {
	let total = 0;
	let consecutiveMisses = 0;
	let eliminated = false;
	let hasWon = false;
	let wonAtRound = Infinity;

	for (let round = 0; round < grid.length; round++) {
		const value = grid[round]?.[playerIndex];
		if (value == null) continue; // not thrown yet
		if (hasWon || eliminated) break; // game over for this player

		if (value === 0) {
			consecutiveMisses++;
			if (settings.eliminationRule && consecutiveMisses >= MAX_MISSES) {
				eliminated = true;
			}
			continue;
		}

		consecutiveMisses = 0;
		total += value;
		if (total === WIN_SCORE) {
			hasWon = true;
			wonAtRound = round;
		} else if (total > WIN_SCORE) {
			total = OVERSHOOT_RESET;
		}
	}

	return { playerIndex, total, consecutiveMisses, eliminated, hasWon, wonAtRound };
}

/**
 * Derive the full standings for a game from its raw throw grid. Pure — the same grid
 * always yields the same result, which is what makes cell-editing safe.
 */
export function computeStandings(
	grid: RoundGrid,
	playerCount: number,
	settings: GameSettings
): Standings {
	const players: PlayerStanding[] = [];
	let winnerIndex: number | null = null;
	let winnerWonAtRound = Infinity;

	for (let p = 0; p < playerCount; p++) {
		const run = runPlayer(grid, p, settings);
		players.push({
			playerIndex: run.playerIndex,
			total: run.total,
			consecutiveMisses: run.consecutiveMisses,
			eliminated: run.eliminated,
			hasWon: run.hasWon
		});
		// The winner is whoever reached 50 earliest in play order. Play order within a
		// round is by ascending player index, so a lower index breaks a same-round tie.
		if (run.hasWon && run.wonAtRound < winnerWonAtRound) {
			winnerWonAtRound = run.wonAtRound;
			winnerIndex = p;
		}
	}

	let winReason: WinReason | null = winnerIndex !== null ? 'score' : null;

	// Last one standing: with elimination on, if nobody has reached 50 but every player
	// bar one has been eliminated, the sole survivor wins.
	if (winnerIndex === null && settings.eliminationRule && playerCount > 1) {
		const survivors = players.filter((s) => !s.eliminated);
		if (survivors.length === 1) {
			winnerIndex = survivors[0].playerIndex;
			winReason = 'lastStanding';
		}
	}

	return {
		players,
		winnerIndex,
		winReason,
		status: winnerIndex !== null ? 'finished' : 'active'
	};
}

/**
 * The cell that should be highlighted / filled next: the earliest empty cell in play
 * order (round-major, then player index) belonging to a still-active player. Returns
 * `null` once the game is finished or every remaining player is eliminated.
 */
export function nextActiveCell(
	grid: RoundGrid,
	standings: Standings,
	playerCount: number
): ActiveCell | null {
	if (standings.status === 'finished') return null;

	const isActive = (p: number) => !standings.players[p]?.eliminated;

	for (let round = 0; round < grid.length; round++) {
		for (let p = 0; p < playerCount; p++) {
			if (!isActive(p)) continue;
			if (grid[round]?.[p] == null) return { round, playerIndex: p };
		}
	}

	// Every existing round is full — the next throw starts a fresh round.
	for (let p = 0; p < playerCount; p++) {
		if (isActive(p)) return { round: grid.length, playerIndex: p };
	}

	return null; // everyone eliminated
}
