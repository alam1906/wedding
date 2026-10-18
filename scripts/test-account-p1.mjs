// Isolated P1 regression tests. Never opens the project's pb_data or contacts a real gateway.
// Run: bun scripts/test-account-p1.mjs
// Optional UI tests: WEDEZ_TEST_BROWSER=1 PLAYWRIGHT_MODULE=/path/to/playwright/index.mjs
//                   PLAYWRIGHT_CHROMIUM_EXECUTABLE=/path/to/chromium bun scripts/test-account-p1.mjs
// Add WEDEZ_TEST_PREVIEW=1 to run the UI suite against a production build.
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { once } from 'node:events';
import { cp, mkdtemp, writeFile, access } from 'node:fs/promises';
import { createServer as createSmtpServer } from 'node:net';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const temp = await mkdtemp(path.join(tmpdir(), 'wedez-account-p1-'));
const port = Number(process.env.WEDEZ_TEST_PORT || 8193);
const webPort = Number(process.env.WEDEZ_TEST_WEB_PORT || 5193);
assert.ok(Number.isInteger(port) && port > 1024 && port < 65536);
assert.ok(Number.isInteger(webPort) && webPort > 1024 && webPort < 65536);
const base = `http://127.0.0.1:${port}`;
const appUrl = `http://127.0.0.1:${webPort}`;
const password = 'Account-QA-Only-9876';
const newPassword = 'Updated-QA-Only-5432';
const apiKey = 'fake-account-qa-gateway-key';
const messages = [];
const results = [];
const children = [];
let admin = '';
let serial = 0;
let logs = '';
let browser;

// A local, non-delivering SMTP sink makes password reset email tests self-contained.
const smtp = createSmtpServer((socket) => {
	let buffer = '';
	let content = '';
	let inData = false;
	let recipients = [];
	socket.setEncoding('utf8');
	socket.write('220 QA SMTP ready\r\n');
	socket.on('data', (chunk) => {
		buffer += chunk;
		let end;
		while ((end = buffer.indexOf('\r\n')) >= 0) {
			const line = buffer.slice(0, end);
			buffer = buffer.slice(end + 2);
			if (inData) {
				if (line === '.') {
					messages.push({ recipients: [...recipients], raw: content });
					inData = false;
					content = '';
					socket.write('250 Captured locally\r\n');
				} else content += line.replace(/^\.\./, '.') + '\r\n';
			} else if (/^(EHLO|HELO) /i.test(line)) socket.write('250 QA SMTP\r\n');
			else if (/^MAIL FROM:/i.test(line)) {
				recipients = [];
				socket.write('250 OK\r\n');
			} else if (/^RCPT TO:/i.test(line)) {
				recipients.push(line.slice(8).trim().replace(/^<|>$/g, ''));
				socket.write('250 OK\r\n');
			} else if (/^DATA$/i.test(line)) {
				inData = true;
				socket.write('354 End with dot\r\n');
			} else if (/^QUIT$/i.test(line)) socket.end('221 Bye\r\n');
			else socket.write('250 OK\r\n');
		}
	});
	socket.on('error', () => {});
});

