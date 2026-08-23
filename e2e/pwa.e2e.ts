import { expect, test } from '@playwright/test';

test('serves a valid web app manifest', async ({ request }) => {
	const response = await request.get('/manifest.webmanifest');
	expect(response.ok()).toBe(true);

	const manifest = await response.json();
	expect(manifest).toMatchObject({
		name: 'Contraction Counter',
		start_url: '/',
		scope: '/',
		display: 'standalone'
	});
});

test('links the manifest from the document', async ({ page }) => {
	await page.goto('/');
	await expect(page.locator('link[rel="manifest"]')).toHaveAttribute(
		'href',
		'/manifest.webmanifest'
	);
	await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#282a36');
});

test('registers a service worker and works offline', async ({ page, context }) => {
	await page.goto('/');
	await page.waitForFunction(() => navigator.serviceWorker.controller !== null);

	await context.setOffline(true);
	await page.reload();
	await expect(page.getByRole('banner')).toBeVisible();

	await context.setOffline(false);
});
