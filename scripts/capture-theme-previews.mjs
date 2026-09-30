// Run with Bun while invitation is served on port 5174.
// Reuses an existing Playwright installation via PLAYWRIGHT_MODULE; installs nothing.
import { mkdir, mkdtemp, rm, rmdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { encodeThemePreview } from './theme-preview-webp.mjs';
import { WEDDING_THEME_KEYS } from '../apps/web/src/lib/features/wedding-themes/model/wedding-theme.ts';
import { DEMO_RSVP_TOKEN } from '../apps/invitation/src/lib/features/guests/model/demo-rsvp.ts';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const selected = process.argv.slice(2);
const themes = selected.length ? selected : WEDDING_THEME_KEYS;
if (themes.some((theme) => !WEDDING_THEME_KEYS.includes(theme))) {
	throw new Error('Nama tema tidak valid.');
}
const output = new URL('../apps/web/static/images/theme-previews/', import.meta.url);
await mkdir(output, { recursive: true });
const scratch = await mkdtemp(join(tmpdir(), 'wedez-preview-capture-'));
const snapshot = join(scratch, 'cover.png');

const browser = await chromium.launch({
	headless: true,
	executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
});

try {
	const context = await browser.newContext({
		viewport: { width: 1200, height: 900 },
		deviceScaleFactor: 1,
		locale: 'id-ID',
		timezoneId: 'Asia/Jakarta',
		colorScheme: 'light'
	});
	for (const theme of themes) {
		const page = await context.newPage();
		const failures = [];
		page.on('pageerror', (error) => failures.push(error.message));
		const url = new URL(
			`/preview/${theme}`,
			process.env.INVITATION_PREVIEW_ORIGIN || 'http://localhost:5174'
		);
		url.searchParams.set('rsvp', DEMO_RSVP_TOKEN);
		await page.goto(url.toString(), { waitUntil: 'networkidle' });
		await page.getByRole('button', { name: /Buka Undangan/i }).waitFor({ state: 'visible' });
		await page.evaluate(async () => {
			await document.fonts.ready;
			const visibleImages = [...document.images].filter((img) => {
				const rect = img.getBoundingClientRect();
				return rect.width > 0 && rect.height > 0 && rect.top < innerHeight && rect.bottom > 0;
			});
			await Promise.all(visibleImages.map((img) => img.decode()));
		});
		// Allow the real opening animation to finish without changing the theme or opening it.
		await page.waitForTimeout(2500);
		if (failures.length) throw new Error(`${theme}: ${failures.join('; ')}`);
		await page.screenshot({
			path: snapshot,
			type: 'png',
			fullPage: false
		});
		const bytes = await encodeThemePreview(
			snapshot,
			fileURLToPath(new URL(`${theme}.webp`, output))
		);
		console.log(`Captured ${theme}.webp (${(bytes / 1024).toFixed(1)} KiB)`);
		await page.close();
	}
} finally {
	await browser.close();
	await rm(snapshot, { force: true });
	await rmdir(scratch);
}