async function waitUntil(predicate, label, timeout = 10000) {
	const deadline = Date.now() + timeout;
	while (Date.now() < deadline) {
		if (await predicate()) return;
		await new Promise((resolve) => setTimeout(resolve, 50));
	}
	throw new Error(`Timeout: ${label}`);
}
async function request(
	route,
	{ token = admin, method = 'GET', body, status = 200, headers = {} } = {}
) {
	const multipart = body instanceof FormData;
	const response = await fetch(base + route, {
		method,
		headers: {
			...(!multipart ? { 'Content-Type': 'application/json' } : {}),
			...(token ? { Authorization: token } : {}),
			...headers
		},
		body: multipart ? body : body === undefined ? undefined : JSON.stringify(body)
	});
	const text = await response.text();
	const data = text ? JSON.parse(text) : null;
	if (status !== null)
		assert.equal(response.status, status, `${method} ${route}: ${JSON.stringify(data)}`);
	return { status: response.status, data, headers: response.headers };
}
async function check(label, fn) {
	await fn();
	results.push({ label, passed: true });
	console.log(`PASS ${label}`);
}
async function createUser(label, { wedding = true } = {}) {
	const email = `${label}-${++serial}@example.test`;
	const record = (
		await request('/api/collections/users/records', {
			method: 'POST',
			body: { email, password, passwordConfirm: password, name: label, verified: true }
		})
	).data;
	const auth = (
		await request('/api/collections/users/auth-with-password', {
			token: '',
			method: 'POST',
			body: { identity: email, password }
		})
	).data;
	const user = { id: record.id, email, token: auth.token, record: auth.record };
	if (wedding) {
		user.wedding = (
			await request('/api/wedez/account/provision', { token: user.token, method: 'POST' })
		).data.wedding_id;
		user.record = (await request(`/api/collections/users/records/${user.id}`)).data;
	}
	return user;
}
async function get(collection, id) {
	return (await request(`/api/collections/${collection}/records/${id}`)).data;
}
async function records(collection, filter) {
	return (
		await request(
			`/api/collections/${collection}/records?perPage=100&filter=${encodeURIComponent(filter || '')}`
		)
	).data.items;
}
async function deleteAccount(user, confirmation = 'HAPUS', status = 200, extra = {}) {
	return request('/api/wedez/account', {
		token: user.token,
		method: 'DELETE',
		body: { confirmation, ...extra },
		status
	});
}
async function createPayment(user, status = 'paid', affiliate = '') {
	return (
		await request('/api/collections/payments/records', {
			method: 'POST',
			body: {
				wedding: user.wedding,
				provider: 'duitku',
				provider_transaction_id: `QA${++serial}`,
				currency: 'IDR',
				amount: affiliate ? 45000 : 50000,
				original_amount: 50000,
				status,
				affiliate,
				commission_amount: affiliate ? 9000 : 0,
				paid_at: status === 'paid' ? new Date().toISOString() : ''
			}
		})
	).data;
}
async function callback(payment) {
	return request('/api/wedez/payments/duitku/callback', {
		token: '',
		method: 'POST',
		body: {
			merchantCode: 'TEST',
			merchantOrderId: payment.provider_transaction_id,
			amount: String(payment.amount),
			resultCode: '00',
			reference: `QA-${payment.id}`,
			signature: createHmac('sha256', apiKey)
				.update('TEST' + payment.amount + payment.provider_transaction_id)
				.digest('hex')
		}
	});
}
async function enroll(user) {
	const affiliate = (
		await request('/api/wedez/affiliate/enroll', { token: user.token, method: 'POST' })
	).data;
	return (
		await request(`/api/collections/affiliates/records/${affiliate.id}`, {
			method: 'PATCH',
			body: { status: 'active' }
		})
	).data;
}
async function addPersonalData(user) {
	const guest = (
		await request('/api/collections/guests/records', {
			method: 'POST',
			body: {
				wedding: user.wedding,
				name: 'Tamu QA',
				guest_count: 1,
				whatsapp: '+628123456789',
				rsvp_status: 'attending',
				rsvp_token: `qa${serial}token`
			}
		})
	).data;
	const story = (
		await request('/api/collections/wedding_stories/records', {
			method: 'POST',
			body: {
				wedding: user.wedding,
				title: 'Cerita QA',
				content: 'Hanya data pengujian',
				sort_order: 1
			}
		})
	).data;
	const form = new FormData();
	const png = Buffer.from(
		'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jx1cAAAAASUVORK5CYII=',
		'base64'
	);
	form.append('cover', new Blob([png], { type: 'image/png' }), 'qa-cover.png');
	const response = await fetch(`${base}/api/collections/weddings/records/${user.wedding}`, {
		method: 'PATCH',
		headers: { Authorization: admin },
		body: form
	});
	assert.equal(response.status, 200, await response.clone().text());
	const wedding = await response.json();
	const fileUrl = `${base}/api/files/${wedding.collectionId}/${wedding.id}/${wedding.cover}`;
	assert.equal((await fetch(fileUrl)).status, 200);
	return {
		guest,
		story,
		wedding,
		fileUrl,
		filePath: path.join(temp, 'data/storage', wedding.collectionId, wedding.id, wedding.cover)
	};
}
async function assertDeleted(user, personal) {
	await request(`/api/collections/users/records/${user.id}`, { status: 404 });
	if (user.wedding)
		await request(`/api/collections/weddings/records/${user.wedding}`, { status: 404 });
	await request('/api/collections/users/auth-refresh', {
		token: user.token,
		method: 'POST',
		status: 401
	});
	await request('/api/collections/users/auth-with-password', {
		token: '',
		method: 'POST',
		body: { identity: user.email, password },
		status: 400
	});
	if (personal) {
		await request(`/api/collections/guests/records/${personal.guest.id}`, { status: 404 });
		await request(`/api/collections/wedding_stories/records/${personal.story.id}`, { status: 404 });
		assert.equal((await fetch(personal.fileUrl)).status, 404);
		await waitUntil(async () => {
			try {
				await access(personal.filePath);
				return false;
			} catch {
				return true;
			}
		}, 'deleted cover file removed from disk');
	}
}
function decodedMessage(raw) {
	return raw
		.replace(/=\r?\n/g, '')
		.replace(/=([0-9A-F]{2})/gi, (_, hex) => String.fromCharCode(Number.parseInt(hex, 16)));
}
async function resetLink(user) {
	let message;
	await waitUntil(() => {
		message = messages.findLast(
			(item) =>
				item.recipients.includes(user.email) &&
				decodedMessage(item.raw).includes('/reset-password#token=')
		);
		return Boolean(message);
	}, 'password reset email');
	const link = decodedMessage(message.raw).match(
		/http:\/\/127\.0\.0\.1:\d+\/reset-password#token=[A-Za-z0-9._%-]+/
	)?.[0];
	assert.ok(link, 'reset email contains the Wedez reset URL');
	return link;
}
async function requestReset(user) {
	await request('/api/collections/users/request-password-reset', {
		token: '',
		method: 'POST',
		body: { email: user.email },
		status: 204
	});
	return resetLink(user);
}

