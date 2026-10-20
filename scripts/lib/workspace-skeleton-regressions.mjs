import assert from 'node:assert/strict';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import PocketBase from '../../apps/web/node_modules/pocketbase/dist/pocketbase.es.mjs';

// Only called by the isolated PocketBase runner. Requests are held, not timed,
// so assertions prove that the fallback renders before the API can finish.
export async function testWorkspaceSkeletons({ browser, web, fixture, pb }) {
	const artifacts = await mkdtemp(path.join(tmpdir(), 'wedez-skeletons-'));
	for (const width of [1920, 390]) {
		const email = `skeleton-${width}-${Date.now()}@example.test`;
		await pb.collection('users').create({
			email,
			password: fixture.password,
			passwordConfirm: fixture.password,
			verified: true,
			name: 'QA Skeleton'
		});
		const owner = new PocketBase(fixture.base);
		await owner.collection('users').authWithPassword(email, fixture.password);
		await owner.send('/api/wedez/account/provision', { method: 'POST' });
		owner.authStore.save(
			owner.authStore.token,
			await owner.collection('users').getOne(owner.authStore.record.id)
		);
		await owner.send('/api/wedez/affiliate/enroll', { method: 'POST' });
		const context = await browser.newContext({ viewport: { width, height: 1000 } });
		const errors = [],
			requests = [],
			gates = [];
		let failOverview = false;
		await context.addInitScript(
			(auth) => localStorage.setItem('wedez_auth', JSON.stringify(auth)),
			{ token: owner.authStore.token, record: owner.authStore.record }
		);
		await context.route(/\/api\/(?:collections|wedez|files)\//, async (route) => {
			const url = new URL(route.request().url());
			requests.push({ path: url.pathname, frame: new URL(route.request().frame().url()).pathname });
			const gate = gates.find((item) => !item.used && item.matches(url));
			if (gate) {
				gate.used = true;
				gate.seen();
				await gate.wait;
			}
			if (failOverview && url.pathname === '/api/wedez/affiliate/me') {
				failOverview = false;
				return route.fulfill({ status: 503, json: { message: 'Synthetic loading failure' } });
			}
			try {
				const response = await route.fetch({ url: fixture.base + url.pathname + url.search });
				await route.fulfill({ response });
			} catch {
				/* A superseded page/context may abort its request. */
			}
		});
		function hold(matches) {
			let seen, release;
			const requested = new Promise((resolve) => {
				seen = resolve;
			});
			const wait = new Promise((resolve) => {
				release = resolve;
			});
			gates.push({ matches, seen, wait, release, used: false });
			return { requested, release };
		}
		const page = await context.newPage();
		page.setDefaultTimeout(15000);
		page.on('pageerror', (cause) => errors.push(cause.message));
		async function shell(area, name) {
			await page.waitForFunction(
				({ area, name }) =>
					[...document.querySelectorAll('nav a')].some(
						(link) =>
							link.getAttribute('href')?.startsWith(`/${area}/`) &&
							link.textContent.trim() === name &&
							link.getAttribute('aria-current') === 'page'
					),
				{ area, name }
			);
			const navigation = page.getByRole('navigation', {
				name: area === 'user' ? 'Navigasi dashboard' : 'Navigasi affiliate'
			});
			assert.equal(
				await navigation.getByRole('link', { name, exact: true }).getAttribute('aria-current'),
				'page'
			);
			assert.equal(await page.locator('header').first().isVisible(), true);
			assert.equal(
				await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
				false
			);
		}
		async function menu(area, name) {
			if (width < 768) await page.getByRole('button', { name: 'Buka menu', exact: true }).click();
			await page
				.getByRole('navigation', {
					name: area === 'user' ? 'Navigasi dashboard' : 'Navigasi affiliate'
				})
				.getByRole('link', { name, exact: true })
				.click();
			if (width < 768) await page.locator('.drawer-backdrop').waitFor({ state: 'hidden' });
		}
		async function fallback(pathname) {
			await page
				.locator(`[data-skeleton="${pathname}"]`)
				.filter({ visible: true })
				.first()
				.waitFor();
			assert.equal(
				await page.locator('input:visible, form:visible').count(),
				0,
				'Old form must not remain interactive'
			);
		}
		try {
			let gate = hold((url) => url.pathname === '/api/wedez/dashboard');
			await page.goto(web + '/user/dashboard');
			await fallback('/user/dashboard');
			await gate.requested;
			await shell('user', 'Beranda');
			await page.screenshot({ path: `${artifacts}/user-dashboard-${width}.png` });
			gate.release();
			await page.getByText('Paket aktif', { exact: true }).waitFor();
			gate = hold((url) => url.pathname === '/api/wedez/weddings/summary');
			await menu('user', 'Data Pernikahan');
			await fallback('/user/data');
			await gate.requested;
			await shell('user', 'Data Pernikahan');
			gate.release();
			await page.getByRole('heading', { name: 'Domain', exact: true }).waitFor();
			for (const [section, field] of Object.entries({
				Domain: 'slug',
				Mempelai: 'groom_name',
				Acara: 'akad',
				Media: 'cover',
				Story: 'collectionName',
				Quote: 'quote',
				Kado: 'gift_enabled',
				Musik: 'music',
				Tema: 'theme'
			})) {
				gate = hold(
					(url) =>
						url.pathname.includes('/weddings/records/') &&
						url.searchParams.get('fields')?.split(',').includes(field)
				);
				await page.getByRole('heading', { name: section, exact: true }).click();
				await page.locator(`[data-skeleton="section-${section}"]`).waitFor();
				await gate.requested;
				assert.equal(await page.locator('form:visible').count(), 0);
				assert.equal(
					await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
					false
				);
				if (section === 'Tema' || section === 'Mempelai')
					await page.screenshot({ path: `${artifacts}/section-${section}-${width}.png` });
				gate.release();
				await page.locator('form.ws-panel').waitFor();
				await page.getByRole('button', { name: 'Back', exact: true }).click();
				await page.getByRole('heading', { name: 'Domain', exact: true }).waitFor();
			}
			gate = hold((url) => url.pathname.includes('/guests/records'));
			await menu('user', 'Undangan');
			await fallback('/user/invitation');
			await gate.requested;
			await shell('user', 'Undangan');
			await page.screenshot({ path: `${artifacts}/user-invitation-${width}.png` });
			gate.release();
			await page.getByPlaceholder('Cari').waitFor();
			gate = hold(
				(url) =>
					url.pathname.includes('/weddings/records/') &&
					url.searchParams.get('fields') === 'id,plan_tier'
			);
			await menu('user', 'Upgrade');
			await fallback('/user/upgrade');
			await gate.requested;
			await shell('user', 'Upgrade');
			gate.release();
			await page.getByText('Paketmu saat ini', { exact: true }).waitFor();
			// Settings has no data fetch: only hold its first lazy-loaded module.
			let releaseModule;
			await context.route(
				'**/src/routes/user/setting/+page.svelte*',
				async (route) => {
					await new Promise((resolve) => {
						releaseModule = resolve;
					});
					await route.continue();
				},
				{ times: 1 }
			);
			await menu('user', 'Pengaturan');
			await fallback('/user/setting');
			await shell('user', 'Pengaturan');
			await page.screenshot({ path: `${artifacts}/user-setting-${width}.png` });
			releaseModule();
			await page.getByText('Profil akun', { exact: true }).waitFor();
			// A late response from an abandoned page must not replace the latest menu.
			gate = hold((url) => url.pathname.includes('/guests/records'));
			await menu('user', 'Undangan');
			await fallback('/user/invitation');
			await gate.requested;
			await menu('user', 'Pengaturan');
			await page.getByText('Profil akun', { exact: true }).waitFor();
			gate.release();
			await menu('user', 'Beranda');
			await page.getByText('Paket aktif', { exact: true }).waitFor();
			await page.goBack();
			await page.getByText('Profil akun', { exact: true }).waitFor();
			assert.equal(new URL(page.url()).pathname, '/user/setting');
			assert.equal(
				requests.some(
					(request) => request.path.includes('/affiliate') && request.frame.startsWith('/user/')
				),
				false
			);
			console.log(
				`PASS ${width}px: all user routes and nine editor skeletons appear while requests are held`
			);
			gate = hold((url) => url.pathname === '/api/wedez/affiliate/me');
			await page.goto(web + '/affiliate/dashboard');
			await fallback('/affiliate/dashboard');
			await gate.requested;
			await shell('affiliate', 'Beranda');
			gate.release();
			await page.getByText('Status affiliate', { exact: true }).waitFor();
			for (const [route, name, heading] of [
				['commissions', 'Komisi', 'Riwayat komisi'],
				['payouts', 'Pencairan', 'Pencairan komisi'],
				['settings', 'Rekening', 'Rekening pencairan'],
				['dashboard', 'Beranda', 'Status affiliate']
			]) {
				gate = hold((url) => url.pathname === '/api/wedez/affiliate/me');
				const history =
					route === 'commissions' || route === 'payouts'
						? hold((url) => url.pathname.includes(`/affiliate_${route}/records`))
						: null;
				await menu('affiliate', name);
				await fallback(`/affiliate/${route}`);
				await gate.requested;
				await shell('affiliate', name);
				await page.screenshot({ path: `${artifacts}/affiliate-${route}-${width}.png` });
				gate.release();
				await page.getByText(heading, { exact: true }).waitFor();
				if (history) {
					await history.requested;
					await page.locator('[data-skeleton="table"]').filter({ visible: true }).waitFor();
					history.release();
					await page.locator('[data-skeleton="table"]').waitFor({ state: 'hidden' });
				}
			}
			failOverview = true;
			await menu('affiliate', 'Rekening');
			await page.getByRole('button', { name: 'Coba lagi', exact: true }).click();
			await page.getByRole('button', { name: 'Simpan rekening', exact: true }).waitFor();
			await page.emulateMedia({ reducedMotion: 'reduce' });
			gate = hold((url) => url.pathname === '/api/wedez/affiliate/me');
			await menu('affiliate', 'Komisi');
			await fallback('/affiliate/commissions');
			assert.equal(
				await page
					.locator('[data-skeleton="/affiliate/commissions"] .skeleton')
					.first()
					.evaluate((element) => getComputedStyle(element).animationName),
				'none'
			);
			gate.release();
			await page.getByRole('heading', { name: 'Riwayat komisi', exact: true }).waitFor();
			assert.equal(
				requests.some((request) => request.path.endsWith('/auth-refresh')),
				false
			);
			assert.deepEqual(errors, []);
			console.log(
				`PASS ${width}px: affiliate route/table skeletons, error retry, reduced motion, no overflow or auth-refresh`
			);
		} catch (cause) {
			console.error(
				'Skeleton failure state:',
				page.url(),
				await page
					.locator('nav a')
					.evaluateAll((links) =>
						links.map((link) => [link.textContent.trim(), link.getAttribute('aria-current')])
					)
			);
			await page.screenshot({ path: `${artifacts}/failure-${width}.png` });
			throw cause;
		} finally {
			for (const gate of gates) gate.release();
			await context.close();
		}
	}
	console.log('Skeleton screenshots: ' + artifacts);
}
