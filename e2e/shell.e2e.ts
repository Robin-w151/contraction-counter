import { expect, test } from '@playwright/test';

const control = '[data-scope="switch"][data-part="control"]';

test('header stays visible while scrolling', async ({ page }) => {
	await page.goto('/');
	const header = page.getByRole('banner');
	await expect(header).toBeVisible();

	await page.setViewportSize({ width: 375, height: 400 });
	await page.mouse.wheel(0, 2000);
	await expect(header).toBeInViewport();
});

test('theme switch toggles and persists the mode', async ({ page }) => {
	await page.goto('/');
	const html = page.locator('html');
	const initial = await html.getAttribute('data-mode');
	const toggled = initial === 'dark' ? 'light' : 'dark';

	await page.locator(control).click();
	await expect(html).toHaveAttribute('data-mode', toggled);
	await expect(page.getByRole('switch', { name: 'Dark mode' })).toBeChecked({
		checked: toggled === 'dark'
	});

	await page.reload();
	await expect(html).toHaveAttribute('data-mode', toggled);
});

test('theme switch is keyboard operable', async ({ page }) => {
	await page.goto('/');
	const html = page.locator('html');
	const initial = await html.getAttribute('data-mode');

	await page.getByRole('switch', { name: 'Dark mode' }).focus();
	await page.keyboard.press('Space');

	await expect(html).toHaveAttribute('data-mode', initial === 'dark' ? 'light' : 'dark');
});

// The pre-paint script in `app.html` resolves theme and locale independently so
// that one failing cannot leave the other unset. These cover the branches the
// happy-path tests never reach.
test.describe('pre-paint fallbacks', () => {
	test.use({ locale: 'de-DE' });

	test('storage failure still resolves both mode and locale', async ({ page }) => {
		await page.addInitScript(() => {
			// Simulate Safari private mode: every read throws.
			Object.defineProperty(Storage.prototype, 'getItem', {
				value: () => {
					throw new Error('storage unavailable');
				}
			});
		});
		await page.goto('/');

		const html = page.locator('html');
		await expect(html).toHaveAttribute('data-mode', /light|dark/);
		// The mode failure must not have skipped locale resolution.
		await expect(html).toHaveAttribute('lang', 'de');
	});

	test('missing navigator.language still yields the base locale', async ({ page }) => {
		await page.addInitScript(() => {
			Object.defineProperty(navigator, 'language', { value: undefined });
		});
		await page.goto('/');

		const html = page.locator('html');
		await expect(html).toHaveAttribute('lang', 'en');
		// ...and the locale failure must not have skipped the theme.
		await expect(html).toHaveAttribute('data-mode', /light|dark/);
	});
});
