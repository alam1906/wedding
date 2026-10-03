import assert from 'node:assert/strict';
import PocketBase from '../../apps/web/node_modules/pocketbase/dist/pocketbase.es.mjs';

// Called by the isolated quality runner, using real PocketBase records and built UI.
export async function testLogicRegressions({
	browser,
	pb,
	fixture,
	web,
	invitation,
	check,
	jsErrors
}) {
	let sequence = 0;
	async function newUser(verified = false) {
		const email = `logic-${Date.now()}-${++sequence}@example.test`;
		await pb.collection('users').create({
			email,
			password: fixture.password,
			passwordConfirm: fixture.password,
			name: 'Logic Regression',
			verified
		});
		const client = new PocketBase(fixture.base);
		return client.collection('users').authWithPassword(email, fixture.password);
	}
	async function newPage(auth, options = {}) {
		const context = await browser.newContext({ reducedMotion: 'reduce', ...options });
		const page = await context.newPage();
		page.setDefaultTimeout(10000);
		page.on('pageerror', (error) => jsErrors.push(error.message));
		await page.goto(web);
		await page.waitForLoadState('networkidle');
		await page.evaluate((value) => localStorage.setItem('wedez_auth', JSON.stringify(value)), auth);
		return page;
	}
	async function storedAuth(page) {
		return page.evaluate(() => JSON.parse(localStorage.getItem('wedez_auth')));
	}
	async function loginOtherTab(page, auth) {
		const other = await page.context().newPage();
		await other.goto(web);
		// Clearing the persisted session broadcasts the same storage event as logout.
		await other.evaluate(() => localStorage.removeItem('wedez_auth'));
		await other.goto(web + '/login');
		await other.waitForLoadState('networkidle');
		await other.getByLabel('Email', { exact: true }).fill(auth.record.email);
		await other.getByLabel('Kata sandi', { exact: true }).fill(fixture.password);
		await other.getByRole('button', { name: 'Masuk', exact: true }).click();
		await other.waitForURL('**/start');
		await page.waitForFunction(
			(id) => JSON.parse(localStorage.getItem('wedez_auth'))?.record.id === id,
			auth.record.id
		);
	}
	function gate() {
		let resolve;
		const promise = new Promise((done) => {
			resolve = done;
		});
		return {
			promise,
			resolve,
			async wait() {
				let timer;
				try {
					await Promise.race([
						promise,
						new Promise((_, reject) => {
							timer = setTimeout(
								() => reject(new Error('Expected request did not complete')),
								10000
							);
						})
					]);
				} finally {
					clearTimeout(timer);
				}
			}
		};
	}

	await check(
		'Selected theme persists after its radio is hidden by a category filter',
		async () => {
			const page = await newPage(fixture.owner);
			const original = await pb.collection('weddings').getOne(fixture.wedding);
			try {
				await page.goto(web + '/user/data');
				await page.waitForLoadState('networkidle');
				await page
					.getByRole('button')
					.filter({ has: page.getByRole('heading', { name: 'Tema', exact: true }) })
					.click();
				await page.getByRole('button', { name: 'Playful', exact: true }).click();
				await page
					.locator('label')
					.filter({ has: page.locator('input[name=theme][value=playful-1]') })
					.click();
				assert.ok(await page.locator('input[value=playful-1]').isChecked());
				await page.getByRole('button', { name: 'Neobrutalism', exact: true }).click();
				assert.equal(await page.locator('input[value=playful-1]').count(), 0);
				await page.getByRole('button', { name: 'Simpan perubahan', exact: true }).click();
				await page.getByText('Tema berhasil disimpan.', { exact: true }).waitFor();
				assert.equal((await pb.collection('weddings').getOne(fixture.wedding)).theme, 'playful-1');
				await page.reload();
				await page.waitForLoadState('networkidle');
				await page
					.getByRole('button')
					.filter({ has: page.getByRole('heading', { name: 'Tema', exact: true }) })
					.click();
				await page.getByRole('button', { name: 'Playful', exact: true }).click();
				assert.ok(await page.locator('input[value=playful-1]').isChecked());
			} finally {
				await page.context().close();
				await pb.collection('weddings').update(fixture.wedding, { theme: original.theme });
			}
		}
	);

	await check(
		'Verification recovers when the email was verified before reopening the page',
		async () => {
			const auth = await newUser();
			await pb.collection('users').update(auth.record.id, { verified: true });
			const page = await newPage(auth);
			try {
				await page.goto(web + '/verification');
				await page.waitForURL('**/start');
				assert.equal((await storedAuth(page)).record.verified, true);
			} finally {
				await page.context().close();
			}
		}
	);

	await check(
		'Verification recovers on focus without realtime and coalesces repeated events',
		async () => {
			const auth = await newUser();
			const page = await newPage(auth);
			const held = gate(),
				seen = gate();
			try {
				await page.route('**/api/realtime*', (route) => route.abort());
				await page.goto(web + '/verification');
				await page.waitForLoadState('networkidle');
				await page.getByText('Cek email Anda', { exact: true }).waitFor();
				await pb.collection('users').update(auth.record.id, { verified: true });
				let requests = 0;
				await page.route('**/api/collections/users/auth-refresh', async (route) => {
					requests++;
					const response = await route.fetch();
					seen.resolve();
					await held.promise;
					await route.fulfill({ response });
				});
				await page.evaluate(() => {
					for (let i = 0; i < 5; i++) {
						window.dispatchEvent(new Event('focus'));
						window.dispatchEvent(new Event('online'));
						document.dispatchEvent(new Event('visibilitychange'));
					}
				});
				await seen.wait();
				// Only one verification refresh may run while its response is held.
				// Navigating to /start subsequently performs its own account-guard refresh.
				assert.equal(requests, 1);
				held.resolve();
				await page.waitForURL('**/start');
				assert.equal((await storedAuth(page)).record.verified, true);
			} finally {
				held.resolve();
				await page.context().close();
			}
		}
	);

	await check(
		'Connected verification still advances on a real PocketBase realtime update',
		async () => {
			const auth = await newUser();
			const page = await newPage(auth);
			try {
				const subscribed = page.waitForResponse(
					(response) =>
						response.url().endsWith('/api/realtime') && response.request().method() === 'POST'
				);
				await page.goto(web + '/verification');
				assert.equal((await subscribed).status(), 204);
				await page.waitForLoadState('networkidle');
				await page.getByText('Cek email Anda', { exact: true }).waitFor();
				assert.equal((await storedAuth(page)).record.verified, false);
				await pb.collection('users').update(auth.record.id, { verified: true });
				await page.waitForURL('**/start');
				assert.equal((await storedAuth(page)).record.verified, true);
			} finally {
				await page.context().close();
			}
		}
	);

	await check('Verification retries after an initial network failure', async () => {
		const auth = await newUser();
		await pb.collection('users').update(auth.record.id, { verified: true });
		const page = await newPage(auth);
		try {
			await page.route('**/api/realtime*', (route) => route.abort());
			await page.route('**/api/collections/users/auth-refresh', (route) =>
				route.fulfill({ status: 503, json: { message: 'Synthetic outage' } })
			);
			await page.goto(web + '/verification');
			await page
				.getByText('Status akun gagal diperbarui. Silakan masuk kembali.', { exact: true })
				.waitFor();
			assert.equal((await storedAuth(page)).record.verified, false);
			await page.unroute('**/api/collections/users/auth-refresh');
			await page.evaluate(() => window.dispatchEvent(new Event('online')));
			await page.waitForURL('**/start');
			assert.equal((await storedAuth(page)).record.verified, true);
		} finally {
			await page.context().close();
		}
	});

	await check(
		'A late verification refresh cannot replace a different account session',
		async () => {
			const auth = await newUser(),
				other = await newUser(true);
			await pb.collection('users').update(auth.record.id, { verified: true });
			const page = await newPage(auth);
			const held = gate(),
				seen = gate(),
				completed = gate();
			try {
				await page.route('**/api/realtime*', (route) => route.abort());
				await page.route('**/api/collections/users/auth-refresh', async (route) => {
					const response = await route.fetch();
					seen.resolve();
					await held.promise;
					await route.fulfill({ response });
					completed.resolve();
				});
				await page.goto(web + '/verification');
				await seen.wait();
				await loginOtherTab(page, other);
				held.resolve();
				await completed.wait();
				await page
					.getByText('Sesi akun berubah. Silakan muat ulang halaman.', { exact: true })
					.waitFor();
				const stored = await storedAuth(page);
				assert.equal(stored.record.id, other.record.id);
				assert.equal(
					JSON.parse(Buffer.from(stored.token.split('.')[1], 'base64url')).id,
					other.record.id
				);
				assert.equal(new URL(page.url()).pathname, '/verification');
			} finally {
				held.resolve();
				await page.context().close();
			}
		}
	);

	await check(
		'Leaving verification aborts a pending refresh without later navigation',
		async () => {
			const auth = await newUser();
			await pb.collection('users').update(auth.record.id, { verified: true });
			const page = await newPage(auth);
			const held = gate(),
				seen = gate();
			try {
				await page.route('**/api/realtime*', (route) => route.abort());
				await page.route('**/api/collections/users/auth-refresh', async (route) => {
					const response = await route.fetch();
					seen.resolve();
					await held.promise;
					await route.fulfill({ response });
				});
				await page.goto(web + '/verification');
				await seen.wait();
				// Use an internal link for a SvelteKit navigation (not a document reload).
				await page.evaluate(() => {
					const link = document.createElement('a');
					link.href = '/tema';
					link.textContent = 'Leave verification';
					document.body.append(link);
				});
				await page.getByRole('link', { name: 'Leave verification' }).click();
				await page.waitForURL('**/tema');
				held.resolve();
				await page.unrouteAll({ behavior: 'wait' });
				await page.waitForLoadState('networkidle');
				assert.equal(new URL(page.url()).pathname, '/tema');
				assert.equal((await storedAuth(page)).record.verified, false);
				assert.equal(
					await page.getByText('Email berhasil diverifikasi.', { exact: true }).count(),
					0
				);
			} finally {
				held.resolve();
				await page.context().close();
			}
		}
	);

	await check('A late area switch preserves the new account and does not navigate', async () => {
		const other = await newUser(true);
		const page = await newPage(fixture.owner);
		const held = gate(),
			seen = gate();
		const original = await pb.collection('users').getOne(fixture.owner.record.id);
		try {
			await page.goto(web + '/user/dashboard');
			await page.waitForLoadState('networkidle');
			await page.route(
				`**/api/collections/users/records/${fixture.owner.record.id}`,
				async (route) => {
					if (route.request().method() !== 'PATCH') return route.continue();
					const response = await route.fetch();
					seen.resolve();
					await held.promise;
					await route.fulfill({ response });
				}
			);
			await page.getByRole('button', { name: 'Buka menu profil' }).click();
			await page.getByRole('menuitem', { name: /Beralih ke Affiliate|Gabung Affiliate/ }).click();
			await seen.wait();
			await loginOtherTab(page, other);
			held.resolve();
			await page
				.getByText('Gagal beralih ke Affiliate. Silakan coba lagi.', { exact: true })
				.waitFor();
			const stored = await storedAuth(page);
			assert.equal(stored.record.id, other.record.id);
			assert.equal(
				JSON.parse(Buffer.from(stored.token.split('.')[1], 'base64url')).id,
				other.record.id
			);
			assert.equal(new URL(page.url()).pathname, '/user/dashboard');
		} finally {
			held.resolve();
			await page.context().close();
			await pb.collection('users').update(original.id, { home_area: original.home_area });
		}
	});

	await check(
		'Event times and Edition calendars render consistently in four browser timezones',
		async () => {
			const original = await pb.collection('weddings').getOne(fixture.wedding);
			try {
				for (const theme of ['nocturne', 'safira']) {
					await pb.collection('weddings').update(fixture.wedding, {
						theme,
						akad: '2026-10-10 03:00:00.000Z',
						reception: '2026-12-31 18:00:00.000Z'
					});
					for (const timezoneId of ['Asia/Jakarta', 'Asia/Makassar', 'UTC', 'America/New_York']) {
						const context = await browser.newContext({ timezoneId, reducedMotion: 'reduce' });
						try {
							const page = await context.newPage();
							page.on('pageerror', (error) => jsErrors.push(error.message));
							await page.goto(invitation + '/?slug=' + original.slug);
							await page
								.getByRole('button', { name: /Buka Undangan/i })
								.first()
								.click();
							await page.getByText('10.00 WIB', { exact: true }).first().waitFor();
							await page.getByText('01.00 WIB', { exact: true }).first().waitFor();
							if (theme === 'safira') {
								await page.getByText('Januari 2027', { exact: true }).first().waitFor();
								await page.getByText('Jumat', { exact: true }).first().waitFor();
							} else
								await page.getByText('Jumat, 1 Januari 2027', { exact: true }).first().waitFor();
						} finally {
							await context.close();
						}
					}
				}
			} finally {
				await pb.collection('weddings').update(original.id, {
					theme: original.theme,
					akad: original.akad,
					reception: original.reception
				});
			}
		}
	);
}