try {
	// Never attach to a pre-existing listener, even if it appears to be a QA server.
	for (const testPort of [port, ...(process.env.WEDEZ_TEST_BROWSER ? [webPort] : [])]) {
		const reservation = createSmtpServer();
		reservation.listen(testPort, '127.0.0.1');
		await once(reservation, 'listening');
		await new Promise((resolve) => reservation.close(resolve));
	}
	smtp.listen(0, '127.0.0.1');
	await once(smtp, 'listening');
	await cp(path.join(root, 'pocketbase/pb_hooks'), path.join(temp, 'hooks'), { recursive: true });
	await cp(path.join(root, 'pocketbase/pb_migrations'), path.join(temp, 'migrations'), {
		recursive: true
	});
	// Test-only fault injection validates rollback without changing application hooks.
	await writeFile(
		path.join(temp, 'hooks/qa_failure.pb.js'),
		"onRecordDelete(function(e) { if (e.record.getString('name') === 'qa-rollback') throw new ApiError(500, 'QA rollback injection'); e.next(); }, 'users');\n"
	);
	const binary = path.join(root, 'pocketbase/pocketbase');
	const args = [
		`--dir=${temp}/data`,
		`--hooksDir=${temp}/hooks`,
		`--migrationsDir=${temp}/migrations`
	];
	const env = {
		...process.env,
		WEDEZ_APP_URL: appUrl,
		DUITKU_ENV: 'sandbox',
		DUITKU_MERCHANT_CODE: 'TEST',
		DUITKU_API_KEY: apiKey,
		WEDEZ_PRO_PRICE: '50000',
		DUITKU_CALLBACK_URL: 'https://example.test/callback',
		DUITKU_RETURN_URL: `${appUrl}/payment`
	};
	const setup = spawnSync(
		binary,
		['superuser', 'upsert', 'account-qa-admin@example.test', password, ...args],
		{ env, encoding: 'utf8' }
	);
	assert.equal(setup.status, 0, setup.stdout + setup.stderr);
	const server = spawn(binary, ['serve', `--http=127.0.0.1:${port}`, ...args], {
		env,
		stdio: ['ignore', 'pipe', 'pipe']
	});
	children.push(server);
	server.stdout.on('data', (chunk) => {
		logs += chunk;
	});
	server.stderr.on('data', (chunk) => {
		logs += chunk;
	});
	await waitUntil(async () => {
		if (server.exitCode !== null) throw new Error(logs);
		if (!logs.includes(`Server started at ${base}`)) return false;
		try {
			return (await fetch(base + '/api/health')).ok;
		} catch {
			return false;
		}
	}, 'isolated PocketBase startup');
	admin = (
		await request('/api/collections/_superusers/auth-with-password', {
			token: '',
			method: 'POST',
			body: { identity: 'account-qa-admin@example.test', password }
		})
	).data.token;
	const settings = (await request('/api/settings')).data;
	await request('/api/settings', {
		method: 'PATCH',
		body: {
			meta: {
				...settings.meta,
				appURL: base,
				senderName: 'Wedez QA',
				senderAddress: 'qa@example.test'
			},
			smtp: {
				enabled: true,
				host: '127.0.0.1',
				port: smtp.address().port,
				username: '',
				password: '',
				tls: false,
				authMethod: 'PLAIN'
			},
			rateLimits: { ...settings.rateLimits, enabled: false }
		}
	});

	await check('account deletion requires users auth and exact HAPUS confirmation', async () => {
		await request('/api/wedez/account', {
			token: '',
			method: 'DELETE',
			body: { confirmation: 'HAPUS' },
			status: 401
		});
		await request('/api/wedez/account', {
			token: admin,
			method: 'DELETE',
			body: { confirmation: 'HAPUS' },
			status: 403
		});
		const user = await createUser('confirmation');
		for (const confirmation of ['', 'hapus', ' HAPUS', 'HAPUS '])
			await deleteAccount(user, confirmation, 400);
		assert.equal((await get('users', user.id)).email, user.email);
		await request(`/api/collections/users/records/${user.id}`, {
			token: user.token,
			method: 'DELETE',
			status: 403
		});
	});
	await check('free account, guests, stories, files and old sessions are deleted', async () => {
		const user = await createUser('free-delete');
		const personal = await addPersonalData(user);
		const response = await deleteAccount(user);
		assert.deepEqual(response.data, { success: true });
		assert.equal(response.headers.get('cache-control'), 'no-store');
		await assertDeleted(user, personal);
	});
	await check(
		'client-selected IDs and mutable wedding_id cannot delete another account',
		async () => {
			const victim = await createUser('victim');
			const victimData = await addPersonalData(victim);
			const attacker = await createUser('attacker');
			await request(`/api/collections/users/records/${attacker.id}`, {
				method: 'PATCH',
				body: { wedding_id: victim.wedding }
			});
			await deleteAccount(attacker, 'HAPUS', 200, { userId: victim.id, weddingId: victim.wedding });
			await assertDeleted(attacker);
			assert.equal((await get('users', victim.id)).email, victim.email);
			await get('weddings', victim.wedding);
			await get('guests', victimData.guest.id);
			assert.equal((await fetch(victimData.fileUrl)).status, 200);
		}
	);
	await check('account without an invitation can be deleted', async () => {
		const user = await createUser('no-wedding', { wedding: false });
		await deleteAccount(user);
		await assertDeleted(user);
	});
	await check('pending payment blocks deletion without partial changes', async () => {
		const user = await createUser('pending-delete');
		const personal = await addPersonalData(user);
		const payment = await createPayment(user, 'pending');
		const response = await deleteAccount(user, 'HAPUS', 409);
		assert.match(response.data.message, /pembayaran/);
		await get('users', user.id);
		assert.equal((await get('payments', payment.id)).wedding, user.wedding);
		assert.equal((await fetch(personal.fileUrl)).status, 200);
	});
	await check('paid history survives deletion and repeated gateway callbacks', async () => {
		const user = await createUser('paid-delete');
		const personal = await addPersonalData(user);
		const payment = await createPayment(user);
		await request(`/api/collections/weddings/records/${user.wedding}`, {
			method: 'DELETE',
			status: 400
		});
		await deleteAccount(user);
		await assertDeleted(user, personal);
		const archived = await get('payments', payment.id);
		assert.equal(archived.wedding, '');
		assert.equal(archived.amount, payment.amount);
		assert.equal(archived.provider_transaction_id, payment.provider_transaction_id);
		assert.equal(archived.status, 'paid');
		await callback(payment);
		await callback(payment);
		assert.equal((await get('payments', payment.id)).status, 'paid');
		await request(`/api/collections/payments/records/${payment.id}`, { token: '', status: 404 });
		await request(`/api/collections/payments/records/${payment.id}`, {
			method: 'DELETE',
			status: 400
		});
	});
	await check(
		'available commissions and pending affiliate conversions block deletion',
		async () => {
			const affiliateUser = await createUser('unsettled-affiliate');
			const affiliate = await enroll(affiliateUser);
			const buyer = await createUser('unsettled-buyer');
			const payment = await createPayment(buyer, 'pending', affiliate.id);
			await deleteAccount(affiliateUser, 'HAPUS', 409);
			await callback(payment);
			assert.equal((await records('affiliate_commissions', `payment = '${payment.id}'`)).length, 1);
			await deleteAccount(affiliateUser, 'HAPUS', 409);
			assert.equal((await get('affiliates', affiliate.id)).user, affiliateUser.id);
		}
	);
	await check('settled affiliate payouts/commissions survive; old coupon is disabled', async () => {
		const affiliateUser = await createUser('settled-affiliate');
		const affiliate = await enroll(affiliateUser);
		const buyers = [];
		for (let i = 0; i < 6; i++) {
			const buyer = await createUser(`settled-buyer-${i}`);
			const payment = await createPayment(buyer, 'pending', affiliate.id);
			await callback(payment);
			buyers.push(payment);
		}
		await request('/api/wedez/affiliate/bank', {
			token: affiliateUser.token,
			method: 'PATCH',
			body: { bank_name: 'BCA', account_number: '0012345678', account_name: 'QA Affiliate' }
		});
		const payout = (
			await request('/api/wedez/affiliate/payouts', { token: affiliateUser.token, method: 'POST' })
		).data;
		await deleteAccount(affiliateUser, 'HAPUS', 409);
		await request(`/api/collections/affiliate_payouts/records/${payout.id}`, {
			method: 'PATCH',
			body: { status: 'processing' }
		});
		await deleteAccount(affiliateUser, 'HAPUS', 409);
		const transfer = new FormData();
		transfer.set('status', 'paid');
		transfer.set('transfer_reference', 'QA-NO-REAL-TRANSFER');
		transfer.set(
			'transfer_proof',
			new Blob(
				[
					Buffer.from(
						'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
						'base64'
					)
				],
				{ type: 'image/png' }
			),
			'qa-transfer.png'
		);
		await request(`/api/collections/affiliate_payouts/records/${payout.id}`, {
			method: 'PATCH',
			body: transfer
		});
		const commissions = await records('affiliate_commissions', `affiliate = '${affiliate.id}'`);
		const settledPayout = await get('affiliate_payouts', payout.id);
		assert.ok(settledPayout.transfer_proof.endsWith('.png'));
		await deleteAccount(affiliateUser);
		await assertDeleted(affiliateUser);
		assert.deepEqual(await get('affiliate_payouts', payout.id), settledPayout);
		const fileToken = (await request('/api/files/token', { method: 'POST' })).data.token;
		const proofUrl = `${base}/api/files/${settledPayout.collectionId}/${payout.id}/${settledPayout.transfer_proof}`;
		assert.equal((await fetch(`${proofUrl}?token=${encodeURIComponent(fileToken)}`)).status, 200);
		assert.deepEqual(
			await records('affiliate_commissions', `affiliate = '${affiliate.id}'`),
			commissions
		);
		const detached = await get('affiliates', affiliate.id);
		assert.equal(detached.user, '');
		assert.equal(detached.status, 'suspended');
		assert.equal(detached.account_number, '');
		await request(`/api/collections/affiliates/records/${affiliate.id}`, {
			method: 'PATCH',
			body: { status: 'active' },
			status: 400
		});
		for (const payment of buyers) await callback(payment);
		assert.equal(
			(await records('affiliate_commissions', `affiliate = '${affiliate.id}'`)).length,
			6
		);
	});
	await check('multiple deleted affiliate accounts do not collide on the user index', async () => {
		for (let i = 0; i < 2; i++) {
			const user = await createUser(`empty-affiliate-${i}`, { wedding: false });
			const affiliate = await enroll(user);
			await deleteAccount(user);
			await assertDeleted(user);
			assert.equal((await get('affiliates', affiliate.id)).user, '');
		}
	});
	await check(
		'late paid callbacks after deletion keep archived wedding groups separate',
		async () => {
			const affiliateUser = await createUser('late-affiliate', { wedding: false });
			const affiliate = await enroll(affiliateUser);
			for (let i = 0; i < 2; i++) {
				const buyer = await createUser(`late-buyer-${i}`);
				const earlier = await createPayment(buyer, 'expired', affiliate.id);
				const later = await createPayment(buyer, 'failed', affiliate.id);
				await deleteAccount(buyer);
				await assertDeleted(buyer);
				await callback(earlier);
				await callback(later);
				await callback(earlier);
				const commissions = await records(
					'affiliate_commissions',
					`payment = '${earlier.id}' || payment = '${later.id}'`
				);
				assert.equal(commissions.length, 1);
			}
			assert.equal(
				(await records('affiliate_commissions', `affiliate = '${affiliate.id}'`)).length,
				2
			);
		}
	);
	await check(
		'failure at user deletion rolls back records, financial links and files',
		async () => {
			const user = await createUser('qa-rollback');
			const personal = await addPersonalData(user);
			const payment = await createPayment(user);
			await deleteAccount(user, 'HAPUS', 500);
			assert.equal((await get('users', user.id)).wedding_id, user.wedding);
			await get('weddings', user.wedding);
			await get('guests', personal.guest.id);
			await get('wedding_stories', personal.story.id);
			assert.equal((await get('payments', payment.id)).wedding, user.wedding);
			assert.equal((await fetch(personal.fileUrl)).status, 200);
			await access(personal.filePath);
		}
	);
	await check(
		'password change rejects wrong current password, short password and mismatch',
		async () => {
			const user = await createUser('password-invalid');
			for (const body of [
				{ oldPassword: 'incorrect', password: newPassword, passwordConfirm: newPassword },
				{ oldPassword: password, password: 'short', passwordConfirm: 'short' },
				{ oldPassword: password, password: newPassword, passwordConfirm: 'mismatch' }
			])
				await request(`/api/collections/users/records/${user.id}`, {
					token: user.token,
					method: 'PATCH',
					body,
					status: 400
				});
			await request('/api/collections/users/auth-with-password', {
				token: '',
				method: 'POST',
				body: { identity: user.email, password }
			});
		}
	);
	await check(
		'password change revokes all old tokens and accepts only the new password',
		async () => {
			const user = await createUser('password-valid');
			const secondSession = (
				await request('/api/collections/users/auth-with-password', {
					token: '',
					method: 'POST',
					body: { identity: user.email, password }
				})
			).data.token;
			await request(`/api/collections/users/records/${user.id}`, {
				token: user.token,
				method: 'PATCH',
				body: { oldPassword: password, password: newPassword, passwordConfirm: newPassword }
			});
			for (const token of [user.token, secondSession])
				await request('/api/collections/users/auth-refresh', {
					token,
					method: 'POST',
					status: 401
				});
			await request('/api/collections/users/auth-with-password', {
				token: '',
				method: 'POST',
				body: { identity: user.email, password },
				status: 400
			});
			await request('/api/collections/users/auth-with-password', {
				token: '',
				method: 'POST',
				body: { identity: user.email, password: newPassword }
			});
		}
	);
	await check(
		'real SMTP reset link uses trusted Wedez URL; unknown email remains generic',
		async () => {
			const user = await createUser('reset-email');
			await request('/api/collections/users/request-password-reset', {
				token: '',
				method: 'POST',
				body: { email: user.email, redirectUrl: 'https://evil.example.test/' },
				headers: { Origin: 'https://evil.example.test' },
				status: 204
			});
			const link = await resetLink(user);
			assert.equal(new URL(link).origin, appUrl);
			assert.equal(new URL(link).search, '');
			assert.ok(!link.includes('/_/#/auth/'));
			await request('/api/collections/users/request-password-reset', {
				token: '',
				method: 'POST',
				body: { email: 'not-registered@example.test' },
				status: 204
			});
		}
	);
	await check(
		'password reset is single-use, validates password and revokes old sessions',
		async () => {
			const user = await createUser('reset-valid');
			const token = new URLSearchParams(new URL(await requestReset(user)).hash.slice(1)).get(
				'token'
			);
			for (const body of [
				{ token: 'invalid', password: newPassword, passwordConfirm: newPassword },
				{ token, password: 'short', passwordConfirm: 'short' },
				{ token, password: newPassword, passwordConfirm: 'mismatch' }
			])
				await request('/api/collections/users/confirm-password-reset', {
					token: '',
					method: 'POST',
					body,
					status: 400
				});
			await request('/api/collections/users/confirm-password-reset', {
				token: '',
				method: 'POST',
				body: { token, password: newPassword, passwordConfirm: newPassword },
				status: 204
			});
			await request('/api/collections/users/confirm-password-reset', {
				token: '',
				method: 'POST',
				body: { token, password: newPassword, passwordConfirm: newPassword },
				status: 400
			});
			await request('/api/collections/users/auth-refresh', {
				token: user.token,
				method: 'POST',
				status: 401
			});
			await request('/api/collections/users/auth-with-password', {
				token: '',
				method: 'POST',
				body: { identity: user.email, password },
				status: 400
			});
			await request('/api/collections/users/auth-with-password', {
				token: '',
				method: 'POST',
				body: { identity: user.email, password: newPassword }
			});
		}
	);
	await check('expired password reset token is rejected', async () => {
		await request('/api/collections/users', {
			method: 'PATCH',
			body: { passwordResetToken: { duration: 10 } }
		});
		try {
			const user = await createUser('reset-expired');
			const token = new URLSearchParams(new URL(await requestReset(user)).hash.slice(1)).get(
				'token'
			);
			await new Promise((resolve) => setTimeout(resolve, 11000));
			await request('/api/collections/users/confirm-password-reset', {
				token: '',
				method: 'POST',
				body: { token, password: newPassword, passwordConfirm: newPassword },
				status: 400
			});
		} finally {
			await request('/api/collections/users', {
				method: 'PATCH',
				body: { passwordResetToken: { duration: 1800 } }
			});
		}
	});
	await check(
		'concurrent deletion does not affect other accounts or return server errors',
		async () => {
			const user = await createUser('concurrent-delete');
			const responses = await Promise.all([
				deleteAccount(user, 'HAPUS', null),
				deleteAccount(user, 'HAPUS', null)
			]);
			assert.ok(responses.some((item) => item.status === 200));
			assert.ok(
				responses.every((item) => item.status === 200 || (item.status >= 400 && item.status < 500)),
				JSON.stringify(responses)
			);
			await assertDeleted(user);
		}
	);

	if (process.env.WEDEZ_TEST_BROWSER) {
		const webEnv = {
			...process.env,
			PUBLIC_POCKETBASE_URL: base,
			PUBLIC_WEDDING_URL: appUrl,
			PUBLIC_INVITATION_URL: appUrl
		};
		if (process.env.WEDEZ_TEST_PREVIEW) {
			const build = spawn('bun', ['run', '--cwd', 'apps/web', 'build'], {
				cwd: root,
				env: webEnv,
				stdio: ['ignore', 'pipe', 'pipe']
			});
			children.push(build);
			build.stdout.on('data', (chunk) => {
				logs += chunk;
			});
			build.stderr.on('data', (chunk) => {
				logs += chunk;
			});
			const [code] = await once(build, 'exit');
			assert.equal(code, 0, 'QA web production build failed; see server.log');
		}
		const vite = spawn(
			'bun',
			[
				'run',
				'--cwd',
				'apps/web',
				process.env.WEDEZ_TEST_PREVIEW ? 'preview' : 'dev',
				'--',
				'--host',
				'127.0.0.1',
				'--port',
				String(webPort),
				'--strictPort'
			],
			{
				cwd: root,
				env: webEnv,
				stdio: ['ignore', 'pipe', 'pipe']
			}
		);
		children.push(vite);
		vite.stdout.on('data', (chunk) => {
			logs += chunk;
		});
		vite.stderr.on('data', (chunk) => {
			logs += chunk;
		});
		await waitUntil(
			async () => {
				try {
					return (await fetch(appUrl + '/login')).ok;
				} catch {
					return false;
				}
			},
			'QA web startup',
			20000
		);
		const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
		browser = await chromium.launch({
			headless: true,
			executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
		});
		const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
		const page = await context.newPage();
		const pageErrors = [];
		page.on('pageerror', (error) => pageErrors.push(error.message));
		async function visit(route) {
			await page.goto(appUrl + route);
			await page.waitForLoadState('networkidle');
		}
		async function signIn(user, secret = password) {
			await visit('/login');
			await page.getByLabel('Email', { exact: true }).fill(user.email);
			await page.getByLabel('Kata sandi', { exact: true }).fill(secret);
			await page.getByRole('button', { name: 'Masuk', exact: true }).click();
			await page.waitForURL('**/user/dashboard');
			await page.waitForLoadState('networkidle');
		}
		await check(
			'browser forgot-password link renders recovery page without slug redirect',
			async () => {
				await visit('/login');
				await page.getByRole('link', { name: 'Lupa kata sandi?' }).click();
				await page.getByRole('heading', { name: 'Lupa kata sandi', exact: true }).waitFor();
				assert.equal(new URL(page.url()).pathname, '/forgot-password');
				assert.equal(new URL(page.url()).origin, appUrl);
			}
		);
		await check(
			'browser email-to-reset flow validates input, clears token and logs in',
			async () => {
				const user = await createUser('browser-reset');
				await page.getByLabel('Email', { exact: true }).fill(user.email);
				await page.getByRole('button', { name: 'Kirim link pemulihan' }).click();
				await page.getByRole('status').filter({ hasText: 'Jika email terdaftar' }).waitFor();
				const link = await resetLink(user);
				await page.goto(link);
				await page.waitForLoadState('networkidle');
				await page.getByLabel('Kata sandi baru', { exact: true }).fill('short');
				await page.getByLabel('Konfirmasi kata sandi baru', { exact: true }).fill('short');
				await page.getByRole('button', { name: 'Simpan kata sandi baru' }).click();
				await page.getByRole('alert').filter({ hasText: 'minimal 8 karakter' }).waitFor();
				await page.getByLabel('Kata sandi baru', { exact: true }).fill(newPassword);
				await page
					.getByLabel('Konfirmasi kata sandi baru', { exact: true })
					.fill('wrong-confirmation');
				await page.getByRole('button', { name: 'Simpan kata sandi baru' }).click();
				await page
					.getByRole('alert')
					.filter({ hasText: 'Konfirmasi kata sandi tidak cocok' })
					.waitFor();
				await page.getByLabel('Konfirmasi kata sandi baru', { exact: true }).fill(newPassword);
				await page.getByRole('button', { name: 'Simpan kata sandi baru' }).click();
				await page
					.getByRole('status')
					.filter({ hasText: 'Kata sandi berhasil diperbarui' })
					.waitFor();
				assert.equal(new URL(page.url()).hash, '');
				assert.equal(new URL(page.url()).search, '');
				await page.screenshot({
					path: path.join(temp, 'password-reset-success.png'),
					fullPage: true
				});
				await signIn(user, newPassword);
				await page.evaluate(() => localStorage.clear());
			}
		);
		await check('browser missing and invalid reset tokens display recoverable errors', async () => {
			await visit('/reset-password');
			await page.getByRole('alert').filter({ hasText: 'Link pemulihan tidak valid' }).waitFor();
			assert.equal(await page.getByRole('button', { name: 'Simpan kata sandi baru' }).count(), 0);
			await visit('/reset-password#token=invalid');
			await page.getByLabel('Kata sandi baru', { exact: true }).fill(newPassword);
			await page.getByLabel('Konfirmasi kata sandi baru', { exact: true }).fill(newPassword);
			await page.getByRole('button', { name: 'Simpan kata sandi baru' }).click();
			await page.getByRole('alert').filter({ hasText: 'kedaluwarsa' }).waitFor();
		});
		await check(
			'browser settings password change validates, persists, logs out and clears session',
			async () => {
				const user = await createUser('browser-change');
				await signIn(user);
				await visit('/user/setting');
				await page.getByLabel('Kata sandi saat ini', { exact: true }).fill('wrong-password');
				await page.getByLabel('Kata sandi baru', { exact: true }).fill(newPassword);
				await page.getByLabel('Konfirmasi kata sandi baru', { exact: true }).fill(newPassword);
				await page.getByRole('button', { name: 'Ubah kata sandi', exact: true }).click();
				await page
					.locator('form')
					.filter({ has: page.locator('input[name="oldPassword"]') })
					.getByRole('alert')
					.filter({ hasText: 'Kata sandi saat ini tidak benar' })
					.waitFor();
				await page.getByLabel('Kata sandi saat ini', { exact: true }).fill(password);
				await page
					.getByLabel('Konfirmasi kata sandi baru', { exact: true })
					.fill('wrong-confirmation');
				await page.getByRole('button', { name: 'Ubah kata sandi', exact: true }).click();
				await page
					.locator('form')
					.filter({ has: page.locator('input[name="oldPassword"]') })
					.getByRole('alert')
					.filter({ hasText: 'Konfirmasi kata sandi tidak cocok' })
					.waitFor();
				await page.getByLabel('Konfirmasi kata sandi baru', { exact: true }).fill(newPassword);
				await page.getByRole('button', { name: 'Ubah kata sandi', exact: true }).click();
				await page.waitForURL('**/login');
				assert.equal(await page.evaluate(() => localStorage.getItem('wedez_auth')), null);
				await signIn(user, newPassword);
				await page.evaluate(() => localStorage.clear());
			}
		);
		await check(
			'browser deletion confirmation, cascade, redirect and session clearing work',
			async () => {
				const user = await createUser('browser-delete');
				const personal = await addPersonalData(user);
				await signIn(user);
				await visit('/user/setting');
				await page.getByRole('button', { name: 'Hapus akun', exact: true }).click();
				const button = page.getByRole('button', { name: 'Hapus akun permanen' });
				assert.equal(await button.isDisabled(), true);
				await page.getByRole('textbox', { name: 'Ketik HAPUS untuk melanjutkan' }).fill('hapus');
				assert.equal(await button.isDisabled(), true);
				await page.getByRole('textbox', { name: 'Ketik HAPUS untuk melanjutkan' }).fill('HAPUS');
				await button.click();
				await page.waitForURL('**/login');
				assert.equal(await page.evaluate(() => localStorage.getItem('wedez_auth')), null);
				await assertDeleted(user, personal);
			}
		);
		await check('browser pending payment deletion message keeps account intact', async () => {
			const user = await createUser('browser-pending');
			await createPayment(user, 'pending');
			await signIn(user);
			await visit('/user/setting');
			await page.getByRole('button', { name: 'Hapus akun', exact: true }).click();
			await page.getByRole('textbox', { name: 'Ketik HAPUS untuk melanjutkan' }).fill('HAPUS');
			await page.getByRole('button', { name: 'Hapus akun permanen' }).click();
			await page
				.getByRole('dialog')
				.getByRole('alert')
				.filter({ hasText: 'pembayaran yang berjalan' })
				.waitFor();
			await get('users', user.id);
			await page.getByRole('button', { name: 'Batal', exact: true }).click();
			await page.evaluate(() => localStorage.clear());
		});
		await check(
			'mobile recovery/settings at 360px and 390px do not overflow or throw JS errors',
			async () => {
				for (const width of [360, 390]) {
					await page.setViewportSize({ width, height: 844 });
					for (const route of ['/forgot-password', '/reset-password#token=invalid']) {
						await visit(route);
						assert.equal(
							await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
							false
						);
						await page.screenshot({
							path: path.join(
								temp,
								`mobile-${width}-${route.includes('forgot') ? 'forgot' : 'reset'}.png`
							),
							fullPage: true
						});
					}
					const user = await createUser(`mobile-${width}`);
					await signIn(user);
					await visit('/user/setting');
					assert.equal(
						await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
						false
					);
					await page.screenshot({
						path: path.join(temp, `mobile-${width}-settings.png`),
						fullPage: true
					});
					await page.evaluate(() => localStorage.clear());
				}
				assert.deepEqual(pageErrors, []);
			}
		);
	}
	console.log(`\n${results.length} P1 regression scenarios passed. Artifacts: ${temp}`);
} catch (error) {
	console.error(error);
	console.error(`QA artifacts: ${temp}`);
	process.exitCode = 1;
} finally {
	await browser?.close();
	for (const child of children.reverse()) {
		if (child.exitCode === null) {
			child.kill('SIGTERM');
			await Promise.race([
				once(child, 'exit'),
				new Promise((resolve) => setTimeout(resolve, 3000))
			]);
		}
	}
	if (smtp.listening) await new Promise((resolve) => smtp.close(resolve));
	await writeFile(path.join(temp, 'server.log'), logs);
	await writeFile(
		path.join(temp, 'results.json'),
		JSON.stringify({ passed: !process.exitCode, results }, null, 2)
	);
}
