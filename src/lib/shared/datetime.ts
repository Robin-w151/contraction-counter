import { format, isValid, parseISO } from 'date-fns';
import { de, enUS } from 'date-fns/locale';
import type { Locale as DateFnsLocale } from 'date-fns';
import type { Locale } from '#lib/paraglide/runtime.js';

export type OffsetDateTime = string;

const FORMAT = "yyyy-MM-dd'T'HH:mm:ss.SSSxxx";
const DATE_FNS_LOCALES: Record<Locale, DateFnsLocale> = { en: enUS, de };

export function toOffsetString(date: Date): OffsetDateTime {
	return format(date, FORMAT);
}

export function fromOffsetString(value: OffsetDateTime): Date | null {
	if (typeof value !== 'string') return null;
	const parsed = parseISO(value);
	return isValid(parsed) ? parsed : null;
}

export function nowOffsetString(): OffsetDateTime {
	return toOffsetString(new Date());
}

export function dateFnsLocale(code: Locale): DateFnsLocale {
	return DATE_FNS_LOCALES[code];
}
