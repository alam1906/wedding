// Run after test:quality and pass its isolated fixture.json. All browser API traffic
// is forwarded to that disposable PocketBase, never the project's running database.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { cp, readFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import path from 'node:path';
import PocketBase from '../apps/web/node_modules/pocketbase/dist/pocketbase.es.mjs';
import { testLogicRegressions } from './lib/logic-browser-regressions.mjs';

const fixturePath = path.resolve(process.argv[2] || '');
assert.equal(
	path.basename(fixturePath),
	'fixture.json',
	'Pass the disposable quality fixture.json'
);
const fixture = JSON.parse(await readFile(fixturePath, 'utf8'));
assert.equal(fixture.adminEmail, 'quality-admin@example.test');
assert.equal(new URL(fixture.base).hostname, '127.0.0.1');
const web = process.env.WEDEZ_TEST_WEB_URL || 'http://localhost:5173';
assert.ok(['localhost', '127.0.0.1'].includes(new URL(web).hostname));
const root = path.resolve(import.meta.dirname, '..');
const dir = path.dirname(fixturePath);
const port = Number(new URL(fixture.base).port);
const probe = createServer();
probe.listen(port, '127.0.0.1');
await once(probe, 'listening');
await new Promise((resolve) => probe.close(resolve));
await cp(path.join(root, 'pocketbase/pb_hooks'), `${dir}/read-hooks`, { recursive: true });
const server = spawn(
	path.join(root, 'pocketbase/pocketbase'),
	[
		'serve',
		`--http=127.0.0.1:${port}`,
		`--dir=${dir}/data`,
		`--hooksDir=${dir}/read-hooks`,
		`--migrationsDir=${dir}/migrations`
	],
	{
		stdio: ['ignore', 'pipe', 'pipe'],
		env: { ...process.env, DUITKU_API_KEY: '', DUITKU_MERCHANT_CODE: '' }
	}
);
let logs = '';
server.stdout.on('data', (data) => (logs += data));
server.stderr.on('data', (data) => (logs += data));
let browser;
const authRefreshRequests = [];
const sectionFields = {
	Domain: ['slug'],
	Mempelai: [
		'groom_name',
		'groom_father_name',
		'groom_mother_name',
		'groom_photo',
		'bride_name',
		'bride_father_name',
		'bride_mother_name',
		'bride_photo'
	],
	Acara: [
		'akad',
		'reception',
		'address',
		'maps',
		'separate_events',
		'reception_address',
		'reception_maps'
	],
	Media: ['cover', 'gallery'],
	Story: [],
	Quote: ['quote'],
	Kado: [
		'gift_enabled',
		'groom_gift_hidden',
		'bride_gift_hidden',
		'groom_payment_number',
		'groom_payment_provider',
		'groom_payment_account_name',
		'bride_payment_number',
		'bride_payment_provider',
		'bride_payment_account_name'
	],
	Musik: ['music'],
	Tema: ['theme']
};

