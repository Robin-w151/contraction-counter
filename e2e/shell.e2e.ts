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
