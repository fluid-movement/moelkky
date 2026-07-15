import type { ActiveGame, GameRecord, Player } from '$lib/game/types';

/**
 * Persistence seam. The rest of the app talks to these interfaces only, never to a
 * concrete store. Today they're backed by IndexedDB ({@link ./indexeddb}); later a
 * server-backed implementation (Drizzle + auth) can be dropped in without touching
 * game logic or UI — only the wiring in {@link ./index} changes.
 */

export interface PlayerRepository {
	list(): Promise<Player[]>;
	create(name: string): Promise<Player>;
	rename(id: string, name: string): Promise<void>;
	remove(id: string): Promise<void>;
}

export interface GameRepository {
	/** All completed games, used to derive stats. */
	listCompleted(): Promise<GameRecord[]>;
	saveCompleted(record: GameRecord): Promise<void>;
	/** Delete every completed game, resetting all derived stats. */
	clearCompleted(): Promise<void>;
	/** Persist the in-progress game so a refresh can resume it. */
	saveActive(game: ActiveGame): Promise<void>;
	loadActive(): Promise<ActiveGame | null>;
	clearActive(): Promise<void>;
}
