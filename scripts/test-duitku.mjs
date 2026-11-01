// Verify official API destinations and signatures without network calls or real credentials.
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';

const source = await readFile(
	new URL('../pocketbase/pb_hooks/duitku_helpers.js', import.meta.url),
	'utf8'
);
const bases = {
	sandbox: 'https://sandbox.duitku.com/webapi/api/merchant',
	production: 'https://passport.duitku.com/webapi/api/merchant'
};
const merchant = 'TEST';
const apiKey = 'fake-duitku-test-key';
const sign = (value) => createHmac('sha256', apiKey).update(value).digest('hex');
const app = { logger: () => ({ error: () => {} }) };
let passed = 0;

class ApiError extends Error {
	constructor(status, message) {
		super(message);
		this.status = status;
	}
}

function load(overrides = {}) {
	const env = {
		DUITKU_ENV: 'sandbox',
		DUITKU_MERCHANT_CODE: merchant,
		DUITKU_API_KEY: apiKey,
		DUITKU_CALLBACK_URL: 'https://example.test/callback',
		DUITKU_RETURN_URL: 'https://example.test/payment',
		...overrides
	};
	const requests = [];
	const module = { exports: {} };
	runInNewContext(source, {
		module,
		ApiError,
		$os: { getenv: (name) => env[name] || '' },
		$security: { hs256: (value, key) => createHmac('sha256', key).update(value).digest('hex') },
		$http: {
			send(request) {
				requests.push(request);
				return { statusCode: 200, json: { responseCode: '00', paymentFee: [] } };
			}
		}
	});
	return { helpers: module.exports, requests };
}

function test(name, run) {
	run();
	passed++;
	console.log(`PASS ${name}`);
}

for (const [environment, base] of Object.entries(bases)) {
	for (const apiUrl of [undefined, '', '  ', base, ` ${base}/ `]) {
		test(`${environment}: resolve base URL ${JSON.stringify(apiUrl) ?? '(unset)'}`, () => {
			const { helpers } = load({ DUITKU_ENV: environment, DUITKU_API_URL: apiUrl });
			assert.equal(helpers.getConfig().apiUrl, base);
		});
	}

	test(`${environment}: methods, invoice and status use the direct API and HMAC signatures`, () => {
		const { helpers, requests } = load({ DUITKU_ENV: environment });
		const config = helpers.getConfig();
		helpers.getPaymentMethods(app, config, 50000);
		helpers.createInvoice(app, config, {
			merchantOrderId: 'order-test-1',
			paymentAmount: 50000,
			paymentMethod: 'SP'
		});
		helpers.checkTransaction(app, config, 'order-test-1', 50000);
		assert.deepEqual(
			requests.map((request) => request.url),
			[`${base}/paymentmethod/getpaymentmethod`, `${base}/v2/inquiry`, `${base}/transactionStatus`]
		);
		for (const request of requests) {
			assert.equal(request.method, 'POST');
			assert.equal(request.headers['Content-Type'], 'application/json');
			assert.equal(request.body.includes(apiKey), false);
		}
		const [methods, invoice, status] = requests.map((request) => JSON.parse(request.body));
		assert.equal(methods.merchantcode, merchant);
		assert.match(methods.datetime, /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
		assert.equal(methods.signature, sign(merchant + 50000 + methods.datetime));
		assert.equal(invoice.merchantCode, merchant);
		assert.equal(invoice.signature, sign(merchant + 'order-test-1' + 50000));
		assert.equal(status.merchantCode, merchant);
		assert.equal(status.signature, sign(merchant + 'order-test-1'));
	});

	for (const wrongUrl of [
		environment === 'production' ? bases.sandbox : bases.production,
		`https://api-${environment === 'production' ? 'prod' : 'sandbox'}.duitku.com`,
		'https://example.test/webapi/api/merchant',
		base.replace('https:', 'http:'),
		`${base}/v2/inquiry`
	]) {
		test(`${environment}: reject mismatched or unsafe URL ${wrongUrl}`, () => {
			const { helpers, requests } = load({ DUITKU_ENV: environment, DUITKU_API_URL: wrongUrl });
			assert.throws(
				() => helpers.getConfig(),
				(error) => {
					assert.equal(error.status, 503);
					assert.ok(error.message.includes(base));
					return true;
				}
			);
			assert.equal(requests.length, 0);
		});
	}
}

test('invalid environment is rejected', () => {
	assert.throws(() => load({ DUITKU_ENV: 'staging' }).helpers.getConfig(), /Environment Duitku/);
});

test('sandbox permits a local return URL; production requires HTTPS', () => {
	const env = { DUITKU_RETURN_URL: 'http://localhost:5173/payment' };
	assert.equal(load(env).helpers.getConfig().returnUrl, env.DUITKU_RETURN_URL);
	assert.throws(
		() => load({ ...env, DUITKU_ENV: 'production' }).helpers.getConfig(),
		/Return URL Duitku/
	);
});

test('missing credentials are rejected before a gateway request', () => {
	for (const name of ['DUITKU_MERCHANT_CODE', 'DUITKU_API_KEY']) {
		const { helpers, requests } = load({ [name]: '' });
		assert.throws(() => helpers.getConfig(), /Kredensial Duitku/);
		assert.equal(requests.length, 0);
	}
});

console.log(`\nDuitku API: ${passed}/${passed} passed (isolated, no gateway calls).`);
