/** A player in the persistent pool. */
export interface Player {
	id: string;
	name: string;
	createdAt: number;
}

/** Rules that vary per game. */
export interface GameSettings {
	/** When true, three consecutive misses (0-point throws) eliminate a player. */
	eliminationRule: boolean;
}

/**
 * The raw throw grid: `grid[round][playerIndex]` is the points a player scored on
 * that round, or `null` if they have not thrown yet. All standings are *derived*
 * from this grid, so editing any cell re-derives the whole game correctly.
 */
export type RoundGrid = (number | null)[][];

/** Per-player derived state for the current game. */
export interface PlayerStanding {
	playerIndex: number;
	/** Current running total after applying overshoot resets. */
	total: number;
	/** Number of consecutive misses ending at the last thrown round. */
	consecutiveMisses: number;
	/** True when the player has been eliminated (only possible with the rule on). */
	eliminated: boolean;
	/** True when the player has reached exactly {@link WIN_SCORE}. */
	hasWon: boolean;
}

export type GameStatus = 'active' | 'finished';

/** The fully derived state of a game at a point in time. */
export interface Standings {
	players: PlayerStanding[];
	/** Index of the winning player, or `null` while the game is still active. */
	winnerIndex: number | null;
	status: GameStatus;
}

/** The cell (round + player) that should be highlighted / filled next. */
export interface ActiveCell {
	round: number;
	playerIndex: number;
}

/** A snapshot of an in-progress game, persisted so a refresh can resume it. */
export interface ActiveGame {
	playerIds: string[];
	playerNames: string[];
	settings: GameSettings;
	grid: RoundGrid;
	startedAt: number;
}

/** A completed game, persisted for stats. Stats are always derived from these. */
export interface GameRecord {
	id: string;
	playedAt: number;
	settings: GameSettings;
	playerIds: string[];
	winnerId: string;
	/** Final total per player, keyed by player id. */
	finalScores: Record<string, number>;
}

/** Head-to-head record of a player against one specific opponent. */
export interface HeadToHead {
	opponentId: string;
	games: number;
	wins: number;
	winRate: number;
}

/** Aggregated, derived stats for a single player. */
export interface PlayerStats {
	playerId: string;
	gamesPlayed: number;
	wins: number;
	winRate: number;
	headToHead: Record<string, HeadToHead>;
}
