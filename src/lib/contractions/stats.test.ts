import { describe, expect, it } from 'vitest';
import { enUS } from 'date-fns/locale';
import {
	evaluate511,
	durationOf,
	formatClock,
	formatSpoken,
	intervalOf,
	recentWindow
} from './stats.js';
import type { Contraction } from './types.js';

const at = (minutes: number, seconds = 0) =>
	new Date(Date.UTC(2026, 7, 24, 10, minutes, seconds)).toISOString();

const contraction = (startMinutes: number, durationSeconds: number): Contraction => ({
	start: at(startMinutes),
	end: at(startMinutes, durationSeconds)
});

/** A run that satisfies all three criteria: 70s long, 4 min apart, spanning 70 min. */
function qualifyingRun(): { records: Contraction[]; now: Date } {
	const records = Array.from({ length: 18 }, (_, index) => contraction(index * 4, 70));
	return { records, now: new Date(Date.UTC(2026, 7, 24, 11, 15)) };
}

describe('durationOf', () => {
	it('measures start to end', () => {
		expect(durationOf(contraction(0, 45))).toBe(45_000);
	});
});

describe('intervalOf', () => {
	it('measures start to start, not end to start', () => {
		const previous = contraction(0, 60);
		const next = contraction(5, 60);
		expect(intervalOf(previous, next)).toBe(5 * 60_000);
	});

	it('is unaffected by the offset each record was written in', () => {
		const plusTwo: Contraction = {
			start: '2026-08-24T14:00:00.000+02:00',
			end: '2026-08-24T14:01:00.000+02:00'
		};
		const plusOne: Contraction = {
			start: '2026-08-24T13:05:00.000+01:00',
			end: '2026-08-24T13:06:00.000+01:00'
		};
		// 14:00+02:00 is 12:00 UTC; 13:05+01:00 is 12:05 UTC — five minutes apart.
		expect(intervalOf(plusTwo, plusOne)).toBe(5 * 60_000);
	});
});

describe('recentWindow', () => {
	it('keeps only records that started inside the window', () => {
		const records = [contraction(0, 60), contraction(90, 60)];
		const now = new Date(Date.UTC(2026, 7, 24, 11, 40));
		expect(recentWindow(records, now)).toEqual([records[1]]);
	});
});

describe('evaluate511', () => {
	it('reports met when all three criteria hold', () => {
		const { records, now } = qualifyingRun();
		expect(evaluate511(records, now)).toEqual({
			durationOk: true,
			intervalOk: true,
			hourOk: true,
			met: true
		});
	});

	it('fails only durationOk when contractions are too short', () => {
		const records = Array.from({ length: 18 }, (_, index) => contraction(index * 4, 30));
		const result = evaluate511(records, new Date(Date.UTC(2026, 7, 24, 11, 15)));
		expect(result).toMatchObject({ durationOk: false, intervalOk: true, hourOk: true, met: false });
	});

	it('fails only intervalOk when contractions are too far apart', () => {
		const records = Array.from({ length: 10 }, (_, index) => contraction(index * 8, 70));
		const result = evaluate511(records, new Date(Date.UTC(2026, 7, 24, 11, 20)));
		expect(result).toMatchObject({ durationOk: true, intervalOk: false, hourOk: true, met: false });
	});

	it('fails only hourOk when the pattern has not held long enough', () => {
		const records = Array.from({ length: 6 }, (_, index) => contraction(index * 4, 70));
		const result = evaluate511(records, new Date(Date.UTC(2026, 7, 24, 10, 25)));
		expect(result).toMatchObject({ durationOk: true, intervalOk: true, hourOk: false, met: false });
	});

	it('reports nothing met for an empty log', () => {
		expect(evaluate511([], new Date())).toEqual({
			durationOk: false,
			intervalOk: false,
			hourOk: false,
			met: false
		});
	});
});

describe('formatClock', () => {
	it('renders zero', () => {
		expect(formatClock(0)).toBe('0:00');
	});

	it('renders sub-minute spans', () => {
		expect(formatClock(59_000)).toBe('0:59');
	});

	it('rolls over to minutes', () => {
		expect(formatClock(60_000)).toBe('1:00');
	});

	it('adds an hours segment past an hour', () => {
		expect(formatClock(3_661_000)).toBe('1:01:01');
	});

	it('clamps negatives to zero', () => {
		expect(formatClock(-5000)).toBe('0:00');
	});
});

describe('formatSpoken', () => {
	it('renders prose for a screen reader', () => {
		expect(formatSpoken(90_000, enUS)).toBe('1 minute 30 seconds');
	});

	it('still says something for a zero span', () => {
		expect(formatSpoken(0, enUS)).toBe('0 seconds');
	});
});
