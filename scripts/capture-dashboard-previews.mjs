// bun scripts/capture-dashboard-previews.mjs
// Captures the real wedding and affiliate UI with fictional data; backend requests are intercepted.
// Start the capture server with PUBLIC_INVITATION_URL=https://wedez.id for public URL text.
import { spawn, execFile } from 'node:child_process';
import { once } from 'node:events';
import { mkdir, mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const origin = process.env.DASHBOARD_PREVIEW_ORIGIN || 'http://localhost:5173';
const captures = [
	['overview', '/user/dashboard', '88% selesai'],
	['affiliate', '/affiliate/dashboard', '90% tercapai']
];
const selected = process.argv.slice(2);
if (selected.some((name) => !captures.some((capture) => capture[0] === name))) {
	throw new Error('Choose overview or affiliate.');
}
if (!['localhost', '127.0.0.1'].includes(new URL(origin).hostname)) {
	throw new Error('Capture the local development app only.');
}
const output = fileURLToPath(new URL('../apps/web/static/images/dashboard/', import.meta.url));
const scratch = await mkdtemp(join(tmpdir(), 'wedez-dashboard-capture-'));
const probe = createServer();
probe.listen(0, '127.0.0.1');
await once(probe, 'listening');
const port = probe.address().port;
await new Promise((resolve) => probe.close(resolve));
const chrome = spawn(
	process.env.PREVIEW_CHROME_BINARY ||
		'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
	[
		'--headless=new',
		'--disable-gpu',
		'--no-first-run',
		'--hide-scrollbars',
		`--remote-debugging-port=${port}`,
		`--user-data-dir=${join(scratch, 'profile')}`,
		'about:blank'
	],
	{ stdio: 'ignore' }
);
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const owner = {
	id: 'previewowner001',
	collectionId: '_pb_users_auth_',
	collectionName: 'users',
	name: 'Raka dan Laras',
	email: 'raka-laras@example.test',
	verified: true,
	wedding_id: 'previewwedding1',
	home_area: 'wedding'
};
const token = `${Buffer.from('{"alg":"HS256"}').toString('base64url')}.${Buffer.from(
	JSON.stringify({ id: owner.id, exp: Math.floor(Date.now() / 1000) + 86400 })
).toString('base64url')}.fictional-preview`;
const wedding = {
	id: owner.wedding_id,
	collectionId: 'weddings',
	collectionName: 'weddings',
	slug: 'raka-laras',
	theme: 'sakura',
	plan_tier: 'free',
	gift_enabled: false,
	groom_name: 'Raka',
	groom_father_name: 'Budi Santoso',
	groom_mother_name: 'Ratna Sari',
	groom_photo: 'raka-laras-hero.webp',
	bride_name: 'Laras',
	bride_father_name: 'Hendra Wijaya',
	bride_mother_name: 'Dewi Lestari',
	bride_photo: 'raka-laras-hero.webp',
	cover: 'raka-laras-hero.webp',
	address: 'Gedung Taman Laras, Bandung',
	maps: 'https://maps.google.com/?q=Bandung',
	akad: '2027-12-12T08:00:00+07:00',
	reception: '2027-12-12T11:00:00+07:00',
	gallery: ['glasshouse-venue.webp', 'wedding-rings.webp', 'coral-bouquet.webp'],
	quote: '',
	music: '',
	whatsapp_template: ''
};
const guests = Array.from({ length: 128 }, (_, index) => ({
	id: `previewguest${String(index).padStart(3, '0')}`,
	wedding: wedding.id,
	name: `Tamu Contoh ${index + 1}`,
	whatsapp: '',
	guest_count: 1,
	rsvp_status: index < 86 ? 'attending' : index < 98 ? 'not_attending' : 'pending',
	rsvp_token: 'demowa',
	message: '',
	created_at: '2026-09-30 08:00:00Z'
}));
const list = (items) => ({ page: 1, perPage: 500, totalItems: items.length, totalPages: 1, items });
const affiliate = {
	id: 'previewaffiliat1',
	user: owner.id,
	code: '482619',
	status: 'active',
	bank_name: 'Bank Contoh',
	account_name: owner.name,
	account_number: ''
};
const affiliateOverview = {
	affiliate,
	totals: { available: 45000, reserved: 9000, paid: 72000, conversions: 14 },
	minimum_payout: 50000,
	discount_percent: 10,
	commission_percent: 20
};
let ws;
const failures = [];
try {
	let tabs;
	for (let attempt = 0; attempt < 100; attempt++) {
		if (chrome.exitCode !== null) throw new Error('Chrome failed to start.');
		try {
			tabs = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
			break;
		} catch {
			await delay(100);
		}
	}
	if (!tabs) throw new Error('Chrome startup timeout.');
	ws = new WebSocket(tabs.find((tab) => tab.type === 'page').webSocketDebuggerUrl);
	await new Promise((resolve, reject) => {
		ws.onopen = resolve;
		ws.onerror = reject;
	});
	let nextId = 0;
	const pending = new Map();
	const call = (method, params = {}) =>
		new Promise((resolve, reject) => {
			const id = ++nextId;
			const timeout = setTimeout(() => {
				pending.delete(id);
				reject(new Error(`${method} timed out`));
			}, 15000);
			pending.set(id, { resolve, reject, timeout });
			ws.send(JSON.stringify({ id, method, params }));
		});
	async function mockRequest(event) {
		const url = new URL(event.request.url);
		if (!url.pathname.startsWith('/api/')) {
			await call('Fetch.continueRequest', { requestId: event.requestId });
			return;
		}
		let body;
		let mime = 'application/json';
		let status = 200;
		if (event.request.method === 'OPTIONS') {
			body = '';
			status = 204;
		} else if (url.pathname.endsWith('/users/auth-refresh')) {
			body = JSON.stringify({ token, record: owner });
		} else if (url.pathname === '/api/wedez/dashboard') {
			body = JSON.stringify({
				slug: wedding.slug,
				plan_tier: wedding.plan_tier,
				completion: { completedFields: 15, totalFields: 17, percentage: 88 },
				guests: {
					total: guests.length,
					attending: guests.filter((guest) => guest.rsvp_status === 'attending').length,
					notAttending: guests.filter((guest) => guest.rsvp_status === 'not_attending').length,
					pending: guests.filter((guest) => guest.rsvp_status === 'pending').length
				}
			});
		} else if (url.pathname === `/api/collections/weddings/records/${wedding.id}`) {
			body = JSON.stringify(wedding);
		} else if (url.pathname.endsWith('/guests/records')) {
			body = JSON.stringify(list(guests));
		} else if (url.pathname === '/api/wedez/affiliate/me') {
			body = JSON.stringify(affiliateOverview);
		} else if (url.pathname.endsWith('/affiliates/records')) {
			body = JSON.stringify(list([affiliate]));
		} else if (/\/collections\/(wedding_stories|musics)\/records$/.test(url.pathname)) {
			body = JSON.stringify(list([]));
		} else if (url.pathname.startsWith('/api/files/')) {
			const filename = url.pathname.split('/').at(-1);
			if (!['raka-laras-hero.webp', ...wedding.gallery].includes(filename)) {
				throw new Error(`Unexpected preview image: ${filename}`);
			}
			body = await readFile(
				new URL(`../apps/web/static/images/wedding/${filename}`, import.meta.url)
			);
			mime = 'image/webp';
		} else {
			failures.push(`Unexpected backend request: ${event.request.method} ${url.pathname}`);
			body = JSON.stringify({ message: 'Preview request blocked' });
			status = 503;
		}
		await call('Fetch.fulfillRequest', {
			requestId: event.requestId,
			responseCode: status,
			responseHeaders: [
				{ name: 'Content-Type', value: mime },
				{ name: 'Access-Control-Allow-Origin', value: '*' },
				{ name: 'Access-Control-Allow-Headers', value: '*' },
				{ name: 'Access-Control-Allow-Methods', value: 'GET, POST, OPTIONS' }
			],
			body: Buffer.from(body).toString('base64')
		});
	}
	ws.onmessage = ({ data }) => {
		const event = JSON.parse(data);
		if (event.id) {
			const request = pending.get(event.id);
			if (!request) return;
			clearTimeout(request.timeout);
			pending.delete(event.id);
			if (event.error) request.reject(new Error(event.error.message));
			else request.resolve(event.result);
		} else if (event.method === 'Fetch.requestPaused') {
			void mockRequest(event.params).catch((error) => {
				failures.push(error.message);
				void call('Fetch.failRequest', {
					requestId: event.params.requestId,
					errorReason: 'BlockedByClient'
				});
			});
		} else if (event.method === 'Runtime.exceptionThrown') {
			failures.push(
				event.params.exceptionDetails.exception?.description || event.params.exceptionDetails.text
			);
		}
	};
	await call('Runtime.enable');
	await call('Page.enable');
	await call('Fetch.enable', {
		patterns: [{ urlPattern: '*://*/api/*', requestStage: 'Request' }]
	});
	await call('Emulation.setDeviceMetricsOverride', {
		width: 1280,
		height: 800,
		deviceScaleFactor: 1,
		mobile: false
	});
	await call('Emulation.setEmulatedMedia', {
		features: [{ name: 'prefers-reduced-motion', value: 'reduce' }]
	});
	await call('Page.addScriptToEvaluateOnNewDocument', {
		source: `localStorage.setItem('wedez_auth', ${JSON.stringify(JSON.stringify({ token, record: owner }))});`
	});
	await mkdir(output, { recursive: true });
	for (const [name, route, readyText] of captures.filter(
		(capture) => !selected.length || selected.includes(capture[0])
	)) {
		await call('Page.navigate', { url: `${origin}${route}` });
		let ready = false;
		for (let attempt = 0; attempt < 150; attempt++) {
			if (failures.length) throw new Error(failures.join('\n'));
			const result = await call('Runtime.evaluate', {
				expression: `location.pathname === ${JSON.stringify(route)} && document.body.innerText.includes(${JSON.stringify(readyText)})`,
				returnByValue: true
			});
			if (result.result.value) {
				ready = true;
				break;
			}
			await delay(100);
		}
		if (!ready) throw new Error(`Preview did not load: ${route}`);
		await call('Runtime.evaluate', { expression: 'document.fonts.ready', awaitPromise: true });
		await delay(300);
		const metrics = await call('Runtime.evaluate', {
			expression: 'document.documentElement.scrollWidth <= innerWidth',
			returnByValue: true
		});
		if (!metrics.result.value) throw new Error(`Horizontal overflow in ${route}`);
		if (name === 'overview') {
			const upgrade = await call('Runtime.evaluate', {
				expression: `(() => {
					const link = document.querySelector('aside a[href="/user/upgrade"]');
					return !!link && link.textContent.trim() === 'Upgrade' && link.getBoundingClientRect().height > 0;
				})()`,
				returnByValue: true
			});
			if (!upgrade.result.value)
				throw new Error('Upgrade sidebar menu is missing from the preview.');
		}
		const screenshot = await call('Page.captureScreenshot', {
			format: 'png',
			captureBeyondViewport: false
		});
		const source = join(scratch, `${name}.png`);
		await writeFile(source, Buffer.from(screenshot.data, 'base64'));
		await promisify(execFile)('cwebp', [
			'-quiet',
			'-q',
			'90',
			'-m',
			'6',
			'-sharp_yuv',
			source,
			'-o',
			join(output, `${name}.webp`)
		]);
		console.log(`Captured ${name}.webp from ${route}`);
	}
	if (failures.length) throw new Error(failures.join('\n'));
} finally {
	ws?.close();
	if (chrome.exitCode === null) {
		chrome.kill('SIGTERM');
		await once(chrome, 'exit');
	}
	await rm(scratch, { recursive: true, force: true });
}
