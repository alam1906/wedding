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
		let failingUserApi;
		let slowNavigation = false;
		let delayedRequests = 0;
		await context.addInitScript(
			(auth) => localStorage.setItem('wedez_auth', JSON.stringify(auth)),
			{ token: owner.authStore.token, record: owner.authStore.record }
		);
		await context.route(/\/api\/(?:collections|wedez|files)\//, async (route) => {
			const url = new URL(route.request().url());
			requests.push({ path: url.pathname, frame: new URL(route.request().frame().url()).pathname });
			if (slowNavigation) {
				// Let older responses finish between newer clicks, in a different order.
				const delay = [1100, 450, 800][delayedRequests++ % 3];
				await new Promise((resolve) => setTimeout(resolve, delay));
			}
			const gate = gates.find(
				(item) => !item.released && (!item.once || !item.used) && item.matches(url)
			);
			if (gate) {
				gate.used = true;
				gate.seen();
				await gate.wait;
			}
			if (failOverview && url.pathname === '/api/wedez/affiliate/me') {
				failOverview = false;
				return route.fulfill({ status: 503, json: { message: 'Synthetic loading failure' } });
			}
			if (url.pathname === failingUserApi) {
				failingUserApi = undefined;
				return route.fulfill({ status: 503, json: { message: 'Synthetic loading failure' } });
			}
			try {
				const response = await route.fetch({ url: fixture.base + url.pathname + url.search });
				await route.fulfill({ response });
			} catch {
				/* A superseded page/context may abort its request. */
			}
		});
		function hold(matches, once = false) {
			let seen, release;
			const requested = new Promise((resolve) => {
				seen = resolve;
			});
			const wait = new Promise((resolve) => {
				release = resolve;
			});
			const gate = {
				matches,
				seen,
				wait,
				once,
				used: false,
				released: false,
				release() {
					gate.released = true;
					release();
				}
			};
			gates.push(gate);
			return { requested, release: gate.release };
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
			await page.locator('header').first().getByText(name, { exact: true }).waitFor();
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
		async function rapidNavigation(area) {
			const items =
				area === 'user'
					? ['data', 'dashboard', 'invitation', 'upgrade']
					: ['dashboard', 'commissions', 'payouts', 'settings'];
			const finalName = area === 'user' ? 'Upgrade' : 'Rekening';
			const finalContent = area === 'user' ? 'Paketmu saat ini' : 'Rekening pencairan';
			await page.goto(`${web}/${area}/${items[0]}`);
			if (area === 'user')
				await page.getByRole('heading', { name: 'Domain', exact: true }).waitFor();
			else await page.getByText('Status affiliate', { exact: true }).waitFor();
			await page.locator('[data-skeleton]').waitFor({ state: 'hidden' });
			// Regression: A → B → A must finish without waiting for the abandoned
			// first A request. A pathname-keyed boundary used to keep that branch alive.
			const abandoned = hold(
				(url) =>
					area === 'user'
						? url.pathname === '/api/wedez/dashboard'
						: url.pathname === '/api/wedez/affiliate/me',
				true
			);
			await menu(area, area === 'user' ? 'Beranda' : 'Komisi');
			await abandoned.requested;
			const intermediate = hold(
				(url) =>
					area === 'user'
						? url.pathname === '/api/collections/guests/records'
						: url.pathname === '/api/collections/affiliate_payouts/records',
				true
			);
			await menu(area, area === 'user' ? 'Undangan' : 'Pencairan');
			// Prove B has mounted (its component starts this request). If B's code
			// is still downloading, going back to A legitimately retains A's first
			// request; holding that forever would test a fake deadlock.
			await intermediate.requested;
			await menu(area, area === 'user' ? 'Beranda' : 'Komisi');
			await page
				.getByText(area === 'user' ? 'Paket aktif' : 'Riwayat komisi', { exact: true })
				.waitFor();
			abandoned.release();
			intermediate.release();
			const cdp = await context.newCDPSession(page);
			await cdp.send('Network.enable');
			await cdp.send('Network.emulateNetworkConditions', {
				offline: false,
				latency: 560,
				downloadThroughput: 200000,
				uploadThroughput: 90000,
				connectionType: 'cellular4g'
			});
			await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
			slowNavigation = true;
			try {
				const sequence = [1, 0, 2, 1, 3, 2, 0, 3, 1, 2, 3, 0, 1, 3, 0, 2, 1, 3];
				for (let index = 0; index < sequence.length * 3; index++) {
					const href = `/${area}/${items[sequence[index % sequence.length]]}`;
					// Dispatch without awaiting the router: a real link click must remain
					// usable even while an earlier route is still rendering its data.
					const link = page.locator(`nav a[href="${href}"]`);
					if (width >= 768) {
						// Include pointer-triggered preloads, as when quickly using the sidebar.
						const box = await link.boundingBox();
						await page.mouse.move(box.x + 30, box.y + box.height / 2);
						await page.waitForTimeout(30);
						await page.mouse.click(box.x + 30, box.y + box.height / 2);
					} else {
						await link.dispatchEvent('click');
					}
					await page.waitForTimeout([40, 90, 180][index % 3]);
				}
				await page.getByText(finalContent, { exact: true }).waitFor();
				await page.waitForTimeout(1500);
				assert.equal(new URL(page.url()).pathname, `/${area}/${items.at(-1)}`);
				await shell(area, finalName);
				assert.equal(await page.getByText(finalContent, { exact: true }).isVisible(), true);
				assert.equal(await page.locator('[data-skeleton]:visible').count(), 0);
				// It must keep working after the race, including history navigation.
				await menu(area, 'Beranda');
				await page
					.getByText(area === 'user' ? 'Paket aktif' : 'Status affiliate', { exact: true })
					.waitFor();
				await shell(area, 'Beranda');
				await page.goBack();
				await page.getByText(finalContent, { exact: true }).waitFor();
				await shell(area, finalName);
				await page.goForward();
				await page
					.getByText(area === 'user' ? 'Paket aktif' : 'Status affiliate', { exact: true })
					.waitFor();
				await shell(area, 'Beranda');
				// Finish bursts on EVERY page, not only Upgrade (which had no top-level
				// await). Production used to leave an old route or an endless skeleton.
				const destinations =
					area === 'user'
						? [
								['data', 'Data Pernikahan', 'Domain'],
								['invitation', 'Undangan', 'Cari'],
								['dashboard', 'Beranda', 'Paket aktif'],
								['setting', 'Pengaturan', 'Profil akun'],
								['upgrade', 'Upgrade', 'Paketmu saat ini']
							]
						: [
								['commissions', 'Komisi', 'Riwayat komisi'],
								['payouts', 'Pencairan', 'Pencairan komisi'],
								['settings', 'Rekening', 'Rekening pencairan'],
								['dashboard', 'Beranda', 'Status affiliate']
							];
				for (const [destination, name, content] of destinations) {
					for (const index of sequence.slice(0, 10)) {
						await page.locator(`nav a[href="/${area}/${items[index]}"]`).dispatchEvent('click');
						await page.waitForTimeout(60);
					}
					await menu(area, name);
					const target =
						destination === 'invitation'
							? page.getByPlaceholder(content)
							: page.getByText(content, { exact: true });
					await target.waitFor();
					await page.waitForTimeout(1500);
					assert.equal(new URL(page.url()).pathname, `/${area}/${destination}`);
					await shell(area, name);
					assert.equal(await target.isVisible(), true);
					assert.equal(await page.locator('[data-skeleton]:visible').count(), 0);
					await page.screenshot({
						path: `${artifacts}/stable-${area}-${destination}-${width}.png`
					});
				}
				assert.equal(
					requests.some(
						(request) => request.path.includes('/affiliate') && request.frame.startsWith('/user/')
					),
					false,
					'User navigation must never fetch affiliate APIs'
				);
				console.log(
					`PASS ${width}px: ${area} rapid navigation ends on every page; URL/header/sidebar/content agree, late responses, Back/Forward`
				);
			} finally {
				slowNavigation = false;
				await cdp.send('Network.emulateNetworkConditions', {
					offline: false,
					latency: 0,
					downloadThroughput: -1,
					uploadThroughput: -1
				});
				await cdp.send('Network.setCacheDisabled', { cacheDisabled: false });
				await cdp.detach();
			}
		}
		try {
			if (process.env.WEDEZ_TEST_NAVIGATION_ONLY === '1') {
				await rapidNavigation('user');
				await rapidNavigation('affiliate');
				assert.deepEqual(errors, []);
				continue;
			}
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
			let settingsModule = '**/src/routes/user/setting/+page.svelte*';
			if (process.env.WEDEZ_TEST_PRODUCTION === '1') {
				const html = await (await context.request.get(web + '/user/setting')).text();
				const appPath = html.match(/import\("([^"\n]+\/entry\/app\.[^"\n]+\.js)"\)/)?.[1];
				assert.ok(appPath, 'Production SPA must reference its hashed app entry');
				const appUrl = new URL(appPath, web + '/user/setting').href;
				const app = await (await context.request.get(appUrl)).text();
				const node = app.match(/"\/user\/setting":\[(\d+)/)?.[1];
				assert.ok(node, 'Production manifest must contain Settings');
				const module = app.match(new RegExp(`nodes/${node}\\.[\\w-]+\\.js`))?.[0];
				assert.ok(module, 'Settings must have a production route chunk');
				settingsModule = '**/' + module;
			}
			await context.route(
				settingsModule,
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
			for (const [name, api, content] of [
				['Beranda', '/api/wedez/dashboard', 'Paket aktif'],
				['Data Pernikahan', '/api/wedez/weddings/summary', 'Domain'],
				['Undangan', '/api/collections/guests/records', 'Cari']
			]) {
				failingUserApi = api;
				await menu('user', name);
				await page.getByRole('heading', { name: 'Halaman belum dapat dimuat' }).waitFor();
				await shell('user', name);
				await page.getByRole('button', { name: 'Coba lagi', exact: true }).click();
				await (
					name === 'Undangan'
						? page.getByPlaceholder(content)
						: page.getByText(content, { exact: true })
				).waitFor();
			}
			failingUserApi = '/api/wedez/weddings/summary';
			await menu('user', 'Data Pernikahan');
			await page.getByRole('heading', { name: 'Halaman belum dapat dimuat' }).waitFor();
			await menu('user', 'Beranda');
			await page.getByText('Paket aktif', { exact: true }).waitFor();
			await shell('user', 'Beranda');
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
			failOverview = true;
			await menu('affiliate', 'Komisi');
			await page.getByRole('heading', { name: 'Halaman belum dapat dimuat' }).waitFor();
			await menu('affiliate', 'Beranda');
			await page.getByText('Status affiliate', { exact: true }).waitFor();
			await shell('affiliate', 'Beranda');
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
			await rapidNavigation('user');
			await rapidNavigation('affiliate');
			assert.deepEqual(errors, []);
		} catch (cause) {
			console.error(
				'Skeleton failure state:',
				page.url(),
				errors,
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
