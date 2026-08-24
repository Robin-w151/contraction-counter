import { getLocale, locales, setLocale, type Locale } from '#lib/paraglide/runtime.js';

export { locales, type Locale };

const LABELS: Record<Locale, string> = {
	en: 'English',
	de: 'Deutsch'
};

class LocaleState {
	get current(): Locale {
		return getLocale();
	}

	label(locale: Locale) {
		return LABELS[locale];
	}

	set(locale: Locale) {
		if (locale === this.current) return;
		setLocale(locale);
	}
}

export const locale = new LocaleState();
