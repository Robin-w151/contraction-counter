import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { STORAGE_KEY, clear, load, save } from './storage.js';
import type { Contraction } from '../types.js';

const NOW = new Date('2026-08-24T12:00:00.000Z');

/** A minimal in-memory localStorage; the node test environment has none. */
function stubStorage(initial: string | null = null) {
	let value = initial;
	const storage = {
		getItem: vi.fn(() => value),
		setItem: vi.fn((_key: string, next: string) => {
			value = next;
		}),
		removeItem: vi.fn(() => {
			value = null;
		})
	};
	vi.stubGlobal('localStorage', storage);
	return storage;
}

const record = (startIso: string, endIso: string): Contraction => ({
	start: startIso,
	end: endIso
});

const VALID = record('2026-08-24T13:00:00.000+02:00', '2026-08-24T13:01:10.000+02:00');

beforeEach(() => {
	stubStorage();
});

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('load', () => {
	it('returns empty state when nothing is stored', () => {
		expect(load(NOW)).toEqual({ records: [], running: null });
	});

	it('returns empty state when storage throws', () => {
		vi.stubGlobal('localStorage', {
			getItem: vi.fn(() => {
				throw new Error('SecurityError');
			})
		});
		expect(load(NOW)).toEqual({ records: [], running: null });
	});

	it('returns empty state for malformed JSON', () => {
		stubStorage('{not json');
		expect(load(NOW)).toEqual({ records: [], running: null });
	});

	it('round-trips saved state', () => {
		save({ records: [VALID], running: null });
		expect(load(NOW)).toEqual({ records: [VALID], running: null });
	});

	it('sorts records by start', () => {
		const later = record('2026-08-24T13:10:00.000+02:00', '2026-08-24T13:11:00.000+02:00');
		save({ records: [later, VALID], running: null });
		expect(load(NOW).records).toEqual([VALID, later]);
	});

	it('drops records with unparseable timestamps', () => {
		stubStorage(JSON.stringify({ v: 1, records: [record('nope', 'also nope'), VALID] }));
		expect(load(NOW).records).toEqual([VALID]);
	});

	it('drops records whose timestamps are not strings', () => {
		stubStorage(JSON.stringify({ v: 1, records: [{ start: 1, end: 2 }, VALID] }));
		expect(load(NOW).records).toEqual([VALID]);
	});

	it('drops records that end before they start', () => {
		const reversed = record('2026-08-24T13:05:00.000+02:00', '2026-08-24T13:00:00.000+02:00');
		stubStorage(JSON.stringify({ v: 1, records: [reversed] }));
		expect(load(NOW).records).toEqual([]);
	});

	it('resumes a recent running contraction', () => {
		const running = '2026-08-24T13:59:00.000+02:00'; // one minute before NOW
		save({ records: [], running });
		expect(load(NOW).running).toBe(running);
	});

	it('discards a running contraction dated in the future', () => {
		save({ records: [], running: '2026-08-24T15:00:00.000+02:00' });
		expect(load(NOW).running).toBeNull();
	});

	it('discards a running contraction older than thirty minutes', () => {
		save({ records: [], running: '2026-08-24T13:20:00.000+02:00' }); // 40 minutes before NOW
		expect(load(NOW).running).toBeNull();
	});
});

describe('save', () => {
	it('swallows storage failures', () => {
		vi.stubGlobal('localStorage', {
			setItem: vi.fn(() => {
				throw new Error('QuotaExceededError');
			})
		});
		expect(() => save({ records: [VALID], running: null })).not.toThrow();
	});
});

describe('clear', () => {
	it('removes the stored key', () => {
		const storage = stubStorage();
		save({ records: [VALID], running: null });
		clear();
		expect(storage.removeItem).toHaveBeenCalledWith(STORAGE_KEY);
	});
});
