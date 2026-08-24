import { describe, expect, it } from 'vitest';
import { fromOffsetString, nowOffsetString, toOffsetString } from './datetime.js';

describe('toOffsetString', () => {
	it('always emits a numeric offset, never a bare Z', () => {
		expect(toOffsetString(new Date(0))).toMatch(/[+-]\d{2}:\d{2}$/);
	});

	it('keeps millisecond precision', () => {
		expect(toOffsetString(new Date('2026-08-24T12:03:12.123Z'))).toContain('.123');
	});
});

describe('fromOffsetString', () => {
	it('round-trips a date losslessly', () => {
		const date = new Date('2026-08-24T12:03:12.123Z');
		expect(fromOffsetString(toOffsetString(date))?.getTime()).toBe(date.getTime());
	});

	it('resolves the same instant regardless of the offset it was written in', () => {
		const plusTwo = fromOffsetString('2026-08-24T14:03:12.000+02:00');
		const plusOne = fromOffsetString('2026-08-24T13:03:12.000+01:00');
		expect(plusTwo?.getTime()).toBe(plusOne?.getTime());
	});

	it('returns null for unparseable input', () => {
		expect(fromOffsetString('not a date')).toBeNull();
	});

	it('returns null for a non-string', () => {
		expect(fromOffsetString(42 as unknown as string)).toBeNull();
	});
});

describe('nowOffsetString', () => {
	it('produces a value that parses back to roughly now', () => {
		const parsed = fromOffsetString(nowOffsetString());
		expect(Math.abs(Date.now() - (parsed?.getTime() ?? 0))).toBeLessThan(1000);
	});
});
