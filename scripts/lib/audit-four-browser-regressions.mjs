import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import PocketBase from '../../apps/web/node_modules/pocketbase/dist/pocketbase.es.mjs';

// Real, isolated PocketBase data for pagination; mocked gateway transport for
// payment UI only. Real payment hook/state tests live in test-affiliate.mjs.
export async function testAuditFourRegressions({ browser, pb, fixture, web, check, jsErrors }) {
	const email = `audit-four-${Date.now()}@example.test`;
	await pb.collection('users').create({
		email,
		password: fixture.password,
		passwordConfirm: fixture.password,
		name: 'Audit Four',
		verified: true
	});
	const owner = new PocketBase(fixture.base);
	owner.autoCancellation(false);
	await owner.collection('users').authWithPassword(email, fixture.password);
	const { wedding_id: wedding } = await owner.send('/api/wedez/account/provision', {
		method: 'POST'
	});
	await owner.collection('users').authRefresh();
	const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
	const page = await context.newPage();
	page.setDefaultTimeout(10000);
	page.on('pageerror', (error) => jsErrors.push(error.message));
	await page.goto(web);
	await page.waitForLoadState('networkidle');
	await page.evaluate((auth) => localStorage.setItem('wedez_auth', JSON.stringify(auth)), {
		token: owner.authStore.token,
		record: owner.authStore.record
	});
	const guestRoute = '**/api/collections/guests/records?*';
	const search = page.getByPlaceholder('Cari', { exact: true });
	const actions = page.locator('[data-guest-actions-trigger]');
	const pagination = page.getByRole('navigation', { name: 'Halaman daftar tamu' });
	async function loaded() {
		await pagination.waitFor();
		await page.getByText('Memuat daftar tamu…', { exact: true }).waitFor({ state: 'hidden' });
	}
	async function searchFor(value) {
		await Promise.all([
			page.waitForResponse(
				(res) => res.url().includes('/guests/records?') && res.request().method() === 'GET'
			),
			search.fill(value)
		]);
		await loaded();
	}
	try {
		await check(
			'1000 guests: bounded API page, single responsive list, server search/filter/sort',
			async () => {
				for (let offset = 0; offset < 1000; offset += 50) {
					const batch = pb.createBatch();
					for (let i = offset; i < offset + 50; i++) {
						batch.collection('guests').create({
							wedding,
							name: `QA Guest ${String(i).padStart(4, '0')}`,
							whatsapp: `+62857${String(i).padStart(8, '0')}`,
							rsvp_status: i % 2 ? 'attending' : 'pending',
							guest_count: 1,
							rsvp_token: randomBytes(6).toString('hex')
						});
					}
					await batch.send();
				}
				const responses = [];
				const observe = (res) => {
					if (res.url().includes('/guests/records?')) responses.push(res);
				};
				page.on('response', observe);
				await page.goto(web + '/user/invitation');
				await loaded();
				page.off('response', observe);
				assert.equal(responses.length, 1);
				const body = await responses[0].json();
				assert.equal(body.perPage, 50);
				assert.equal(body.items.length, 50);
				assert.equal(body.totalItems, 1000);
				assert.ok((await responses[0].body()).length < 30000);
				assert.equal(await actions.count(), 50);
				assert.equal(await page.locator('tbody tr').count(), 50);
				assert.equal(await page.locator('article').count(), 0);
				await pagination.getByRole('button', { name: 'Berikutnya' }).click();
				await loaded();
				assert.match(await pagination.innerText(), /Halaman 2 dari 20/);
				await page.setViewportSize({ width: 390, height: 844 });
				await page.waitForFunction(() => document.querySelectorAll('article').length === 50);
				assert.equal(await actions.count(), 50);
				assert.equal(await page.locator('tbody').count(), 0);
				assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
				await page.setViewportSize({ width: 1440, height: 1000 });
				await page.getByRole('button', { name: 'Tamu', exact: true }).click();
				await loaded();
				assert.match(await page.locator('tbody tr').first().innerText(), /0999/);
				await searchFor('0999');
				assert.equal(await actions.count(), 1);
				await searchFor('%');
				assert.equal(await actions.count(), 0);
				await searchFor('" || wedding != ""');
				assert.equal(await actions.count(), 0);
				await pb.collection('guests').update(body.items[0].id, { name: 'QA 100%_Guest\\Special' });
				try {
					await searchFor('100%_Guest');
					assert.equal(await actions.count(), 1);
					await searchFor('\\Special');
					assert.equal(await actions.count(), 1);
				} finally {
					await pb.collection('guests').update(body.items[0].id, { name: body.items[0].name });
				}
				await searchFor('');
				await page.getByRole('button', { name: 'Filter status tamu', exact: true }).click();
				await page.getByRole('option', { name: 'Hadir', exact: true }).click();
				await loaded();
				assert.match(await pagination.innerText(), /dari 500 tamu/);
				await page.getByRole('button', { name: 'Filter status tamu', exact: true }).click();
				await page.getByRole('option', { name: 'Semua status', exact: true }).click();
				await loaded();
				console.log(
					`Guest performance: ${body.items.length}/1000 rows fetched, ${await actions.count()} action buttons; one list rendered.`
				);
			}
		);
		await check(
			'guest pagination recovers from network failure and discards stale searches',
			async () => {
				let fail = true;
				const failure = async (route) => {
					if (fail) {
						fail = false;
						await route.abort('failed');
					} else await route.continue();
				};
				await page.route(guestRoute, failure);
				await pagination.getByRole('button', { name: 'Berikutnya' }).click();
				await page.getByRole('alert').filter({ hasText: 'Tidak dapat terhubung' }).waitFor();
				await page.getByRole('button', { name: 'Coba lagi', exact: true }).click();
				await loaded();
				assert.equal(await actions.count(), 50);
				await page.unroute(guestRoute, failure);
				let release, seen;
				const waiting = new Promise((resolve) => {
					seen = resolve;
				});
				const gate = new Promise((resolve) => {
					release = resolve;
				});
				const slow = async (route) => {
					if (new URL(route.request().url()).searchParams.get('filter').includes('0001')) {
						const response = await route.fetch();
						seen();
						await gate;
						await route.fulfill({ response }).catch(() => {});
					} else await route.continue();
				};
				await page.route(guestRoute, slow);
				let timer;
				try {
					await search.fill('0001');
					await Promise.race([
						waiting,
						new Promise((_, reject) => {
							timer = setTimeout(
								() => reject(new Error('Slow-search request did not arrive')),
								10000
							);
						})
					]);
					await searchFor('0999');
					release();
					await page.waitForLoadState('networkidle');
					assert.equal(await actions.count(), 1);
					assert.match(await page.locator('tbody').innerText(), /0999/);
					assert.doesNotMatch(await page.locator('tbody').innerText(), /0001/);
				} finally {
					clearTimeout(timer);
					release();
					await page.unroute(guestRoute, slow);
				}
			}
		);
		await check('CSV duplicate detection includes guests outside the current page', async () => {
			await searchFor('');
			await page.getByRole('button', { name: 'Tamu', exact: true }).click();
			await loaded();
			await page.getByRole('button', { name: 'Impor CSV', exact: true }).click();
			const dialog = page.locator('dialog[open]');
			await dialog.locator('input[type=file]').setInputFiles({
				name: 'duplicates.csv',
				mimeType: 'text/csv',
				buffer: Buffer.from('nama,whatsapp\nDuplicate,085700000999\nNew Csv Guest,085799999999\n')
			});
			await dialog.getByText('Nomor sudah ada di daftar tamu.', { exact: true }).waitFor();
			await dialog.getByRole('button', { name: 'Impor 1 tamu', exact: true }).click();
			await dialog.waitFor({ state: 'hidden' });
			await loaded();
			const existing = await owner.collection('guests').getList(1, 1, {
				filter: 'whatsapp = "+6285700000999"'
			});
			assert.equal(existing.totalItems, 1);
			assert.match(await pagination.innerText(), /dari 1001 tamu/);
		});
		await check('deleting the last guest on a page returns to the previous page', async () => {
			// A 51-row subset creates a 1-row final page without changing page size.
			const batch = pb.createBatch();
			for (let i = 0; i < 50; i++)
				batch.collection('guests').create({
					wedding,
					name: `Boundary Guest ${i}`,
					whatsapp: `+62858${String(i).padStart(8, '0')}`,
					rsvp_status: 'pending',
					guest_count: 1,
					rsvp_token: randomBytes(6).toString('hex')
				});
			await batch.send();
			await pb.collection('guests').create({
				wedding,
				name: 'Boundary Guest Z',
				whatsapp: '+6285899999999',
				rsvp_status: 'pending',
				guest_count: 1,
				rsvp_token: randomBytes(6).toString('hex')
			});
			await searchFor('Boundary Guest');
			await pagination.getByRole('button', { name: 'Berikutnya' }).click();
			await loaded();
			assert.equal(await actions.count(), 1);
			await actions.first().click();
			await page.getByRole('menuitem', { name: 'Hapus', exact: true }).click();
			await page
				.locator('dialog[open]')
				.getByRole('button', { name: 'Hapus', exact: true })
				.click();
			await page.locator('dialog[open]').waitFor({ state: 'hidden' });
			await loaded();
			assert.match(await pagination.innerText(), /Halaman 1 dari 1/);
			assert.equal(await actions.count(), 50);
		});
		await check(
			'guest create/edit refresh paginated results and preserve failed form input',
			async () => {
				await page.getByRole('button', { name: 'Tambah tamu', exact: true }).click();
				const dialog = page.locator('dialog[open]');
				await dialog.getByLabel('Nama tamu').fill('Boundary Added Guest');
				await dialog.getByLabel('Nomor WhatsApp').fill('085788888888');
				const failSave = (route) =>
					route.request().method() === 'POST' ? route.abort('failed') : route.continue();
				await page.route('**/api/collections/guests/records*', failSave);
				await dialog.getByRole('button', { name: 'Tambah tamu', exact: true }).click();
				await dialog.getByRole('alert').filter({ hasText: 'Tidak dapat terhubung' }).waitFor();
				assert.equal(await dialog.getByLabel('Nama tamu').inputValue(), 'Boundary Added Guest');
				await page.unroute('**/api/collections/guests/records*', failSave);
				await dialog.getByRole('button', { name: 'Tambah tamu', exact: true }).click();
				await dialog.waitFor({ state: 'hidden' });
				await loaded();
				await searchFor('Boundary Added Guest');
				assert.equal(await actions.count(), 1);
				await actions.first().click();
				await search.evaluate((input) => input.dispatchEvent(new Event('scroll')));
				await page.getByRole('menuitem', { name: 'Sunting', exact: true }).waitFor();
				await page.evaluate(() => window.dispatchEvent(new Event('scroll')));
				await page.getByRole('menu', { name: /Aksi untuk/ }).waitFor({ state: 'hidden' });
				await actions.first().click();
				await page.getByRole('menuitem', { name: 'Sunting', exact: true }).click();
				await dialog.getByLabel('Nama tamu').fill('Boundary Edited Guest');
				await dialog.getByRole('button', { name: 'Simpan perubahan', exact: true }).click();
				await dialog.waitFor({ state: 'hidden' });
				await loaded();
				assert.equal(await actions.count(), 0);
				await searchFor('Boundary Edited Guest');
				assert.equal(await actions.count(), 1);
				const saved = await owner.collection('guests').getList(1, 1, {
					filter: 'whatsapp = "+6285788888888"'
				});
				assert.equal(saved.totalItems, 1);
				assert.equal(saved.items[0].name, 'Boundary Edited Guest');
			}
		);
		await check(
			'payment UI polls DB only and keeps elapsed invoices locked until confirmation',
			async () => {
				const calls = [];
				let paid = false;
				const route = async (request) => {
					calls.push(new URL(request.request().url()));
					await request.fulfill({
						json: {
							plan_tier: paid ? 'pro' : 'free',
							environment: 'sandbox',
							server_time: new Date().toISOString(),
							payment: {
								id: 'auditpayment001',
								status: paid ? 'paid' : 'pending',
								amount: 50000,
								original_amount: 50000,
								discount_amount: 0,
								coupon_code: '',
								currency: 'IDR',
								expires_at: '2020-01-01T00:00:00.000Z',
								order_id: 'AUDIT-TEST',
								method: 'BC',
								method_name: 'BCA Virtual Account',
								kind: 'va',
								fee: 3500,
								total: 53500,
								va_number: '7007014001444348',
								qr_string: '',
								checkout_url: ''
							}
						}
					});
				};
				await page.route('**/api/wedez/payments/status*', route);
				await page.goto(web + '/payment');
				await page.getByText('Waktu pembayaran telah habis.', { exact: true }).waitFor();
				assert.equal(await page.getByText('7007014001444348', { exact: true }).count(), 0);
				assert.equal(calls.length, 1);
				assert.equal(calls[0].search, '');
				await page.waitForResponse((res) => res.url().includes('/payments/status?refresh=false'), {
					timeout: 12000
				});
				assert.equal(calls[1].searchParams.get('refresh'), 'false');
				assert.equal(
					await page.getByRole('heading', { name: 'Metode pembayaran', exact: true }).count(),
					0
				);
				paid = true;
				await page
					.getByRole('button', { name: 'Saya sudah bayar, cek status', exact: true })
					.click();
				await page.getByRole('heading', { name: 'Yeay, Pro sudah aktif!', exact: true }).waitFor();
				assert.equal(calls.at(-1).search, '');
				await page.unroute('**/api/wedez/payments/status*', route);
			}
		);
	} finally {
		await context.close();
	}
}
