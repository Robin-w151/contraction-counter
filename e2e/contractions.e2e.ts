import { expect, test, type Page } from '@playwright/test';

const STORAGE_KEY = 'contractions';

const readout = (page: Page) => page.getByTestId('readout');
const lastDuration = (page: Page) => page.getByTestId('last-duration');
const lastInterval = (page: Page) => page.getByTestId('last-interval');
const startButton = (page: Page) => page.getByRole('button', { name: 'Start contraction' });
const stopButton = (page: Page) => page.getByRole('button', { name: 'Stop contraction' });

/**
 * Elapsed-time assertions against the wall clock would mean sleeping for real
 * minutes, so every test drives a fake clock instead. It has to be installed
 * before navigation so the app's own `new Date()` calls see it too.
 */
const startClock = async (page: Page, at = new Date('2026-08-24T10:00:00.000Z')) => {
	await page.clock.install({ time: at });
};

/** Seeds localStorage before the app boots, to test states that take an hour to reach live. */
const seed = (page: Page, records: { start: string; end: string }[]) =>
	page.addInitScript(([key, value]) => window.localStorage.setItem(key, value), [
		STORAGE_KEY,
		JSON.stringify({ v: 1, records, running: null })
	] as const);

test('times a contraction from start to stop', async ({ page }) => {
	await startClock(page);
	await page.goto('.');

	await expect(readout(page)).toHaveText('–:––');
	await startButton(page).click();

	await page.clock.runFor(90_000);
	await expect(readout(page)).toHaveText('1:30');

	await stopButton(page).click();
	await expect(lastDuration(page)).toHaveText('1:30');
	await expect(startButton(page)).toBeVisible();
});

test('resumes a contraction that was running when the page reloaded', async ({ page }) => {
	await startClock(page);
	await page.goto('.');

	await startButton(page).click();
	await page.clock.runFor(30_000);
	await expect(readout(page)).toHaveText('0:30');

	await page.reload();

	// Still running, and counting from the original start rather than from zero.
	await expect(stopButton(page)).toBeVisible();
	await expect(readout(page)).toHaveText('0:30');

	await page.clock.runFor(10_000);
	await expect(readout(page)).toHaveText('0:40');
});

test('persists completed contractions and their interval across a reload', async ({ page }) => {
	await startClock(page);
	await page.goto('.');

	await startButton(page).click();
	await page.clock.runFor(60_000);
	await stopButton(page).click();

	// Four minutes after the first one started.
	await page.clock.runFor(180_000);
	await startButton(page).click();
	await page.clock.runFor(70_000);
	await stopButton(page).click();

	await expect(lastDuration(page)).toHaveText('1:10');
	await expect(lastInterval(page)).toHaveText('4:00');

	await page.reload();
	await expect(lastDuration(page)).toHaveText('1:10');
	await expect(lastInterval(page)).toHaveText('4:00');
});

test('clear all wipes the log and it stays wiped', async ({ page }) => {
	await startClock(page);
	await page.goto('.');

	await startButton(page).click();
	await page.clock.runFor(45_000);
	await stopButton(page).click();
	await expect(lastDuration(page)).toHaveText('0:45');

	const clear = page.getByRole('button', { name: 'Clear all' });
	await clear.click();
	// First tap only arms it — the log must still be there.
	await expect(lastDuration(page)).toHaveText('0:45');

	await page.getByRole('button', { name: 'Tap again to erase everything' }).click();
	await expect(readout(page)).toHaveText('–:––');
	await expect(lastDuration(page)).toHaveText('–:––');

	await page.reload();
	await expect(readout(page)).toHaveText('–:––');
	await expect(clear).toBeHidden();
});

test.describe('5-1-1 indicator', () => {
	/** 70s long, 4 minutes apart, spanning well over an hour — all three criteria. */
	const qualifying = Array.from({ length: 18 }, (_, index) => {
		const start = new Date(Date.UTC(2026, 7, 24, 9, index * 4));
		return {
			start: start.toISOString(),
			end: new Date(start.getTime() + 70_000).toISOString()
		};
	});

	test('stays unmet for a short log', async ({ page }) => {
		await startClock(page);
		await seed(page, qualifying.slice(-2));
		await page.goto('.');

		await expect(page.getByTestId('rule511-verdict')).toHaveText('Not there yet. Keep timing.');
	});

	test('flips to met once the pattern has held for an hour', async ({ page }) => {
		await startClock(page, new Date('2026-08-24T10:15:00.000Z'));
		await seed(page, qualifying);
		await page.goto('.');

		await expect(page.getByTestId('rule511-verdict')).toContainText('All three are met');
	});
});

test('the timer is translated', async ({ page }) => {
	await startClock(page);
	await page.goto('.');

	await page
		.locator('[data-scope="radio-group"][data-part="item"]')
		.filter({ hasText: 'DE' })
		.click();
	await expect(page.getByRole('button', { name: 'Wehe starten' })).toBeVisible();
});
