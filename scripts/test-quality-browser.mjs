// Start the synthetic fixture with WEDEZ_KEEP_TEST_SERVER=1 bun run test:quality,
// then pass its fixture.json path. Uses an existing Playwright, never production.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import PocketBase from '../apps/web/node_modules/pocketbase/dist/pocketbase.es.mjs';
import { WEDDING_THEME_KEYS } from '../apps/invitation/src/lib/features/wedding-themes/model/wedding-theme.ts';
import { testLogicRegressions } from './lib/logic-browser-regressions.mjs';

const fixturePath = process.argv[2];
assert.ok(
	fixturePath && path.basename(fixturePath) === 'fixture.json',
	'Pass the isolated quality fixture.json'
);
const fixture = JSON.parse(await readFile(fixturePath, 'utf8'));
assert.equal(new URL(fixture.base).hostname, '127.0.0.1');
assert.equal(fixture.adminEmail, 'quality-admin@example.test');
const dir = path.dirname(fixturePath);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const web = 'http://127.0.0.1:5196',
	invitation = 'http://127.0.0.1:5197',
	adminUrl = 'http://127.0.0.1:5198';
const pb = new PocketBase(fixture.base);
pb.autoCancellation(false);
await pb.collection('_superusers').authWithPassword(fixture.adminEmail, fixture.password);
const owner = new PocketBase(fixture.base);
owner.authStore.save(fixture.owner.token, fixture.owner.record);
const settings = await pb.settings.getAll();
// The API suite already exercised the production RSVP throttle. Bulk theme QA
// deliberately visits 51 invitations in rapid succession from one localhost IP.
await pb.settings.update({
	rateLimits: {
		...settings.rateLimits,
		rules: settings.rateLimits.rules.map((rule) => ({ ...rule, maxRequests: 10000 }))
	}
});
const children = [];
const results = [];
const runId = Date.now();
const jsErrors = [];
const logs = {};
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
let browser;
const env = {
	...process.env,
	PUBLIC_POCKETBASE_URL: fixture.base,
	PUBLIC_INVITATION_URL: invitation,
	PUBLIC_WEDDING_URL: invitation
};
async function startApp(app, port) {
	const probe = createServer();
	probe.listen(port, '127.0.0.1');
	await once(probe, 'listening');
	await new Promise((resolve) => probe.close(resolve));
	const child = spawn(
		'bun',
		[
			'run',
			process.env.WEDEZ_TEST_PREVIEW === '1' ? 'preview' : 'dev',
			'--host',
			'127.0.0.1',
			'--port',
			String(port),
			'--strictPort'
		],
		{ cwd: path.join(root, 'apps', app), env, stdio: ['ignore', 'pipe', 'pipe'] }
	);
	children.push(child);
	logs[app] = '';
	child.stdout.on('data', (data) => {
		logs[app] += data;
	});
	child.stderr.on('data', (data) => {
		logs[app] += data;
	});
	for (let attempt = 0; attempt < 200; attempt++) {
		if (child.exitCode !== null) throw new Error(`${app} failed: ${logs[app]}`);
		try {
			if ((await fetch(`http://127.0.0.1:${port}`)).ok) return;
		} catch {
			/* startup */
		}
		await new Promise((resolve) => setTimeout(resolve, 50));
	}
	throw new Error(`${app} startup timeout`);
}
async function check(name, fn) {
	try {
		await fn();
		results.push({ name, passed: true });
		console.log('PASS ' + name);
	} catch (error) {
		results.push({ name, passed: false, error: error.message });
		console.error('FAIL ' + name + ': ' + error.message.slice(0, 400));
	}
}
async function visit(page, url) {
	await page.goto(url);
	await page.waitForLoadState('networkidle');
}
async function signIn(page, url, email, password = fixture.password) {
	await visit(page, url);
	await page.getByLabel('Email', { exact: true }).fill(email);
	await page.getByLabel('Kata sandi', { exact: true }).fill(password);
	await page.getByRole('button', { name: 'Masuk', exact: true }).click();
	await page.waitForLoadState('networkidle');
}
async function noOverflow(page) {
	const metrics = await page.evaluate(() => ({
		width: innerWidth,
		scroll: document.documentElement.scrollWidth
	}));
	assert.ok(metrics.scroll <= metrics.width, JSON.stringify(metrics));
}
async function openSection(page, name) {
	await visit(page, web + '/user/data');
	await page
		.getByRole('button')
		.filter({ has: page.getByRole('heading', { name, exact: true }) })
		.click();
}

