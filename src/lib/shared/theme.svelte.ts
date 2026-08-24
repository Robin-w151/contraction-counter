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

	set(mode: Mode) {
		this.mode = mode;
		if (!browser) {
			return;
		}

		document.documentElement.dataset.mode = mode;
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
}

export const theme = new Theme();