try {
	for (let i = 0; i < 100; i++) {
		if (server.exitCode !== null) throw Error(logs);
		try {
			if ((await fetch(fixture.base + '/api/health')).ok) break;
		} catch {
			/* startup */
		}
		await new Promise((resolve) => setTimeout(resolve, 50));
	}
	const admin = new PocketBase(fixture.base);
	await admin.collection('_superusers').authWithPassword(fixture.adminEmail, fixture.password);
	const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
	browser = await chromium.launch(
		process.env.CHROME_EXECUTABLE ? { executablePath: process.env.CHROME_EXECUTABLE } : {}
	);
	browser.on('context', (context) =>
		context.on('request', (request) => {
			if (new URL(request.url()).pathname.endsWith('/auth-refresh'))
				authRefreshRequests.push(request.url());
		})
	);
	for (const width of [1366, 390]) {
		const suffix = `${width}-${Date.now().toString(36)}`;
		const email = `read-${width}-${Date.now()}@example.test`;
		await admin.collection('users').create({
			email,
			password: fixture.password,
			passwordConfirm: fixture.password,
			verified: true,
			name: 'QA Read'
		});
		const owner = new PocketBase(fixture.base);
		owner.autoCancellation(false);
		await owner.collection('users').authWithPassword(email, fixture.password);
		const { wedding_id: id } = await owner.send('/api/wedez/account/provision', { method: 'POST' });
		owner.authStore.save(
			owner.authStore.token,
			await owner.collection('users').getOne(owner.authStore.record.id)
		);
		await owner.collection('weddings').update(id, {
			slug: `qa-read-${suffix}`,
			theme: 'arsir',
			groom_name: 'QA Pria',
			bride_name: 'QA Wanita',
			groom_father_name: 'Ayah',
			groom_mother_name: 'Ibu',
			bride_father_name: 'Ayah',
			bride_mother_name: 'Ibu',
			akad: '2027-01-01T01:00:00Z',
			reception: '2027-01-01T04:00:00Z',
			address: 'Bandung',
			maps: 'https://example.com/maps',
			gift_enabled: true,
			groom_payment_account_name: 'QA Pria',
			groom_payment_number: '00012345678',
			groom_payment_provider: 'BCA',
			bride_payment_account_name: 'QA Wanita',
			bride_payment_number: '081234567890',
			bride_payment_provider: 'DANA'
		});
		await owner.collection('wedding_stories').create({
			wedding: id,
			title: 'QA Kisah',
			content: 'Isi kisah',
			date: '2027-01-01',
			sort_order: 1
		});
		const context = await browser.newContext({ viewport: { width, height: 900 } });
		const requests = [],
			errors = [],
			affiliateRequests = [];
		let failQuote = false,
			delayDomain = false,
			releaseDomain;
		await context.route(/\/api\/(?:collections|wedez|files)\//, async (route) => {
			const url = new URL(route.request().url());
			if (
				/\/api\/(?:wedez\/affiliate(?:\/|$)|collections\/affiliate(?:s|_commissions|_payouts)(?:\/|$))/.test(
					url.pathname
				) &&
				!new URL(route.request().frame().url()).pathname.startsWith('/affiliate/')
			) {
				affiliateRequests.push(url.pathname);
				return route.fulfill({
					status: 503,
					json: { message: 'Affiliate API is unavailable during user route tests' }
				});
			}
			requests.push({
				path: url.pathname,
				fields: url.searchParams.get('fields'),
				method: route.request().method()
			});
			if (
				failQuote &&
				url.pathname.endsWith(`/weddings/records/${id}`) &&
				url.searchParams.get('fields')?.endsWith(',quote')
			) {
				failQuote = false;
				return route.fulfill({ status: 503, json: { message: 'Synthetic read failure' } });
			}
			if (
				delayDomain &&
				url.pathname.endsWith(`/weddings/records/${id}`) &&
				url.searchParams.get('fields')?.endsWith(',slug')
			) {
				delayDomain = false;
				await new Promise((resolve) => (releaseDomain = resolve));
			}
			const response = await route.fetch({ url: fixture.base + url.pathname + url.search });
			await route.fulfill({ response });
		});
		const page = await context.newPage();
		page.setDefaultTimeout(15000);
		page.on('pageerror', (error) => errors.push(error.message));
		const recordReads = () =>
			requests.filter((r) => r.path.endsWith(`/weddings/records/${id}`) && r.method === 'GET');
		const count = (part) =>
			requests.filter((r) => r.path.includes(part) && r.method === 'GET').length;
		async function menu(name) {
			if (width < 768) await page.getByRole('button', { name: 'Buka menu', exact: true }).click();
			await page
				.getByRole('navigation', { name: 'Navigasi dashboard' })
				.getByRole('link', { name, exact: true })
				.click();
		}
		async function open(name) {
			await page.getByRole('heading', { name, exact: true }).click();
			await page.locator('form.ws-panel').waitFor();
		}
		async function back() {
			await page.getByRole('button', { name: /Back/, exact: false }).click();
			await page.getByRole('heading', { name: 'Domain', exact: true }).waitFor();
			await page.getByRole('heading', { name: 'Tema', exact: true }).waitFor();
		}
		await page.goto(web + '/login');
		await page.getByLabel('Email', { exact: true }).fill(email);
		await page.getByLabel('Kata sandi', { exact: true }).fill(fixture.password);
		await page.getByRole('button', { name: 'Masuk', exact: true }).click();
		await page.waitForURL('**/user/dashboard');
		await page.getByText('Paket aktif', { exact: true }).waitFor();
		assert.equal(count('/api/wedez/dashboard'), 1);
		assert.equal(recordReads().length, 0);
		assert.equal(count('/guests/records'), 0);
		assert.equal(count('/wedding_stories/records'), 0);
		assert.equal(count('/musics/records'), 0);
		await menu('Data Pernikahan');
		await page.getByRole('heading', { name: 'Domain', exact: true }).waitFor();
		assert.equal(recordReads().length, 0);
		assert.equal(count('/api/wedez/weddings/summary'), 1);
		for (const [name, fields] of Object.entries(sectionFields)) {
			const before = recordReads().length;
			await open(name);
			assert.equal(recordReads().length, before + 1, name);
			assert.deepEqual(
				new Set(recordReads().at(-1).fields.split(',')),
				new Set(['id', 'collectionId', 'collectionName', ...fields]),
				name
			);
			if (name === 'Kado')
				assert.equal(
					await page.locator('input[name="groom_payment_number"]').inputValue(),
					'00012345678'
				);
			if (name === 'Story')
				assert.equal(await page.getByLabel('Judul', { exact: true }).inputValue(), 'QA Kisah');
			await back();
		}
		assert.equal(count('/wedding_stories/records'), 1);
		assert.equal(count('/musics/records'), 1);
		console.log(`PASS ${width}px: dashboard summary and all nine section projections`);
		await open('Kado');
		await page
			.getByRole('switch', { name: 'Tampilkan rekening mempelai pria', exact: true })
			.click();
		await page.getByRole('button', { name: 'Simpan perubahan', exact: true }).click();
		await page.getByText('Kado berhasil disimpan.', { exact: true }).waitFor();
		const gift = await owner.collection('weddings').getOne(id);
		assert.equal(gift.groom_gift_hidden, true);
		assert.equal(gift.groom_payment_number, '00012345678');
		await back();
		await owner.collection('weddings').update(id, { slug: `qa-fresh-${suffix}` });
		await open('Domain');
		assert.equal(await page.locator('input[name="slug"]').inputValue(), `qa-fresh-${suffix}`);
		await page.locator('input[name="slug"]').fill(`qa-saved-${suffix}`);
		await page.getByRole('button', { name: 'Simpan perubahan', exact: true }).click();
		await page.getByText('Domain berhasil disimpan.', { exact: true }).waitFor();
		assert.equal((await owner.collection('weddings').getOne(id)).slug, `qa-saved-${suffix}`);
		assert.equal(
			count('/wedding_stories/records'),
			1,
			'Saving another section must not fetch stories'
		);
		await back();
		failQuote = true;
		await page.getByRole('heading', { name: 'Quote', exact: true }).click();
		await page.getByRole('button', { name: 'Coba lagi', exact: true }).click();
		await page.locator('form.ws-panel').waitFor();
		await back();
		delayDomain = true;
		await page.getByRole('heading', { name: 'Domain', exact: true }).click();
		await page.getByText('Memuat data…', { exact: true }).waitFor();
		await back();
		await open('Tema');
		releaseDomain();
		await page.locator('label.ws-theme-option').first().click();
		const chosenTheme = await page.locator('input[name="theme"]:checked').inputValue();
		await page.getByRole('button', { name: 'Simpan perubahan', exact: true }).click();
		await page.getByText('Tema berhasil disimpan.', { exact: true }).waitFor();
		assert.equal((await owner.collection('weddings').getOne(id)).theme, chosenTheme);
		await menu('Undangan');
		await page.getByPlaceholder('Cari').waitFor();
		assert.equal(count('/guests/records'), 1);
		const invitationReads = recordReads()
			.slice(-2)
			.map((r) => r.fields)
			.sort();
		assert.deepEqual(invitationReads, ['slug', 'whatsapp_template']);
		await page.getByRole('button', { name: 'Tambah tamu', exact: true }).click();
		await page.getByLabel('Nama tamu', { exact: true }).fill('QA Tamu');
		await page.getByLabel('Nomor WhatsApp', { exact: true }).fill('081234567890');
		await page
			.getByRole('dialog')
			.getByRole('button', { name: 'Tambah tamu', exact: true })
			.click();
		await page.getByText('Tamu berhasil ditambahkan.', { exact: true }).waitFor();
		await admin.collection('guests').create({
			wedding: id,
			name: 'QA Baru',
			whatsapp: '+6281234567891',
			rsvp_token: crypto
				.randomUUID()
				.replace(/[^a-f]/g, '')
				.slice(0, 6),
			guest_count: 5,
			rsvp_status: 'attending'
		});
		await menu('Beranda');
		await page.getByText('Paket aktif', { exact: true }).waitFor();
		assert.equal(count('/api/wedez/dashboard'), 2);
		assert.equal(
			await page.locator('.ws-metrics > div').first().locator('p.text-4xl').textContent(),
			'6'
		);
		await menu('Undangan');
		await page.getByText('QA Baru', { exact: true }).filter({ visible: true }).first().waitFor();
		assert.equal(count('/guests/records'), 2);
		await menu('Upgrade');
		await page.getByText('Paketmu saat ini', { exact: true }).waitFor();
		assert.equal(recordReads().at(-1).fields, 'id,plan_tier');
		const readsBeforeSettings = recordReads().length;
		await menu('Pengaturan');
		await page.getByText('Profil akun', { exact: true }).waitFor();
		assert.equal(recordReads().length, readsBeforeSettings);
		assert.equal(count('/wedding_stories/records'), 1);
		assert.equal(count('/musics/records'), 1);
		assert.equal(count('/api/wedez/payments/session'), 0);
		for (const route of [
			'/user',
			'/user/dashboard',
			'/user/data',
			'/user/invitation',
			'/user/setting',
			'/user/upgrade'
		]) {
			await page.goto(web + route);
			if (route === '/user' || route.endsWith('/dashboard'))
				await page.getByText('Paket aktif', { exact: true }).waitFor();
			else if (route.endsWith('/data'))
				await page.getByRole('heading', { name: 'Domain', exact: true }).waitFor();
			else if (route.endsWith('/invitation')) await page.getByPlaceholder('Cari').waitFor();
			else if (route.endsWith('/setting'))
				await page.getByText('Profil akun', { exact: true }).waitFor();
			else await page.getByText('Paketmu saat ini', { exact: true }).waitFor();
			await page.getByRole('button', { name: 'Buka menu profil', exact: true }).click();
			await page.getByRole('menuitem', { name: 'Beralih ke Affiliate', exact: true }).hover();
			await page.getByRole('button', { name: 'Buka menu profil', exact: true }).click();
			assert.deepEqual(
				affiliateRequests,
				[],
				route + ' must not request affiliate data, including profile open/hover'
			);
		}
		console.log(
			`PASS ${width}px: every /user/* route and profile menu works with all affiliate APIs unavailable`
		);
		const beforePayment = recordReads().length;
		await page.goto(web + '/payment');
		await page.getByRole('heading', { name: 'Pembayaran', exact: true }).waitFor();
		assert.equal(recordReads().length, beforePayment);
		assert.equal(
			await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
			false
		);
		assert.deepEqual(errors, []);
		await page.goto(web + '/user/dashboard');
		await page.getByText('Paket aktif', { exact: true }).waitFor();
		await page.getByRole('button', { name: 'Buka menu profil', exact: true }).click();
		const affiliateResponse = page.waitForResponse(
			(response) => new URL(response.url()).pathname === '/api/wedez/affiliate/me'
		);
		await page.getByRole('menuitem', { name: 'Beralih ke Affiliate', exact: true }).click();
		assert.equal((await affiliateResponse).status(), 200);
		await page.waitForURL('**/affiliate/dashboard');
		assert.deepEqual(
			affiliateRequests,
			[],
			'Affiliate data must only load after entering /affiliate/*'
		);
		assert.deepEqual(errors, []);
		console.log(
			`PASS ${width}px: scoped requests, fresh re-entry, lazy sections, form saves and affiliate area isolation`
		);
		await context.close();
	}
	const jsErrors = [];
	await testLogicRegressions({
		browser,
		pb: admin,
		fixture,
		web,
		invitation: '',
		jsErrors,
		check: async (name, run) => {
			if (!/verification|wedding setup|expired sessions/i.test(name)) return;
			await run();
			console.log('PASS ' + name);
		}
	});
	assert.deepEqual(jsErrors, []);
	assert.deepEqual(authRefreshRequests, []);
	console.log(
		'PASS no browser auth-refresh calls after login, navigation, verification, provisioning or session expiry'
	);
} finally {
	await browser?.close();
	if (server.exitCode === null) {
		const exited = once(server, 'exit');
		server.kill('SIGTERM');
		await exited;
	}
}
