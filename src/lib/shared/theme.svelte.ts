import { browser } from '$app/env';

export type Mode = 'light' | 'dark';

const STORAGE_KEY = 'mode';

function readInitialMode(): Mode {
	if (browser) {
		return document.documentElement.dataset.mode === 'dark' ? 'dark' : 'light';
	} else {
		return 'light';
	}
}

function storedMode(): Mode | null {
	try {
		const value = localStorage.getItem(STORAGE_KEY);
		return value === 'light' || value === 'dark' ? value : null;
	} catch {
		return null;
	}
}

function systemMode(): Mode | null {
	if (!browser) {
		return null;
	}

	try {
		return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
	} catch {
		return null;
	}
}

class Theme {
	mode = $state<Mode>(readInitialMode());

	constructor() {
		if (!browser) {
			return;
		}

		try {
			matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (event) => {
				if (storedMode() === null) {
					this.apply(event.matches ? 'dark' : 'light');
				}
			});
		} catch {
			// See `systemMode` — without `matchMedia` the mode simply stays put.
		}
	}

	set(mode: Mode) {
		this.apply(mode);
		if (!browser) {
			return;
		}

		try {
			if (mode === systemMode()) {
				localStorage.removeItem(STORAGE_KEY);
			} else {
				localStorage.setItem(STORAGE_KEY, mode);
			}
		} catch {
			// Storage unavailable (e.g. Safari private mode) — toggling still works
			// for this session, it just won't be remembered.
		}
	}

	toggle() {
		this.set(this.mode === 'dark' ? 'light' : 'dark');
	}

	private apply(mode: Mode) {
		this.mode = mode;
		if (browser) {
			document.documentElement.dataset.mode = mode;
		}
	}
}

export const theme = new Theme();
