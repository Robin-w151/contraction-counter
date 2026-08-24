import { differenceInMinutes } from 'date-fns';
import { fromOffsetString } from '#lib/shared/datetime.js';
import type { Contraction, OffsetDateTime, PersistedState } from '../types.js';

export const STORAGE_KEY = 'contractions';

const MAX_RUNNING_MINUTES = 30;
const EMPTY: PersistedState = { records: [], running: null };

type StoredShape = {
	v: number;
	records: unknown;
	running: unknown;
};

export function load(now: Date): PersistedState {
	let raw: string | null;
	try {
		raw = localStorage.getItem(STORAGE_KEY);
	} catch {
		return EMPTY;
	}
	if (!raw) {
		return EMPTY;
	}

	let stored: Partial<StoredShape>;
	try {
		stored = JSON.parse(raw);
	} catch {
		return EMPTY;
	}
	if (typeof stored !== 'object' || stored === null) {
		return EMPTY;
	}

	return {
		records: parseRecords(stored.records),
		running: parseRunning(stored.running, now)
	};
}

export function save(state: PersistedState): void {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify({ v: 1, ...state }));
	} catch {
		// See `load` — persistence is best-effort, never a reason to break the timer.
	}
}

export function clear(): void {
	try {
		localStorage.removeItem(STORAGE_KEY);
	} catch {
		// See `load`.
	}
}

function isRecord(value: unknown): value is Contraction {
	if (typeof value !== 'object' || value === null) {
		return false;
	}

	const { start, end } = value as Partial<Contraction>;
	const startedAt = typeof start === 'string' ? fromOffsetString(start) : null;
	const endedAt = typeof end === 'string' ? fromOffsetString(end) : null;
	return startedAt !== null && endedAt !== null && endedAt >= startedAt;
}

function parseRecords(value: unknown): Contraction[] {
	if (!Array.isArray(value)) {
		return [];
	}

	return value
		.filter(isRecord)
		.sort((a, b) => fromOffsetString(a.start)!.getTime() - fromOffsetString(b.start)!.getTime());
}

function parseRunning(value: unknown, now: Date): OffsetDateTime | null {
	if (typeof value !== 'string') {
		return null;
	}

	const startedAt = fromOffsetString(value);
	if (!startedAt) {
		return null;
	} else if (startedAt > now) {
		return null;
	} else if (differenceInMinutes(now, startedAt) >= MAX_RUNNING_MINUTES) {
		return null;
	} else {
		return value;
	}
}
