import { fromOffsetString } from '#lib/shared/datetime.js';
import type { Locale as DateFnsLocale } from 'date-fns';
import { differenceInMilliseconds, formatDuration, intervalToDuration, subHours } from 'date-fns';
import type { Contraction, Rule511 } from '../types.js';

const MIN_DURATION_MS = 60_000; // the first "1" of 5-1-1: a minute long
const MAX_INTERVAL_MS = 5 * 60_000; // the "5": five minutes apart
const PATTERN_HOURS = 1; // the second "1": sustained for an hour
// Individual gaps vary either side of the five-minute target, so the run only
// counts as broken well past it — anything before such a gap is an earlier
// session and must not be mixed into this one's averages.
const MAX_RUN_GAP_MS = 15 * 60_000;

export function durationOf(contraction: Contraction): number {
	return differenceInMilliseconds(instant(contraction.end), instant(contraction.start));
}

export function intervalOf(previous: Contraction, contraction: Contraction): number {
	return differenceInMilliseconds(instant(contraction.start), instant(previous.start));
}

export function elapsedSince(start: string, now: Date): number {
	return Math.max(0, differenceInMilliseconds(now, instant(start)));
}

export function recentWindow(
	records: Contraction[],
	now: Date,
	hours = PATTERN_HOURS
): Contraction[] {
	const cutoff = subHours(now, hours);
	return records.filter((record) => instant(record.start) >= cutoff);
}

export function currentRun(records: Contraction[]): Contraction[] {
	let first = Math.max(0, records.length - 1);
	while (first > 0 && intervalOf(records[first - 1], records[first]) <= MAX_RUN_GAP_MS) {
		first -= 1;
	}
	return records.slice(first);
}

export function evaluate511(records: Contraction[], now: Date): Rule511 {
	const run = currentRun(records);
	const window = recentWindow(run, now);

	const intervals = window.slice(1).map((record, index) => intervalOf(window[index], record));

	const averageDuration = mean(window.map(durationOf));
	const averageInterval = mean(intervals);

	const durationOk = averageDuration !== null && averageDuration >= MIN_DURATION_MS;
	const intervalOk = averageInterval !== null && averageInterval <= MAX_INTERVAL_MS;

	const first = run[0];
	const hourOk = first !== undefined && instant(first.start) <= subHours(now, PATTERN_HOURS);

	return { durationOk, intervalOk, hourOk, met: durationOk && intervalOk && hourOk };
}

export function formatClock(ms: number): string {
	const totalSeconds = Math.max(0, Math.floor(ms / 1000));
	const seconds = totalSeconds % 60;
	const minutes = Math.floor(totalSeconds / 60) % 60;
	const hours = Math.floor(totalSeconds / 3600);
	const pad = (value: number) => String(value).padStart(2, '0');
	return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${minutes}:${pad(seconds)}`;
}

export function formatSpoken(ms: number, locale: DateFnsLocale): string {
	const duration = intervalToDuration({ start: 0, end: Math.max(0, ms) });
	const spoken = formatDuration(duration, { locale, format: ['hours', 'minutes', 'seconds'] });
	return spoken || formatDuration({ seconds: 0 }, { locale, zero: true, format: ['seconds'] });
}

function instant(value: string): Date {
	const parsed = fromOffsetString(value);
	if (parsed) {
		return parsed;
	} else {
		throw new Error(`Not a valid offset datetime: ${value}`);
	}
}

function mean(values: number[]): number | null {
	if (values.length === 0) {
		return null;
	} else {
		return values.reduce((total, value) => total + value, 0) / values.length;
	}
}
