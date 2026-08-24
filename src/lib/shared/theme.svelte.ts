import { browser } from '$app/env';

export type Mode = 'light' | 'dark';

const STORAGE_KEY = 'mode';

/**
 * The pre-paint script in `app.html` has already resolved stored preference vs.
 * system preference and stamped it on `<html>`, so read it back from there —
 * that keeps this store and the painted page from ever disagreeing.
 */
function readInitialMode(): Mode {
	if (!browser) return 'light';
	return document.documentElement.dataset.mode === 'dark' ? 'dark' : 'light';
}

class Theme {
	mode = $state<Mode>(readInitialMode());

	set(mode: Mode) {
		this.mode = mode;
		if (!browser) return;
		document.documentElement.dataset.mode = mode;
		try {
			localStorage.setItem(STORAGE_KEY, mode);
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
