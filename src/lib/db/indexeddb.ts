import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { ActiveGame, GameRecord, Player } from '$lib/game/types';
import type { GameRepository, PlayerRepository } from './repository';

interface MolkkySchema extends DBSchema {
	players: { key: string; value: Player };
	games: { key: string; value: GameRecord };
	meta: { key: string; value: ActiveGame };
}

const DB_NAME = 'molkky';
const DB_VERSION = 1;
const ACTIVE_KEY = 'active-game';

let dbPromise: Promise<IDBPDatabase<MolkkySchema>> | null = null;

function getDB(): Promise<IDBPDatabase<MolkkySchema>> {
	if (!dbPromise) {
		dbPromise = openDB<MolkkySchema>(DB_NAME, DB_VERSION, {
			upgrade(db) {
				if (!db.objectStoreNames.contains('players')) {
					db.createObjectStore('players', { keyPath: 'id' });
				}
				if (!db.objectStoreNames.contains('games')) {
					db.createObjectStore('games', { keyPath: 'id' });
				}
				if (!db.objectStoreNames.contains('meta')) {
					db.createObjectStore('meta');
				}
			}
		});
	}
	return dbPromise;
}

function uuid(): string {
	return crypto.randomUUID();
}

export const indexedDbPlayers: PlayerRepository = {
	async list() {
		const db = await getDB();
		const players = await db.getAll('players');
		return players.sort((a, b) => a.name.localeCompare(b.name));
	},
	async create(name) {
		const db = await getDB();
		const player: Player = { id: uuid(), name: name.trim(), createdAt: Date.now() };
		await db.put('players', player);
		return player;
	},
	async rename(id, name) {
		const db = await getDB();
		const existing = await db.get('players', id);
		if (!existing) return;
		await db.put('players', { ...existing, name: name.trim() });
	},
	async remove(id) {
		const db = await getDB();
		await db.delete('players', id);
	}
};

export const indexedDbGames: GameRepository = {
	async listCompleted() {
		const db = await getDB();
		const games = await db.getAll('games');
		return games.sort((a, b) => b.playedAt - a.playedAt);
	},
	async saveCompleted(record) {
		const db = await getDB();
		await db.put('games', record);
	},
	async saveActive(game) {
		const db = await getDB();
		await db.put('meta', game, ACTIVE_KEY);
	},
	async loadActive() {
		const db = await getDB();
		return (await db.get('meta', ACTIVE_KEY)) ?? null;
	},
	async clearActive() {
		const db = await getDB();
		await db.delete('meta', ACTIVE_KEY);
	}
};
