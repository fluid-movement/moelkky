import { describe, expect, it } from 'vitest';
import { computeStandings, isValidThrow, nextActiveCell } from './engine';
import type { GameSettings, RoundGrid } from './types';

const WITH_ELIM: GameSettings = { eliminationRule: true };
const NO_ELIM: GameSettings = { eliminationRule: false };

/** Build a round grid from per-player throw columns, padding short columns with null. */
function fromColumns(columns: number[][]): RoundGrid {
	const rounds = Math.max(...columns.map((c) => c.length));
	const grid: RoundGrid = [];
	for (let r = 0; r < rounds; r++) {
		grid.push(columns.map((c) => (r < c.length ? c[r] : null)));
	}
	return grid;
}

describe('isValidThrow', () => {
	it('accepts 0..12 integers only', () => {
		expect(isValidThrow(0)).toBe(true);
		expect(isValidThrow(12)).toBe(true);
		expect(isValidThrow(13)).toBe(false);
		expect(isValidThrow(-1)).toBe(false);
		expect(isValidThrow(3.5)).toBe(false);
	});
});

describe('computeStandings — scoring', () => {
	it('accumulates points', () => {
		const grid = fromColumns([[5, 7, 3]]);
		const { players } = computeStandings(grid, 1, NO_ELIM);
		expect(players[0].total).toBe(15);
	});

	it('wins on reaching exactly 50', () => {
		const grid = fromColumns([[12, 12, 12, 12, 2]]);
		const s = computeStandings(grid, 1, NO_ELIM);
		expect(s.players[0].total).toBe(50);
		expect(s.players[0].hasWon).toBe(true);
		expect(s.winnerIndex).toBe(0);
		expect(s.status).toBe('finished');
	});

	it('resets to 25 when overshooting 50', () => {
		const grid = fromColumns([[12, 12, 12, 12, 5]]); // 48 + 5 = 53 -> 25
		const s = computeStandings(grid, 1, NO_ELIM);
		expect(s.players[0].total).toBe(25);
		expect(s.players[0].hasWon).toBe(false);
	});

	it('ignores throws entered after a win', () => {
		const grid = fromColumns([[12, 12, 12, 12, 2, 7]]); // wins at 5th throw
		const s = computeStandings(grid, 1, NO_ELIM);
		expect(s.players[0].total).toBe(50);
	});
});

describe('computeStandings — elimination', () => {
	it('eliminates after three consecutive misses when rule is on', () => {
		const grid = fromColumns([[0, 0, 0]]);
		const s = computeStandings(grid, 1, WITH_ELIM);
		expect(s.players[0].eliminated).toBe(true);
		expect(s.players[0].consecutiveMisses).toBe(3);
	});

	it('does not eliminate when the rule is off', () => {
		const grid = fromColumns([[0, 0, 0, 0]]);
		const s = computeStandings(grid, 1, NO_ELIM);
		expect(s.players[0].eliminated).toBe(false);
	});

	it('resets the miss streak after a scoring throw', () => {
		const grid = fromColumns([[0, 0, 5, 0]]);
		const s = computeStandings(grid, 1, WITH_ELIM);
		expect(s.players[0].eliminated).toBe(false);
		expect(s.players[0].consecutiveMisses).toBe(1);
		expect(s.players[0].total).toBe(5);
	});
});

describe('computeStandings — winner selection', () => {
	it('picks the player who overshot as loser', () => {
		const grid = fromColumns([
			[12, 12, 12, 12, 2], // p0 -> 50, wins
			[12, 12, 12, 12, 3] // p1 -> 51 -> 25
		]);
		const s = computeStandings(grid, 2, NO_ELIM);
		expect(s.winnerIndex).toBe(0);
	});

	it('breaks a same-round tie by play order (lower index throws first)', () => {
		const grid = fromColumns([
			[10, 10, 10, 10, 10],
			[10, 10, 10, 10, 10]
		]);
		const s = computeStandings(grid, 2, NO_ELIM);
		expect(s.winnerIndex).toBe(0);
	});
});

describe('computeStandings — editing re-derives downstream', () => {
	it('changing an earlier cell changes the running total', () => {
		const grid = fromColumns([[10, 10, 10]]);
		expect(computeStandings(grid, 1, NO_ELIM).players[0].total).toBe(30);
		grid[0][0] = 2; // edit the first throw
		expect(computeStandings(grid, 1, NO_ELIM).players[0].total).toBe(22);
	});
});

describe('nextActiveCell', () => {
	it('starts at the first cell of an empty game', () => {
		expect(nextActiveCell([], computeStandings([], 2, NO_ELIM), 2)).toEqual({
			round: 0,
			playerIndex: 0
		});
	});

	it('advances to the next player within a round', () => {
		const grid: RoundGrid = [[5, null]];
		const s = computeStandings(grid, 2, NO_ELIM);
		expect(nextActiveCell(grid, s, 2)).toEqual({ round: 0, playerIndex: 1 });
	});

	it('wraps to a new round when the current one is full', () => {
		const grid: RoundGrid = [[5, 5]];
		const s = computeStandings(grid, 2, NO_ELIM);
		expect(nextActiveCell(grid, s, 2)).toEqual({ round: 1, playerIndex: 0 });
	});

	it('skips eliminated players', () => {
		const grid = fromColumns([
			[0, 0, 0], // p0 eliminated
			[5, 5, 5]
		]);
		const s = computeStandings(grid, 2, WITH_ELIM);
		expect(s.players[0].eliminated).toBe(true);
		expect(nextActiveCell(grid, s, 2)).toEqual({ round: 3, playerIndex: 1 });
	});

	it('returns null when the game is finished', () => {
		const grid = fromColumns([[12, 12, 12, 12, 2]]);
		const s = computeStandings(grid, 1, NO_ELIM);
		expect(nextActiveCell(grid, s, 1)).toBeNull();
	});
});