try {
	await Promise.all([startApp('web', 5196), startApp('invitation', 5197), startApp('admin', 5198)]);
	browser = await chromium.launch({
		headless: true,
		executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
	});
	const context = await browser.newContext({
		viewport: { width: 1440, height: 1000 },
		reducedMotion: 'reduce'
	});
	const page = await context.newPage();
	page.setDefaultTimeout(10000);
	page.on('pageerror', (error) => jsErrors.push(error.message));
	await check('Web public pages and mobile layouts 360/390px', async () => {
		for (const width of [360, 390]) {
			await page.setViewportSize({ width, height: 844 });
			for (const route of ['/', '/tema', '/login', '/register', '/forgot-password']) {
				await visit(page, web + route);
				await noOverflow(page);
			}
		}
	});
	await page.setViewportSize({ width: 1440, height: 1000 });
	await check('Web login and owner dashboard', async () => {
		await signIn(page, web + '/login', fixture.owner.email);
		await page.waitForURL('**/user/dashboard');
	});
	await check('Avatar upload persists and rejects invalid content', async () => {
		await visit(page, web + '/user/setting');
		const file = path.join(root, 'apps/web/static/images/hero/logo-wedez.webp');
		await page.getByLabel('Pilih foto profil').setInputFiles(file);
		await page.getByText('Foto profil berhasil diperbarui.', { exact: true }).waitFor();
		const saved = await pb.collection('users').getOne(fixture.owner.record.id);
		assert.ok(saved.avatar.endsWith('.webp'));
		await page.reload();
		await page.getByAltText('Foto profil', { exact: true }).waitFor();
		await page.getByLabel('Pilih foto profil').setInputFiles({
			name: 'bad.html',
			mimeType: 'text/html',
			buffer: Buffer.from('<h1>Invalid</h1>')
		});
		await page
			.getByText(/Format gambar/)
			.first()
			.waitFor();
		assert.equal((await pb.collection('users').getOne(saved.id)).avatar, saved.avatar);
	});
	await check('CSV import actually creates guests through the web form', async () => {
		await visit(page, web + '/user/invitation');
		await page.getByRole('button', { name: 'Impor CSV', exact: true }).click();
		const dialog = page.locator('dialog[open]');
		await dialog.locator('input[type=file]').setInputFiles({
			name: 'quality.csv',
			mimeType: 'text/csv',
			buffer: Buffer.from(
				`nama,whatsapp\n"Keluarga, QA ${runId}",0812${String(runId).slice(-7)}1\nNadia ${runId},0812${String(runId).slice(-7)}2\n`
			)
		});
		await dialog.getByRole('button', { name: /Impor \d+ tamu|Impor tamu/ }).click();
		await dialog.waitFor({ state: 'hidden' });
		const saved = await pb.collection('guests').getFullList({
			filter: pb.filter('wedding = {:wedding} && name = {:name}', {
				wedding: fixture.wedding,
				name: `Nadia ${runId}`
			})
		});
		assert.equal(saved.length, 1);
		assert.match(saved[0].rsvp_token, /^[a-z]{6}$/);
	});
	await check(
		'Domain validation reports backend rejection without changing the invitation',
		async () => {
			await openSection(page, 'Domain');
			await page.locator('input[name=slug]').fill('admin');
			await page.getByRole('button', { name: 'Simpan perubahan', exact: true }).click();
			await page
				.getByText(/Pilih subdomain lain/)
				.first()
				.waitFor();
			assert.equal(
				(await pb.collection('weddings').getOne(fixture.wedding)).slug,
				'quality-wedding'
			);
		}
	);
	await check('Story editor uses a multipart batch and persists the complete result', async () => {
		await openSection(page, 'Story');
		await page.getByLabel('Judul', { exact: true }).first().fill('Quality Browser Story');
		await page
			.getByLabel('Cerita', { exact: true })
			.first()
			.fill('Synthetic story saved atomically');
		const response = page.waitForResponse((r) => r.url().endsWith('/api/batch'));
		await page.getByRole('button', { name: 'Simpan perubahan', exact: true }).click();
		assert.equal((await response).status(), 200);
		const saved = await pb
			.collection('wedding_stories')
			.getFullList({ filter: pb.filter('wedding = {:id}', { id: fixture.wedding }) });
		assert.equal(saved[0].title, 'Quality Browser Story');
	});
	await check('Editor and guests stay within mobile viewport', async () => {
		await page.setViewportSize({ width: 390, height: 844 });
		for (const route of ['/user/data', '/user/invitation', '/user/setting']) {
			await visit(page, web + route);
			await noOverflow(page);
		}
	});
	await page.setViewportSize({ width: 1440, height: 1000 });
	await check('Admin rejects an ordinary user, then authenticates a superuser', async () => {
		await signIn(page, adminUrl, fixture.owner.email);
		await page.getByRole('alert').waitFor();
		assert.equal(await page.getByRole('navigation', { name: 'Navigasi admin' }).count(), 0);
		await signIn(page, adminUrl, fixture.adminEmail);
		await page.getByRole('navigation', { name: 'Navigasi admin' }).waitFor();
	});
	for (const name of ['Beranda', 'Pengguna', 'Undangan', 'Pembayaran', 'Afiliasi', 'Pencairan']) {
		await check('Admin section ' + name, async () => {
			await page
				.getByRole('navigation', { name: 'Navigasi admin' })
				.getByRole('button', { name, exact: true })
				.click();
			await page.waitForLoadState('networkidle');
			assert.deepEqual(await page.getByRole('alert').allTextContents(), []);
		});
	}
	await check('Admin shows business validation instead of an incorrect login error', async () => {
		const affiliate = await owner.send('/api/wedez/affiliate/enroll', { method: 'POST' });
		await pb.collection('users').update(fixture.owner.record.id, { verified: false });
		try {
			await page
				.getByRole('navigation', { name: 'Navigasi admin' })
				.getByRole('button', { name: 'Afiliasi', exact: true })
				.click();
			await page.getByRole('button', { name: 'Aktifkan', exact: true }).first().click();
			const dialog = page.locator('dialog[open]');
			await dialog.getByRole('button', { name: 'Ubah status', exact: true }).click();
			await dialog.getByText('Email affiliate belum terverifikasi.', { exact: true }).waitFor();
			assert.equal((await pb.collection('affiliates').getOne(affiliate.id)).status, 'pending');
			await dialog.getByRole('button', { name: 'Batal', exact: true }).click();
		} finally {
			await pb.collection('users').update(fixture.owner.record.id, { verified: true });
		}
	});
	await check('Admin token stays in memory and reload requires login', async () => {
		assert.ok(!(await page.evaluate(() => JSON.stringify(localStorage))).includes('_superusers'));
		await page.reload();
		await page.getByRole('button', { name: 'Masuk', exact: true }).waitFor();
	});

	await page.setViewportSize({ width: 390, height: 844 });
	const realUrl = invitation + '/?slug=quality-wedding&rsvp=' + fixture.guest.rsvp_token;
	await check('RSVP ignores double submission and stale message-list responses', async () => {
		await pb.collection('weddings').update(fixture.wedding, { theme: 'minimalist-1' });
		let release;
		const held = new Promise((resolve) => {
			release = resolve;
		});
		let lists = 0,
			submissions = 0;
		await page.route('**/api/wedez/rsvp/messages', async (route) => {
			if (++lists === 1) {
				await held;
				await route.fulfill({
					json: {
						items: [
							{ name: 'Old response', message: 'STALE_BEFORE_SUBMIT', rsvp_status: 'pending' }
						],
						has_more: false
					}
				});
			} else await route.continue();
		});
		await page.route('**/api/wedez/rsvp/respond', async (route) => {
			submissions++;
			await new Promise((resolve) => setTimeout(resolve, 150));
			await route.continue();
		});
		try {
			await page.goto(realUrl);
			await page
				.getByRole('button', { name: /Buka Undangan/i })
				.first()
				.click();
			await page.locator('input[type=radio][value=attending]').first().check({ force: true });
			await page.locator('textarea').first().fill('LATEST_RSVP_RESPONSE');
			await page
				.locator('form')
				.first()
				.evaluate((form) => {
					form.requestSubmit();
					form.requestSubmit();
					form.requestSubmit();
				});
			await page.getByText('LATEST_RSVP_RESPONSE', { exact: true }).first().waitFor();
			release();
			await page.waitForLoadState('networkidle');
			assert.equal(submissions, 1);
			assert.equal(await page.getByText('STALE_BEFORE_SUBMIT', { exact: true }).count(), 0);
		} finally {
			release();
			await page.unrouteAll({ behavior: 'wait' });
		}
	});
	for (const theme of WEDDING_THEME_KEYS) {
		await check(`Invitation ${theme}: mobile real RSVP and desktop preview`, async () => {
			await pb.collection('weddings').update(fixture.wedding, { theme });
			await visit(page, realUrl);
			await page
				.getByRole('button', { name: /Buka Undangan/i })
				.first()
				.click();
			if (theme === 'kinetika') {
				// Leaf count depends on wedding content; wait for each page turn to finish.
				await page.locator('.open-book[aria-hidden=false]').waitFor();
				for (let i = 0; i < 40 && !(await page.locator('textarea').first().isVisible()); i++) {
					await page.keyboard.press('ArrowRight');
					await page.waitForFunction(
						() => document.querySelector('.book-object')?.getAttribute('aria-busy') === 'false'
					);
				}
			}
			await page.locator('textarea').first().waitFor();
			await page.locator('input[type=radio][value=attending]').first().check({ force: true });
			await page
				.locator('textarea')
				.first()
				.fill('QA ' + theme);
			const response = page.waitForResponse((r) => r.url().endsWith('/api/wedez/rsvp/respond'));
			await page.locator('form button[type=submit]').first().click();
			assert.equal((await response).status(), 200);
			assert.equal((await pb.collection('guests').getOne(fixture.guest.id)).message, 'QA ' + theme);
			await noOverflow(page);
			await page.setViewportSize({ width: 1440, height: 1000 });
			await visit(page, invitation + '/preview/' + theme);
			await page
				.getByRole('button', { name: /Buka Undangan/i })
				.first()
				.click();
			await noOverflow(page);
			await page.setViewportSize({ width: 390, height: 844 });
		});
	}
	await check(
		'Animated theme lifecycle and reduced-motion toggling keep content accessible',
		async () => {
			await page.emulateMedia({ reducedMotion: 'no-preference' });
			for (const theme of ['minimalist-1', 'sakura']) {
				await visit(page, invitation + '/preview/' + theme);
				await page
					.getByRole('button', { name: /Buka Undangan/i })
					.first()
					.click();
				await page.locator('[data-theme-scroll-active]').waitFor();
				await page.mouse.wheel(0, 900);
				await page.emulateMedia({ reducedMotion: 'reduce' });
				await page.locator('[data-theme-scroll-active]').waitFor({ state: 'detached' });
				await noOverflow(page);
				await page.emulateMedia({ reducedMotion: 'no-preference' });
				await page.locator('[data-theme-scroll-active]').waitFor();
			}
		}
	);
	await check('Unavailable invitation and unknown theme have explicit error states', async () => {
		await visit(page, invitation + '/?slug=not-an-existing-invitation');
		await page.getByRole('heading', { name: 'Undangan belum tersedia', exact: true }).waitFor();
		await visit(page, invitation + '/preview/not-a-theme');
		await page.getByText('Tema tidak ditemukan.', { exact: true }).waitFor();
	});
	await testLogicRegressions({ browser, pb, fixture, web, invitation, check, jsErrors });
	await check('No unhandled JavaScript exceptions across all three apps', async () =>
		assert.deepEqual(jsErrors, [])
	);
	await page.screenshot({ path: path.join(dir, 'quality-browser-final.png'), fullPage: false });
} finally {
	await browser?.close();
	await Promise.all(
		children.map(async (child) => {
			if (child.exitCode === null) {
				const stopped = once(child, 'exit');
				child.kill('SIGTERM');
				await stopped;
			}
		})
	);
	await pb.settings.update({ rateLimits: settings.rateLimits });
	await writeFile(
		path.join(dir, 'browser-results.json'),
		JSON.stringify({ results, jsErrors }, null, 2)
	);
	await writeFile(path.join(dir, 'browser-server-logs.json'), JSON.stringify(logs, null, 2));
	console.log(
		`Browser: ${results.filter((r) => r.passed).length}/${results.length} passed. ${dir}`
	);
}
assert.ok(
	results.length && results.every((result) => result.passed),
	'Some browser checks failed; inspect browser-results.json'
);
