import type { GameRepository, PlayerRepository } from './repository';
import { indexedDbGames, indexedDbPlayers } from './indexeddb';

/**
 * The single place the persistence implementation is wired up. Swap these bindings
 * (e.g. to a server-backed repository) to change how the whole app persists data —
 * nothing else imports the concrete IndexedDB module.
 */
export const players: PlayerRepository = indexedDbPlayers;
export const games: GameRepository = indexedDbGames;

export type { GameRepository, PlayerRepository } from './repository';
