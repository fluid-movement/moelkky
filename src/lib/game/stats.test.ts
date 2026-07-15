import { describe, expect, it } from 'vitest';
import { computePlayerStats } from './stats';
import type { GameRecord } from './types';

const settings = { eliminationRule: true };

const games: GameRecord[] = [
	{
		id: 'g1',
		playedAt: 1,
		settings,
		playerIds: ['a', 'b', 'c'],
		winnerId: 'a',
		finalScores: { a: 50, b: 30, c: 12 }
	},
	{
		id: 'g2',
		playedAt: 2,
		settings,
		playerIds: ['a', 'b'],
		winnerId: 'b',
		finalScores: { a: 44, b: 50 }
	}
];

describe('computePlayerStats', () => {
	it('computes games played, wins and win rate', () => {
		const a = computePlayerStats(games, 'a');
		expect(a.gamesPlayed).toBe(2);
		expect(a.wins).toBe(1);
		expect(a.winRate).toBe(0.5);
	});

	it('computes head-to-head records per opponent', () => {
		const a = computePlayerStats(games, 'a');
		// vs b: both games, a won g1, lost g2
		expect(a.headToHead['b']).toMatchObject({ games: 2, wins: 1, winRate: 0.5 });
		// vs c: only g1, which a won
		expect(a.headToHead['c']).toMatchObject({ games: 1, wins: 1, winRate: 1 });
	});

	it('handles a player who never won', () => {
		const c = computePlayerStats(games, 'c');
		expect(c.gamesPlayed).toBe(1);
		expect(c.wins).toBe(0);
		expect(c.winRate).toBe(0);
		expect(c.headToHead['a']).toMatchObject({ games: 1, wins: 0, winRate: 0 });
	});

	it('returns zeroed stats for a player with no games', () => {
		const x = computePlayerStats(games, 'unknown');
		expect(x).toMatchObject({ gamesPlayed: 0, wins: 0, winRate: 0, headToHead: {} });
	});
});
