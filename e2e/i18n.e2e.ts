import { expect, test, type Page } from '@playwright/test';

const de = 'Wehen-Zähler';
const en = 'Contraction Counter';

// The radio input itself is visually clipped to 1px — what a user actually
// clicks is the wrapping label, so drive the switcher through that.
const option = (page: Page, name: string) =>
	page.locator('[data-scope="radio-group"][data-part="item"]').filter({ hasText: name });

const title = (page: Page, text: string) => page.getByRole('banner').getByText(text);

// Hydration finishes in tens of milliseconds locally, which is too narrow to
// assert against reliably. Stall the client bundle so the loading state is a
// window the test can actually observe rather than a race it usually wins.
const stallHydration = (page: Page, ms: number) =>
	page.route('**/_app/immutable/entry/*.js', async (route) => {
		await new Promise((resolve) => setTimeout(resolve, ms));
		await route.continue();
	});

// Asserts the launch sequence everyone shares: loading screen up with the app
// content held back, then content shown and the loader gone.
const expectLoadingThenContent = async (page: Page, text: string) => {
	await expect(page.locator('#app-loading')).toBeVisible();
	await expect(page.locator('[data-app-root]')).toBeHidden();

	await expect(title(page, text)).toBeVisible();
	await expect(page.locator('#app-loading')).toBeHidden();
};

test('defaults to English for an English browser', async ({ page }) => {
	await page.goto('/');
	await expect(title(page, en)).toBeVisible();
	await expect(page.locator('html')).toHaveAttribute('lang', 'en');
	await expect(page.getByRole('radio', { name: 'English' })).toBeChecked();
});

test('English goes through the same loading screen as German', async ({ page }) => {
	await stallHydration(page, 600);
	await page.goto('/', { waitUntil: 'commit' });

	// The uniform launch is the whole point of the loading screen.
	await expectLoadingThenContent(page, en);
});

test('switching to German translates the UI and persists', async ({ page }) => {
	await page.goto('/');
	// setLocale() reloads the document; the assertions below wait it out.
	await option(page, 'Deutsch').click();

	await expect(title(page, de)).toBeVisible();
	await expect(page.locator('html')).toHaveAttribute('lang', 'de');
	await expect(page.getByRole('radio', { name: 'Deutsch' })).toBeChecked();

	await page.reload();
	await expect(title(page, de)).toBeVisible();
	await expect(page.locator('html')).toHaveAttribute('lang', 'de');
});

test('switching back to English restores the base locale', async ({ page }) => {
	await page.goto('/');
	await option(page, 'Deutsch').click();
	await expect(page.locator('html')).toHaveAttribute('lang', 'de');

	await option(page, 'English').click();
	await expect(title(page, en)).toBeVisible();
	await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});

type Frame = { text: string; visible: boolean; loading: boolean };

// Samples the header every frame from first paint, recording whether the app
// content and the loading screen were actually on screen at the time.
const sampleFrames = (page: Page) =>
	page.addInitScript(() => {
		const samples: Frame[] = [];
		(window as unknown as { __samples: Frame[] }).__samples = samples;
		const tick = () => {
			const root = document.querySelector('[data-app-root]');
			const loader = document.querySelector('#app-loading');
			samples.push({
				text: document.querySelector('header')?.textContent ?? '',
				visible: !!root && getComputedStyle(root).visibility === 'visible',
				loading: !!loader && getComputedStyle(loader).visibility === 'visible'
			});
			if (performance.now() < 3000) requestAnimationFrame(tick);
		};
		requestAnimationFrame(tick);
	});

const readFrames = (page: Page) =>
	page.evaluate(() => (window as unknown as { __samples: Frame[] }).__samples);

test.describe('German browser', () => {
	test.use({ locale: 'de-DE' });

	test('never paints the prerendered English before hydrating to German', async ({ page }) => {
		// Sampling every frame proves the absence of an English paint; the stall
		// guarantees there are frames spanning the loading window to sample.
		await sampleFrames(page);
		await stallHydration(page, 600);
		await page.goto('/', { waitUntil: 'commit' });

		await expectLoadingThenContent(page, de);

		const frames = await readFrames(page);
		// The prerendered base locale sits in the DOM the whole time — it just must
		// never have been on screen.
		expect(frames.filter((f) => f.visible && f.text.includes(en))).toEqual([]);
		expect(frames.some((f) => f.loading && !f.visible)).toBe(true);
		expect(frames.some((f) => f.visible && f.text.includes(de))).toBe(true);
	});

	test('reveals the content even if hydration never runs', async ({ page }) => {
		// Kill the client bundle so hydration cannot clear the pre-paint flag; the
		// inline failsafe timer must still un-hide the page.
		await page.route('**/_app/immutable/entry/*.js', (route) => route.abort());
		await sampleFrames(page);
		await page.goto('/');

		await expect(page.locator('[data-app-root]')).toBeVisible({ timeout: 6000 });
		await expect(page.locator('html')).not.toHaveAttribute('aria-busy', 'true');
	});

	test('auto-detects German with no stored preference', async ({ page }) => {
		await page.goto('/');
		await expect(title(page, de)).toBeVisible();
		await expect(page.locator('html')).toHaveAttribute('lang', 'de');
	});

	test('translates the theme switch label', async ({ page }) => {
		await page.goto('/');
		await expect(page.getByRole('switch', { name: 'Dunkelmodus' })).toBeVisible();
	});
});

test('locale switch still works offline from the cached shell', async ({ page, context }) => {
	await page.goto('/');
	await page.waitForFunction(() => navigator.serviceWorker.controller !== null);

	await context.setOffline(true);
	await page.reload();

	// setLocale() navigates, so this only holds if the service worker serves the
	// shell — the reason a reloading switch is safe in an offline-first PWA.
	await option(page, 'Deutsch').click();
	await expect(title(page, de)).toBeVisible();
	await expect(page.locator('html')).toHaveAttribute('lang', 'de');

	await context.setOffline(false);
});
