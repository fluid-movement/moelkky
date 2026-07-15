import type { GameRecord, HeadToHead, PlayerStats } from './types';

function rate(wins: number, games: number): number {
	return games === 0 ? 0 : wins / games;
}

/**
 * Derive a single player's stats from the full game history. Everything is computed
 * on the fly from {@link GameRecord}s, so stored aggregates can never drift.
 */
export function computePlayerStats(games: GameRecord[], playerId: string): PlayerStats {
	let gamesPlayed = 0;
	let wins = 0;
	const headToHead: Record<string, HeadToHead> = {};

	for (const game of games) {
		if (!game.playerIds.includes(playerId)) continue;
		gamesPlayed++;
		const won = game.winnerId === playerId;
		if (won) wins++;

		for (const opponentId of game.playerIds) {
			if (opponentId === playerId) continue;
			const h = (headToHead[opponentId] ??= {
				opponentId,
				games: 0,
				wins: 0,
				winRate: 0
			});
			h.games++;
			if (won) h.wins++;
			h.winRate = rate(h.wins, h.games);
		}
	}

	return {
		playerId,
		gamesPlayed,
		wins,
		winRate: rate(wins, gamesPlayed),
		headToHead
	};
}

/** Derive stats for every given player from the game history. */
export function computeAllStats(games: GameRecord[], playerIds: string[]): PlayerStats[] {
	return playerIds.map((id) => computePlayerStats(games, id));
}
