// Isolated integration test: real PocketBase/SQLite, mocked Duitku, no production credentials.
// Run: bun scripts/test-affiliate.mjs
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { once } from 'node:events';
import { cp, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { createServer as createPortProbe } from 'node:net';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const temp = await mkdtemp(path.join(tmpdir(), 'wedez-affiliate-test-'));
const pbPort = Number(process.env.WEDEZ_TEST_PORT || 8190);
assert.ok(Number.isInteger(pbPort) && pbPort > 1024 && pbPort < 65536);
const portProbe = createPortProbe();
portProbe.listen(pbPort, '127.0.0.1');
await once(portProbe, 'listening');
await new Promise((resolve) => portProbe.close(resolve));
const base = `http://127.0.0.1:${pbPort}`;
const password = 'Affiliate-Test-Only-9876';
const proofImage = Buffer.from(
	'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
	'base64'
);
const apiKey = 'fake-duitku-test-key';
const merchant = 'TEST';
let invoices = 0;
let rejectInvoice = false;
let malformedInvoice = false;
const transactions = new Map();
const mock = createServer(async (request, response) => {
	let raw = '';
	for await (const chunk of request) raw += chunk;
	const data = JSON.parse(raw || '{}');
	response.setHeader('Content-Type', 'application/json');
	if (request.url === '/paymentmethod/getpaymentmethod') {
		assert.equal(data.merchantcode, merchant);
		assert.equal(
			data.signature,
			createHmac('sha256', apiKey)
				.update(merchant + data.amount + data.datetime)
				.digest('hex')
		);
		response.end(
			JSON.stringify({
				responseCode: '00',
				paymentFee: [
					{ paymentMethod: 'SP', paymentName: 'QRIS ShopeePay', totalFee: '0' },
					{ paymentMethod: 'BC', paymentName: 'BCA Virtual Account', totalFee: '3500' },
					{ paymentMethod: 'VC', paymentName: 'Credit card', totalFee: '1000' },
					{ paymentMethod: 'BR', paymentName: 'Invalid fee', totalFee: '-1' }
				]
			})
		);
	} else if (request.url === '/v2/inquiry') {
		assert.equal(data.merchantCode, merchant);
		assert.equal(
			data.signature,
			createHmac('sha256', apiKey)
				.update(merchant + data.merchantOrderId + data.paymentAmount)
				.digest('hex')
		);
		assert.ok(['SP', 'BC'].includes(data.paymentMethod));
		invoices++;
		if (rejectInvoice) {
			response.writeHead(503);
			response.end('{}');
			return;
		}
		transactions.set(data.merchantOrderId, { ...data, statusCode: '01' });
		response.end(
			JSON.stringify({
				statusCode: '00',
				paymentUrl: `${base}/test-checkout/${data.merchantOrderId}`,
				reference: `ref-${data.merchantOrderId}`,
				merchantCode: merchant,
				amount: data.paymentAmount,
				vaNumber: !malformedInvoice && data.paymentMethod === 'BC' ? '7007014001444348' : '',
				qrString:
					!malformedInvoice && data.paymentMethod === 'SP'
						? '000201010212-WEDEZ-TEST-' + data.merchantOrderId
						: ''
			})
		);
	} else {
		const transaction = transactions.get(data.merchantOrderId);
		if (!transaction) {
			response.writeHead(404);
			response.end(JSON.stringify({ statusMessage: 'transaction not found' }));
			return;
		}
		response.end(
			JSON.stringify({
				merchantOrderId: data.merchantOrderId,
				amount: transaction.paymentAmount,
				statusCode: transaction.statusCode,
				reference: `ref-${data.merchantOrderId}`
			})
		);
	}
});
mock.listen(0, '127.0.0.1');
await once(mock, 'listening');
const mockBase = `http://127.0.0.1:${mock.address().port}`;
await cp(path.join(root, 'pocketbase/pb_hooks'), path.join(temp, 'hooks'), { recursive: true });
const helperPath = path.join(temp, 'hooks/duitku_helpers.js');
await writeFile(
	helperPath,
	(await readFile(helperPath, 'utf8'))
		.replaceAll('https://api-sandbox.duitku.com', mockBase)
		.replaceAll(
			'https://sandbox.duitku.com/webapi/api/merchant/transactionStatus',
			`${mockBase}/status`
		)
		.replaceAll('https://sandbox.duitku.com/webapi/api/merchant', mockBase)
);
const binary = path.join(root, 'pocketbase/pocketbase');
const migrationsDir = path.join(temp, 'migrations');
await cp(path.join(root, 'pocketbase/pb_migrations'), migrationsDir, { recursive: true });
// Seed old applications immediately before the real upgrade, then assert its effects
// and remove only these fixture records before the API scenarios begin.
const activationCases = [
	{ code: 'MIGR01', status: 'pending', verified: true, expected: 'active' },
	{ code: 'MIGR02', status: 'pending', verified: false, expected: 'pending' },
	{ code: 'MIGR03', status: 'active', verified: true, expected: 'active' },
	{ code: 'MIGR04', status: 'rejected', verified: true, expected: 'rejected' },
	{ code: 'MIGR05', status: 'suspended', verified: true, expected: 'suspended' },
	{ code: 'MIGR06', status: 'pending', orphan: true, expected: 'pending' }
];
await writeFile(
	path.join(migrationsDir, '1792627199_seed_auto_activation_test.js'),
	`migrate((app) => {
		for (const test of ${JSON.stringify(activationCases)}) {
			let user;
			if (!test.orphan) {
				user = new Record(app.findCollectionByNameOrId('users'));
				user.set('email', test.code.toLowerCase() + '@migration.example.test');
				user.set('password', ${JSON.stringify(password)});
				user.set('verified', test.verified);
				app.save(user);
			}
			const affiliate = new Record(app.findCollectionByNameOrId('affiliates'));
			affiliate.set('user', user ? user.id : '');
			affiliate.set('code', test.code);
			affiliate.set('status', test.status);
			app.save(affiliate);
		}
	}, () => {});`
);
await writeFile(
	path.join(migrationsDir, '1792627201_verify_auto_activation_test.js'),
	`migrate((app) => {
		for (const test of ${JSON.stringify(activationCases)}) {
			const affiliate = app.findRecordsByFilter('affiliates', 'code = {:code}', '', 1, 0, {code: test.code})[0];
			if (!affiliate || affiliate.getString('status') !== test.expected)
				throw new Error('Incorrect automatic activation for ' + test.code);
			const userId = affiliate.getString('user');
			app.db().newQuery('DELETE FROM affiliates WHERE id = {:id}').bind({id: affiliate.id}).execute();
			if (userId) app.db().newQuery('DELETE FROM users WHERE id = {:id}').bind({id: userId}).execute();
		}
		console.log('AUTO_ACTIVATION_MIGRATION_OK');
	}, () => {});`
);
const args = [`--dir=${temp}/data`, `--hooksDir=${temp}/hooks`, `--migrationsDir=${migrationsDir}`];
const env = {
	...process.env,
	DUITKU_ENV: 'sandbox',
	DUITKU_MERCHANT_CODE: merchant,
	DUITKU_API_KEY: apiKey,
	DUITKU_API_URL: mockBase,
	DUITKU_CALLBACK_URL: 'https://example.test/callback',
	DUITKU_RETURN_URL: 'http://127.0.0.1:5190/payment',
	WEDEZ_PRO_PRICE: '50000'
};
// Never reuse a running server, and never point this script at the project's pb_data.
const setup = spawnSync(
	binary,
	['superuser', 'upsert', 'affiliate-admin@example.test', password, ...args],
	{ env, encoding: 'utf8' }
);
assert.equal(setup.status, 0, setup.stdout + setup.stderr);
const server = spawn(binary, ['serve', `--http=127.0.0.1:${pbPort}`, ...args], {
	env,
	stdio: ['ignore', 'pipe', 'pipe']
});
let logs = '';
server.stdout.on('data', (chunk) => {
	logs += chunk;
});
server.stderr.on('data', (chunk) => {
	logs += chunk;
});
let admin = '';
let checks = 0;
async function request(route, { token = '', method = 'GET', body, status = 200 } = {}) {
	if (route === '/api/wedez/payments/session' && body && !('paymentMethod' in body))
		body = { ...body, paymentMethod: 'SP' };
	const multipart = body instanceof FormData;
	const response = await fetch(base + route, {
		method,
		headers: {
			...(!multipart ? { 'Content-Type': 'application/json' } : {}),
			...(token ? { Authorization: token } : {})
		},
		body: multipart ? body : body === undefined ? undefined : JSON.stringify(body)
	});
	const data = await response.json();
	if (status !== null)
		assert.equal(response.status, status, `${method} ${route}: ${JSON.stringify(data)}`);
	return { status: response.status, data };
}
function payoutForm(
	fields,
	bytes = proofImage,
	type = 'image/png',
	filename = 'bukti-transfer.png'
) {
	const form = new FormData();
	for (const [key, value] of Object.entries(fields)) form.set(key, String(value));
	form.set('transfer_proof', new Blob([bytes], { type }), filename);
	return form;
}
async function check(label, fn) {
	await fn();
	checks++;
	console.log(`PASS ${label}`);
}
async function createUser(label, verified = true) {
	const email = `${label}@example.test`;
	const user = (
		await request('/api/collections/users/records', {
			method: 'POST',
			status: 200,
			body: {
				email,
				password,
				passwordConfirm: password,
				name: label,
				home_area: 'affiliate',
				verified: true,
				wedding_id: 'fakewedding0000'
			}
		})
	).data;
	assert.equal(user.verified, false);
	assert.ok(!user.wedding_id || user.wedding_id.length === 0);
	assert.equal(user.home_area, '');
	assert.ok(!('signup_intent' in user));
	if (verified)
		await request(`/api/collections/users/records/${user.id}`, {
			token: admin,
			method: 'PATCH',
			body: { verified: true }
		});
	const auth = (
		await request('/api/collections/users/auth-with-password', {
			method: 'POST',
			body: { identity: email, password }
		})
	).data;
	return { id: user.id, token: auth.token, email };
}
async function records(collection, filter = '') {
	return (
		await request(
			`/api/collections/${collection}/records?perPage=100&filter=${encodeURIComponent(filter)}`,
			{ token: admin }
		)
	).data.items;
}
async function provision(user) {
	return (await request('/api/wedez/account/provision', { token: user.token, method: 'POST' })).data
		.wedding_id;
}
async function invoice(user, code) {
	return (
		await request('/api/wedez/payments/session', {
			token: user.token,
			method: 'POST',
			body: { couponCode: code, amount: 1, commission_amount: 9999999 },
			status: 201
		})
	).data.payment;
}
async function callback(payment, resultCode = '00', amount = payment.amount, signature) {
	const order = (await records('payments', `id = '${payment.id}'`))[0].provider_transaction_id;
	return request('/api/wedez/payments/duitku/callback', {
		method: 'POST',
		status: null,
		body: {
			merchantCode: merchant,
			merchantOrderId: order,
			amount: String(amount),
			resultCode,
			reference: `ref-${order}`,
			signature:
				signature ??
				createHmac('sha256', apiKey)
					.update(merchant + amount + order)
					.digest('hex')
		}
	});
}
let passed = false;
try {
	for (let attempt = 0; attempt < 100; attempt++) {
		if (server.exitCode !== null) throw new Error(logs);
		try {
			if ((await fetch(base + '/api/health')).ok) break;
		} catch {
			/* wait for this isolated process */
		}
		await new Promise((resolve) => setTimeout(resolve, 100));
	}
	admin = (
		await request('/api/collections/_superusers/auth-with-password', {
			method: 'POST',
			body: { identity: 'affiliate-admin@example.test', password }
		})
	).data.token;
	// Keep throttling enabled. The expanded financial suite makes many legitimate
	// calls from one test IP in seconds, so allow a larger session/status burst only
	// in this disposable fixture; retain the real coupon/payout limits.
	const settings = (await request('/api/settings', { token: admin })).data;
	for (const route of [
		'POST /api/wedez/payments/session',
		'POST /api/wedez/payments/methods',
		'GET /api/wedez/payments/status'
	])
		assert.equal(settings.rateLimits.rules.find((rule) => rule.label === route)?.maxRequests, 30);
	await request('/api/settings', {
		token: admin,
		method: 'PATCH',
		body: {
			rateLimits: {
				...settings.rateLimits,
				rules: settings.rateLimits.rules
					.filter((rule) => rule.label.includes('/api/wedez/'))
					.map((rule) =>
						/\/payments\/(session|status)$/.test(rule.label) ? { ...rule, maxRequests: 90 } : rule
					)
			}
		}
	});
	let affiliateUser;
	let affiliate;
	let firstBuyer;
	let firstPayment;
	let firstWedding;
	await check(
		'migration activates verified pending affiliates and preserves restrictions',
		async () => {
			assert.match(setup.stdout + setup.stderr + logs, /AUTO_ACTIVATION_MIGRATION_OK/);
		}
	);
	await check(
		'direct methods are authenticated, priced on the server and limited to QRIS/VA',
		async () => {
			await request('/api/wedez/payments/methods', { method: 'POST', body: {}, status: 401 });
			const buyer = await createUser('direct-methods');
			await provision(buyer);
			const result = (
				await request('/api/wedez/payments/methods', {
					token: buyer.token,
					method: 'POST',
					body: { amount: 1 }
				})
			).data;
			assert.deepEqual(
				result.methods.map((method) => method.code),
				['SP', 'BC']
			);
			assert.equal(result.quote.amount, 50000);
			assert.equal(result.methods[1].fee, 3500);
			assert.equal(result.environment, 'sandbox');
			assert.equal(result.quote.affiliate, undefined);
			for (const code of ['', 'VC', 'BR'])
				await request('/api/wedez/payments/session', {
					token: buyer.token,
					method: 'POST',
					body: { paymentMethod: code },
					status: 400
				});
			await request('/api/wedez/payments/session', {
				token: buyer.token,
				method: 'POST',
				body: { paymentMethod: 'BC', expectedAmount: 1, expectedFee: 3500 },
				status: 409
			});
			await request('/api/wedez/payments/session', {
				token: buyer.token,
				method: 'POST',
				body: { paymentMethod: 'BC', expectedAmount: 50000, expectedFee: 0 },
				status: 409
			});
			assert.equal(
				(
					await records(
						'payments',
						`wedding = '${(await records('weddings', `owner = '${buyer.id}'`))[0].id}'`
					)
				).length,
				0
			);
		}
	);
	await check(
		'VA details, fee and order survive reload; another owner cannot retrieve them',
		async () => {
			const buyer = await createUser('direct-va');
			await provision(buyer);
			const payment = (
				await request('/api/wedez/payments/session', {
					token: buyer.token,
					method: 'POST',
					body: { paymentMethod: 'BC', expectedAmount: 50000, expectedFee: 3500 },
					status: 201
				})
			).data.payment;
			assert.equal(payment.va_number, '7007014001444348');
			assert.equal(payment.qr_string, '');
			assert.equal(payment.kind, 'va');
			assert.equal(payment.total, 53500);
			assert.equal(payment.amount, 50000);
			assert.equal(payment.fee, 3500);
			const resumed = (await request('/api/wedez/payments/status', { token: buyer.token })).data;
			assert.equal(resumed.payment.order_id, payment.order_id);
			assert.equal(resumed.payment.va_number, payment.va_number);
			assert.ok(Date.parse(resumed.server_time));
			const outsider = await createUser('direct-outsider');
			await provision(outsider);
			assert.equal(
				(await request(`/api/wedez/payments/status?id=${payment.id}`, { token: outsider.token }))
					.data.payment.id,
				''
			);
			await request('/api/wedez/payments/session', {
				token: buyer.token,
				method: 'POST',
				body: { paymentMethod: 'SP' },
				status: 409
			});
			assert.equal((await callback(payment)).status, 200);
			assert.equal(
				(await request('/api/wedez/payments/status', { token: buyer.token })).data.plan_tier,
				'pro'
			);
		}
	);
	await check('missing QR data keeps the invoice reservation; expiry is persisted', async () => {
		const buyer = await createUser('direct-malformed');
		const weddingId = await provision(buyer);
		malformedInvoice = true;
		await request('/api/wedez/payments/session', {
			token: buyer.token,
			method: 'POST',
			body: {},
			status: 502
		});
		malformedInvoice = false;
		const count = invoices;
		await request('/api/wedez/payments/session', {
			token: buyer.token,
			method: 'POST',
			body: {},
			status: 409
		});
		assert.equal(invoices, count);
		const payment = (await records('payments', `wedding = '${weddingId}'`))[0];
		await request(`/api/collections/payments/records/${payment.id}`, {
			token: admin,
			method: 'PATCH',
			body: { expires_at: '2020-01-01 00:00:00.000Z' }
		});
		assert.equal(
			(await request('/api/wedez/payments/status', { token: buyer.token })).data.payment.status,
			'expired'
		);
		assert.equal(
			(await request('/api/wedez/payments/status', { token: buyer.token })).data.payment.status,
			'expired'
		);
		const next = await invoice(buyer, '');
		assert.ok(next.qr_string.startsWith('000201'));
		assert.notEqual(next.id, payment.id);
	});
	await check(
		'an expired local deadline reconciles a paid gateway invoice before retrying',
		async () => {
			const buyer = await createUser('direct-expired-paid');
			await provision(buyer);
			const payment = await invoice(buyer, '');
			await request(`/api/collections/payments/records/${payment.id}`, {
				token: admin,
				method: 'PATCH',
				body: { expires_at: '2020-01-01 00:00:00.000Z' }
			});
			transactions.get(payment.order_id).statusCode = '00';
			const count = invoices;
			const retry = (
				await request('/api/wedez/payments/session', {
					token: buyer.token,
					method: 'POST',
					body: {}
				})
			).data;
			assert.equal(retry.plan_tier, 'pro');
			assert.equal(retry.payment.id, payment.id);
			assert.equal(invoices, count);
			const status = (await request('/api/wedez/payments/status', { token: buyer.token })).data;
			assert.equal(status.payment.id, payment.id);
			assert.equal(status.payment.amount, 50000);
			assert.equal(status.payment.qr_string, '');
		}
	);
	await check(
		'transfer proof migration preserves history and restricts private image uploads',
		async () => {
			const collection = (await request('/api/collections/affiliate_payouts', { token: admin }))
				.data;
			const field = collection.fields.find((field) => field.name === 'transfer_proof');
			assert.equal(field.type, 'file');
			assert.equal(field.maxSelect, 1);
			assert.equal(field.maxSize, 5 * 1024 * 1024);
			assert.equal(field.required, false);
			assert.equal(field.protected, true);
			assert.deepEqual(field.mimeTypes, ['image/jpeg', 'image/png', 'image/webp']);
			assert.equal(collection.updateRule, null);
			assert.ok(collection.viewRule.includes('affiliate.user = @request.auth.id'));
		}
	);
	await check('verified enrollment activates immediately and never creates a wedding', async () => {
		await request('/api/wedez/affiliate/me', { status: 401 });
		const usersCollection = (await request('/api/collections/users', { token: admin })).data;
		assert.ok(!usersCollection.fields.some((field) => field.name === 'signup_intent'));
		const unverified = await createUser('unverified', false);
		await request('/api/wedez/affiliate/enroll', {
			token: unverified.token,
			method: 'POST',
			status: 403
		});
		await request('/api/wedez/account/provision', {
			token: unverified.token,
			method: 'POST',
			status: 403
		});
		await request(`/api/collections/users/records/${unverified.id}`, {
			token: unverified.token,
			method: 'PATCH',
			body: { home_area: 'affiliate' },
			status: 404
		});
		const weddingCount = (await records('weddings')).length;
		affiliateUser = await createUser('affiliate');
		assert.equal((await records('weddings')).length, weddingCount);
		const chosen = await request(`/api/collections/users/records/${affiliateUser.id}`, {
			token: affiliateUser.token,
			method: 'PATCH',
			body: { home_area: 'affiliate' }
		});
		assert.equal(chosen.data.home_area, 'affiliate');
		const loggedInAgain = await request('/api/collections/users/auth-with-password', {
			method: 'POST',
			body: { identity: affiliateUser.email, password }
		});
		assert.equal(loggedInAgain.data.record.home_area, 'affiliate');
		const results = await Promise.all(
			[1, 2].map(() =>
				request('/api/wedez/affiliate/enroll', { token: affiliateUser.token, method: 'POST' })
			)
		);
		affiliate = results[0].data;
		assert.equal(affiliate.id, results[1].data.id);
		assert.match(affiliate.code, /^[A-Z0-9]{6}$/);
		assert.equal(affiliate.status, 'active');
		assert.equal(results[1].data.status, 'active');
		await request(`/api/collections/affiliates/records/${affiliate.id}`, {
			token: affiliateUser.token,
			method: 'PATCH',
			body: { status: 'suspended' },
			status: 403
		});
	});
	await check('legacy pending enrollment activates once and retains its coupon', async () => {
		await request(`/api/collections/affiliates/records/${affiliate.id}`, {
			token: admin,
			method: 'PATCH',
			body: { status: 'pending' }
		});
		const result = await request('/api/wedez/affiliate/enroll', {
			token: affiliateUser.token,
			method: 'POST'
		});
		assert.equal(result.data.status, 'active');
		assert.equal(result.data.id, affiliate.id);
		assert.equal(result.data.code, affiliate.code);
		assert.equal((await records('affiliates', `user = '${affiliateUser.id}'`)).length, 1);
	});
	await check('re-enrollment cannot override rejected or suspended status', async () => {
		for (const status of ['rejected', 'suspended']) {
			await request(`/api/collections/affiliates/records/${affiliate.id}`, {
				token: admin,
				method: 'PATCH',
				body: { status }
			});
			await request('/api/wedez/affiliate/enroll', {
				token: affiliateUser.token,
				method: 'POST',
				status: 403
			});
			assert.equal((await records('affiliates', `id = '${affiliate.id}'`))[0].status, status);
		}
		await request(`/api/collections/affiliates/records/${affiliate.id}`, {
			token: admin,
			method: 'PATCH',
			body: { status: 'active' }
		});
	});
	await check('coupon eligibility, normalization, server-calculated 10% discount', async () => {
		firstBuyer = await createUser('buyer-1');
		firstWedding = await provision(firstBuyer);
		const weddingUser = await request(`/api/collections/users/records/${firstBuyer.id}`, {
			token: firstBuyer.token
		});
		assert.equal(weddingUser.data.home_area, 'wedding');
		const quoteBody = {
			couponCode: affiliate.code.toLowerCase(),
			amount: 1,
			discount_percent: 100
		};
		const quote = (
			await request('/api/wedez/payments/quote', {
				token: firstBuyer.token,
				method: 'POST',
				body: quoteBody
			})
		).data;
		assert.equal(quote.amount, 45000);
		assert.equal(quote.discount_amount, 5000);
		assert.equal(quote.coupon_code, affiliate.code);
		assert.equal(quote.affiliate, undefined);
		await request('/api/wedez/payments/quote', {
			token: firstBuyer.token,
			method: 'POST',
			body: { couponCode: 'INVALID' },
			status: 400
		});
		await provision(affiliateUser);
		await request('/api/wedez/payments/session', {
			token: affiliateUser.token,
			method: 'POST',
			body: { couponCode: affiliate.code },
			status: 400
		});
		const switchedBack = await request(`/api/collections/users/records/${affiliateUser.id}`, {
			token: affiliateUser.token,
			method: 'PATCH',
			body: { home_area: 'affiliate' }
		});
		assert.equal(switchedBack.data.home_area, 'affiliate');
	});
	await check('concurrent checkout reserves one invoice and immutable attribution', async () => {
		const before = invoices;
		const results = await Promise.all(
			[1, 2].map(() =>
				request('/api/wedez/payments/session', {
					token: firstBuyer.token,
					method: 'POST',
					body: { couponCode: affiliate.code },
					status: null
				})
			)
		);
		assert.equal(results.filter((r) => r.status === 201).length, 1);
		assert.ok(
			results.every((r) => [200, 201, 409].includes(r.status)),
			JSON.stringify(results)
		);
		firstPayment = results.find((r) => r.status === 201).data.payment;
		assert.equal(firstPayment.amount, 45000);
		assert.equal(invoices, before + 1);
		const stored = (await records('payments', `wedding = '${firstWedding}'`))[0];
		assert.equal(stored.commission_amount, 9000);
		assert.equal(stored.commission_percent, 20);
		const repeat = await request('/api/wedez/payments/session', {
			token: firstBuyer.token,
			method: 'POST',
			body: { couponCode: affiliate.code }
		});
		assert.equal(repeat.data.payment.id, firstPayment.id);
		await request('/api/wedez/payments/session', {
			token: firstBuyer.token,
			method: 'POST',
			body: { couponCode: '' },
			status: 409
		});
	});
	await check('confirmed gateway cancellation allows a new invoice with a coupon', async () => {
		const buyer = await createUser('cancel-then-coupon');
		await provision(buyer);
		const original = (
			await request('/api/wedez/payments/session', {
				token: buyer.token,
				method: 'POST',
				body: { couponCode: '' },
				status: 201
			})
		).data.payment;
		assert.equal(original.amount, 50000);
		const remainingMs = Date.parse(original.expires_at) - Date.now();
		assert.ok(remainingMs > 9 * 60 * 1000 && remainingMs <= 10 * 60 * 1000);
		await request('/api/wedez/payments/session', {
			token: buyer.token,
			method: 'POST',
			body: { couponCode: affiliate.code },
			status: 409
		});
		const order = (await records('payments', `id = '${original.id}'`))[0].provider_transaction_id;
		assert.equal(transactions.get(order).expiryPeriod, 10);
		transactions.get(order).statusCode = '02';
		const checked = (await request('/api/wedez/payments/status', { token: buyer.token })).data;
		assert.equal(checked.payment.status, 'failed');
		const discounted = (
			await request('/api/wedez/payments/session', {
				token: buyer.token,
				method: 'POST',
				body: { couponCode: affiliate.code },
				status: 201
			})
		).data.payment;
		assert.equal(discounted.amount, 45000);
		assert.equal(discounted.coupon_code, affiliate.code);
		assert.notEqual(discounted.id, original.id);
	});
	await check('verified callbacks are atomic and duplicate callbacks earn once', async () => {
		assert.equal((await callback(firstPayment, '00', 45000, 'invalid')).status, 401);
		assert.equal((await callback(firstPayment, '00', 1)).status, 400);
		assert.equal((await records('affiliate_commissions')).length, 0);
		const results = await Promise.all([callback(firstPayment), callback(firstPayment)]);
		assert.ok(results.every((r) => r.status === 200));
		assert.equal((await records('affiliate_commissions')).length, 1);
		assert.equal((await records('weddings', `id = '${firstWedding}'`))[0].plan_tier, 'pro');
		await callback(firstPayment, '01');
		assert.equal((await records('payments', `id = '${firstPayment.id}'`))[0].status, 'paid');
	});
	await check('bank validation and minimum payout are enforced server-side', async () => {
		await request('/api/wedez/affiliate/bank', {
			token: affiliateUser.token,
			method: 'PATCH',
			body: { bank_name: 'BCA', account_number: 'ABC', account_name: 'Test Affiliate' },
			status: 400
		});
		await request('/api/wedez/affiliate/bank', {
			token: affiliateUser.token,
			method: 'PATCH',
			body: {
				bank_name: 'BCA',
				account_number: '0012345678',
				account_name: 'Test Affiliate',
				status: 'suspended',
				user: firstBuyer.id
			}
		});
		await request('/api/wedez/affiliate/payouts', {
			token: affiliateUser.token,
			method: 'POST',
			body: { amount: 1000000 },
			status: 400
		});
		assert.equal((await records('affiliates'))[0].status, 'active');
	});
	await check('status polling also credits commission; twelve sales reach Rp108.000', async () => {
		for (let index = 2; index <= 12; index++) {
			const buyer = await createUser(`buyer-${index}`);
			await provision(buyer);
			const payment = await invoice(buyer, affiliate.code);
			if (index === 2) {
				const record = (await records('payments', `id = '${payment.id}'`))[0];
				transactions.get(record.provider_transaction_id).statusCode = '00';
				await request('/api/wedez/payments/status', { token: buyer.token });
			} else assert.equal((await callback(payment)).status, 200);
			if (index === 5) {
				const overview = (await request('/api/wedez/affiliate/me', { token: affiliateUser.token }))
					.data;
				assert.equal(overview.totals.available, 45000);
				assert.equal(overview.minimum_payout, 50000);
				await request('/api/wedez/affiliate/payouts', {
					token: affiliateUser.token,
					method: 'POST',
					status: 400
				});
			}
			if (index === 6) {
				const overview = (await request('/api/wedez/affiliate/me', { token: affiliateUser.token }))
					.data;
				assert.equal(overview.totals.available, 54000);
				assert.equal(overview.minimum_payout, 50000);
			}
		}
		const overview = (await request('/api/wedez/affiliate/me', { token: affiliateUser.token }))
			.data;
		assert.equal(overview.totals.available, 108000);
		assert.equal(overview.totals.conversions, 12);
		assert.equal(overview.minimum_payout, 50000);
	});
	await check('owner-only reads and writes protect financial records', async () => {
		for (const collection of ['affiliates', 'affiliate_commissions', 'affiliate_payouts']) {
			assert.equal(
				(await request(`/api/collections/${collection}/records`, { token: firstBuyer.token })).data
					.items.length,
				0
			);
			await request(`/api/collections/${collection}/records`, {
				token: affiliateUser.token,
				method: 'POST',
				body: {},
				status: 403
			});
		}
		const commission = (await records('affiliate_commissions'))[0];
		await request(`/api/collections/affiliate_commissions/records/${commission.id}`, {
			token: firstBuyer.token,
			status: 404
		});
		await request(`/api/collections/affiliate_commissions/records/${commission.id}`, {
			token: affiliateUser.token,
			method: 'PATCH',
			body: { amount: 999999 },
			status: 403
		});
		await request(`/api/collections/payments/records/${firstPayment.id}`, {
			token: affiliateUser.token,
			status: 404
		});
	});
	let rejected;
	let paidPayout;
	await check(
		'concurrent payout reserves each commission once and snapshots bank details',
		async () => {
			const results = await Promise.all(
				[1, 2].map(() =>
					request('/api/wedez/affiliate/payouts', {
						token: affiliateUser.token,
						method: 'POST',
						body: { amount: 1, commissions: [] }
					})
				)
			);
			rejected = results[0].data;
			assert.equal(rejected.id, results[1].data.id);
			assert.equal(rejected.amount, 108000);
			assert.equal((await records('affiliate_payouts')).length, 1);
			assert.ok((await records('affiliate_commissions')).every((r) => r.status === 'reserved'));
			await request('/api/wedez/affiliate/bank', {
				token: affiliateUser.token,
				method: 'PATCH',
				body: { bank_name: 'BRI', account_number: '0098765432', account_name: 'Test Affiliate' }
			});
			assert.equal((await records('affiliate_payouts'))[0].account_number, '0012345678');
			await request(`/api/collections/affiliate_payouts/records/${rejected.id}`, {
				token: admin,
				method: 'PATCH',
				body: { amount: 1, status: 'processing' },
				status: 400
			});
		}
	);
	await check(
		'rejection releases reservations and a retry preserves previous history',
		async () => {
			await request(`/api/collections/affiliate_payouts/records/${rejected.id}`, {
				token: admin,
				method: 'PATCH',
				body: { status: 'rejected' },
				status: 400
			});
			await request(`/api/collections/affiliate_payouts/records/${rejected.id}`, {
				token: admin,
				method: 'PATCH',
				body: { status: 'rejected', note: 'Rekening perlu diperiksa' }
			});
			assert.ok((await records('affiliate_commissions')).every((r) => r.status === 'available'));
			paidPayout = (
				await request('/api/wedez/affiliate/payouts', {
					token: affiliateUser.token,
					method: 'POST'
				})
			).data;
			assert.notEqual(paidPayout.id, rejected.id);
			assert.equal(paidPayout.account_number, '0098765432');
			await request(`/api/collections/affiliate_payouts/records/${rejected.id}`, {
				token: admin,
				method: 'PATCH',
				body: { status: 'paid', transfer_reference: 'stale' },
				status: 400
			});
		}
	);
	await check(
		'confirmed transfer failure releases funds without reopening the failed request',
		async () => {
			const failedId = paidPayout.id;
			const route = `/api/collections/affiliate_payouts/records/${failedId}`;
			await request(route, { token: admin, method: 'PATCH', body: { status: 'processing' } });
			await request(route, {
				token: admin,
				method: 'PATCH',
				body: { status: 'failed' },
				status: 400
			});
			await request(route, {
				token: admin,
				method: 'PATCH',
				body: { status: 'failed', note: 'Transfer dipastikan tidak terkirim' }
			});
			assert.ok((await records('affiliate_commissions')).every((r) => r.status === 'available'));
			paidPayout = (
				await request('/api/wedez/affiliate/payouts', {
					token: affiliateUser.token,
					method: 'POST'
				})
			).data;
			assert.notEqual(paidPayout.id, failedId);
			await request(route, {
				token: admin,
				method: 'PATCH',
				body: { status: 'processing' },
				status: 400
			});
		}
	);
	await check('admin processing and payment atomically settle the ledger', async () => {
		const route = `/api/collections/affiliate_payouts/records/${paidPayout.id}`;
		await request(route, {
			token: admin,
			method: 'PATCH',
			body: { status: 'paid', transfer_reference: 'test-transfer' },
			status: 400
		});
		await request(route, {
			token: admin,
			method: 'PATCH',
			body: payoutForm({ status: 'processing' }),
			status: 400
		});
		await request(route, { token: admin, method: 'PATCH', body: { status: 'processing' } });
		await request(route, { token: admin, method: 'PATCH', body: { status: 'paid' }, status: 400 });
		await request(route, {
			token: admin,
			method: 'PATCH',
			body: { status: 'paid', transfer_reference: 'test-transfer' },
			status: 400
		});
		await request(route, {
			token: admin,
			method: 'PATCH',
			body: { status: 'paid', transfer_reference: 'test-transfer', transfer_proof: 'fake.png' },
			status: 400
		});
		await request(route, {
			token: affiliateUser.token,
			method: 'PATCH',
			body: payoutForm({ status: 'paid', transfer_reference: 'test-transfer' }),
			status: 403
		});
		await request(route, {
			token: admin,
			method: 'PATCH',
			body: payoutForm({ status: 'paid' }),
			status: 400
		});
		await request(route, {
			token: admin,
			method: 'PATCH',
			body: payoutForm(
				{ status: 'paid', transfer_reference: 'test-transfer' },
				'<svg xmlns="http://www.w3.org/2000/svg"></svg>',
				'image/png',
				'bukti.png'
			),
			status: 400
		});
		const oversized = Buffer.alloc(5 * 1024 * 1024 + 1);
		proofImage.copy(oversized);
		await request(route, {
			token: admin,
			method: 'PATCH',
			body: payoutForm({ status: 'paid', transfer_reference: 'test-transfer' }, oversized),
			status: 400
		});
		const multiple = payoutForm({ status: 'paid', transfer_reference: 'test-transfer' });
		multiple.append('transfer_proof', new Blob([proofImage], { type: 'image/png' }), 'kedua.png');
		await request(route, { token: admin, method: 'PATCH', body: multiple, status: 400 });
		const unchanged = (await request(route, { token: admin })).data;
		assert.equal(unchanged.status, 'processing');
		assert.equal(unchanged.transfer_proof, '');
		assert.equal(unchanged.paid_at, '');
		assert.ok((await records('affiliate_commissions')).every((r) => r.status === 'reserved'));
		paidPayout = (
			await request(route, {
				token: admin,
				method: 'PATCH',
				body: payoutForm({ status: 'paid', transfer_reference: 'test-transfer' })
			})
		).data;
		assert.ok(paidPayout.transfer_proof.endsWith('.png'));
		assert.equal(paidPayout.transfer_reference, 'test-transfer');
		assert.ok(paidPayout.paid_at);
		await request(route, {
			token: admin,
			method: 'PATCH',
			body: payoutForm({ status: 'paid', transfer_reference: 'replacement' }),
			status: 400
		});
		await request(route, {
			token: admin,
			method: 'PATCH',
			body: { status: 'paid', transfer_proof: '' },
			status: 400
		});
		await request(route, {
			token: admin,
			method: 'PATCH',
			body: { status: 'paid', transfer_reference: 'test-transfer' }
		});
		const overview = (await request('/api/wedez/affiliate/me', { token: affiliateUser.token }))
			.data;
		assert.deepEqual(overview.totals, { available: 0, reserved: 0, paid: 108000, conversions: 12 });
		assert.ok(
			(await records('affiliate_commissions')).every((r) => r.status === 'paid' && r.paid_at)
		);
		assert.equal(
			(await request(route, { token: admin })).data.transfer_proof,
			paidPayout.transfer_proof
		);
	});
	await check(
		'transfer proof requires a file token and is limited to its owner or admin',
		async () => {
			const url = `${base}/api/files/${paidPayout.collectionId}/${paidPayout.id}/${paidPayout.transfer_proof}`;
			assert.ok((await fetch(url)).status >= 400);
			for (const token of [admin, affiliateUser.token]) {
				const fileToken = (await request('/api/files/token', { method: 'POST', token })).data.token;
				const response = await fetch(`${url}?token=${encodeURIComponent(fileToken)}`);
				assert.equal(response.status, 200);
				assert.equal(response.headers.get('content-type'), 'image/png');
				assert.deepEqual(Buffer.from(await response.arrayBuffer()), proofImage);
			}
			const otherToken = (
				await request('/api/files/token', { method: 'POST', token: firstBuyer.token })
			).data.token;
			assert.ok((await fetch(`${url}?token=${encodeURIComponent(otherToken)}`)).status >= 400);
		}
	);
	await check('financial history is retained and paid commissions cannot be voided', async () => {
		const commission = (await records('affiliate_commissions'))[0];
		await request(`/api/collections/affiliate_commissions/records/${commission.id}`, {
			token: admin,
			method: 'PATCH',
			body: { status: 'void', void_reason: 'test refund' },
			status: 400
		});
		await request(`/api/collections/affiliate_payouts/records/${paidPayout.id}`, {
			token: admin,
			method: 'DELETE',
			status: 400
		});
		await request(`/api/collections/payments/records/${firstPayment.id}`, {
			token: admin,
			method: 'DELETE',
			status: 400
		});
		const deletion = await request(`/api/collections/weddings/records/${firstWedding}`, {
			token: firstBuyer.token,
			method: 'DELETE',
			status: null
		});
		assert.ok(deletion.status >= 400);
		assert.equal((await records('payments', `id = '${firstPayment.id}'`)).length, 1);
	});
	await check(
		'uncertain invoice creation keeps reservation; discounted missing status reconciles',
		async () => {
			const buyer = await createUser('uncertain');
			await provision(buyer);
			rejectInvoice = true;
			await request('/api/wedez/payments/session', {
				token: buyer.token,
				method: 'POST',
				body: { couponCode: affiliate.code },
				status: 502
			});
			rejectInvoice = false;
			const count = invoices;
			await request('/api/wedez/payments/session', {
				token: buyer.token,
				method: 'POST',
				body: { couponCode: affiliate.code },
				status: 409
			});
			assert.equal(invoices, count);
			const status = (await request('/api/wedez/payments/status', { token: buyer.token })).data;
			assert.equal(status.payment.amount, 45000);
			assert.equal(status.payment.status, 'pending');
		}
	);
	await check(
		'suspended affiliate cannot receive new attributed checkouts or request payouts',
		async () => {
			await request(`/api/collections/affiliates/records/${affiliate.id}`, {
				token: admin,
				method: 'PATCH',
				body: { status: 'suspended' }
			});
			await request('/api/wedez/payments/quote', {
				token: firstBuyer.token,
				method: 'POST',
				body: { couponCode: affiliate.code },
				status: 400
			});
			await request('/api/wedez/affiliate/payouts', {
				token: affiliateUser.token,
				method: 'POST',
				status: 403
			});
			await request(`/api/collections/affiliates/records/${affiliate.id}`, {
				token: admin,
				method: 'PATCH',
				body: { status: 'active' }
			});
		}
	);
	await check(
		'late paid invoices cannot earn twice; available commissions can be voided',
		async () => {
			const buyer = await createUser('late-payment');
			await provision(buyer);
			const older = await invoice(buyer, affiliate.code);
			await request(`/api/collections/payments/records/${older.id}`, {
				token: admin,
				method: 'PATCH',
				body: { expires_at: '2020-01-01 00:00:00.000Z' }
			});
			const newer = await invoice(buyer, affiliate.code);
			assert.equal((await callback(older)).status, 200);
			assert.equal((await callback(newer)).status, 200);
			const credited = await records(
				'affiliate_commissions',
				`payment = '${older.id}' || payment = '${newer.id}'`
			);
			assert.equal(credited.length, 1);
			await request(`/api/collections/affiliate_commissions/records/${credited[0].id}`, {
				token: admin,
				method: 'PATCH',
				body: { status: 'void', void_reason: 'Refund sebelum pencairan' }
			});
			assert.equal(
				(await request('/api/wedez/affiliate/me', { token: affiliateUser.token })).data.totals
					.available,
				0
			);
		}
	);
	await check(
		'payments without a coupon retain full price and never earn commissions',
		async () => {
			const buyer = await createUser('no-coupon');
			await provision(buyer);
			const payment = await invoice(buyer, '');
			assert.equal(payment.amount, 50000);
			assert.equal(payment.discount_amount, 0);
			assert.equal((await callback(payment)).status, 200);
			assert.equal((await records('affiliate_commissions', `payment = '${payment.id}'`)).length, 0);
		}
	);
	// A live browser fixture needs its quote allowance for the checkout UI test.
	if (process.env.WEDEZ_KEEP_TEST_SERVER !== '1') {
		await check('coupon guessing is rate limited', async () => {
			let limited = false;
			for (let attempt = 0; attempt < 31; attempt++) {
				const response = await request('/api/wedez/payments/quote', {
					token: firstBuyer.token,
					method: 'POST',
					body: { couponCode: 'ZZZZZZ' },
					status: null
				});
				assert.ok([400, 429].includes(response.status));
				if (response.status === 429) {
					limited = true;
					break;
				}
			}
			assert.equal(limited, true);
		});
	}
	console.log(`${checks} integration scenarios passed. Test data: ${temp}`);
	passed = true;
	if (process.env.WEDEZ_KEEP_TEST_SERVER === '1') {
		console.log(`UI fixture ready at ${base}; affiliate@example.test / ${password}`);
		await new Promise((resolve) => {
			process.once('SIGINT', resolve);
			process.once('SIGTERM', resolve);
		});
	}
} finally {
	if (!passed) console.error(logs.slice(-9000));
	const stopped = once(server, 'exit');
	if (server.exitCode === null) {
		server.kill('SIGTERM');
		await stopped;
	}
	mock.close();
}
