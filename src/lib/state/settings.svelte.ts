import { browser } from '$app/environment';
import type { GameSettings } from '$lib/game/types';

const STORAGE_KEY = 'molkky:settings';

const DEFAULTS: GameSettings = { eliminationRule: true };

function load(): GameSettings {
	if (!browser) return { ...DEFAULTS };
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };
	} catch {
		// ignore malformed storage
	}
	return { ...DEFAULTS };
}

/**
 * Reactive app settings, persisted to localStorage. App config is kept separate from
 * domain data (players/games in IndexedDB) and benefits from a synchronous read at
 * startup so the correct default is available immediately.
 */
class SettingsStore {
	#value = $state<GameSettings>(load());

	get eliminationRule(): boolean {
		return this.#value.eliminationRule;
	}

	set eliminationRule(on: boolean) {
		this.#value.eliminationRule = on;
		this.#persist();
	}

	/** A plain snapshot of the settings, e.g. to stamp onto a new game. */
	snapshot(): GameSettings {
		return { ...this.#value };
	}

	#persist() {
		if (browser) localStorage.setItem(STORAGE_KEY, JSON.stringify(this.#value));
	}
}

export const settings = new SettingsStore();
