import { defineConfig } from '@playwright/test';

const deployedUrl = process.env.E2E_BASE_URL;
const baseURL = deployedUrl ? new URL('./', deployedUrl).href : 'http://localhost:4173/';

export default defineConfig({
	testMatch: '**/*.e2e.{ts,js}',
	use: { baseURL },
	retries: process.env.CI ? 2 : 0,
	...(deployedUrl ? {} : { webServer: { command: 'npm run build && npm run preview', port: 4173 } })
});
