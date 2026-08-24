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

test('declares an icon set covering every install surface', async ({ request }) => {
	const manifest = await (await request.get('/manifest.webmanifest')).json();
	const icons: { src: string; type: string; purpose: string }[] = manifest.icons;

	expect(icons.length).toBeGreaterThan(0);
	// Without a maskable entry Android crops the square icon itself, which
	// clips the ring. This is the assertion that catches a regenerated set
	// that quietly dropped it.
	expect(icons.some((icon) => icon.purpose === 'maskable')).toBe(true);

	for (const icon of icons) {
		const response = await request.get(icon.src);
		expect(response.ok(), `${icon.src} should be served`).toBe(true);
		expect(response.headers()['content-type'], `${icon.src} content type`).toContain(icon.type);
	}
});

test('links the favicon and the iOS home screen icon', async ({ page, request }) => {
	await page.goto('/');

	// These hrefs read back resolved to absolute URLs, so match the tail rather
	// than the literal path the source writes.
	await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', /\/icon\.svg$/);
	await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute(
		'href',
		/\/apple-touch-icon\.png$/
	);

	for (const href of ['/icon.svg', '/apple-touch-icon.png']) {
		expect((await request.get(href)).ok(), `${href} should be served`).toBe(true);
	}
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
