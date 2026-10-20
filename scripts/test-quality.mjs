// Real PocketBase contract tests. Only disposable synthetic data; no project pb_data or .env.
// WEDEZ_TEST_UPGRADE=1 also verifies migration of populated legacy records.
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { once } from 'node:events';
import { cp, mkdtemp, writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import PocketBase from '../apps/web/node_modules/pocketbase/dist/pocketbase.es.mjs';
import { WEDDING_THEME_KEYS as webThemes } from '../apps/web/src/lib/features/wedding-themes/model/wedding-theme.ts';
import { WEDDING_THEME_KEYS as invitationThemes } from '../apps/invitation/src/lib/features/wedding-themes/model/wedding-theme.ts';
import { calculateWeddingCompletion } from '../apps/web/src/lib/features/weddings/model/wedding-completion.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const temp = await mkdtemp(path.join(tmpdir(), 'wedez-quality-'));
const port = Number(process.env.WEDEZ_TEST_PORT || 8197);
assert.ok(Number.isInteger(port) && port > 1024 && port < 65536);
const portProbe = createServer();
portProbe.listen(port, '127.0.0.1');
await once(portProbe, 'listening');
await new Promise((resolve) => portProbe.close(resolve));
const base = `http://127.0.0.1:${port}`;
const password = 'Quality-Synthetic-Only-1234';
const migration = '1791849600_harden_public_contracts.js';
const upgrade = process.env.WEDEZ_TEST_UPGRADE === '1';
const binary = path.join(root, 'pocketbase/pocketbase');
const args = [
	`--dir=${temp}/data`,
	`--hooksDir=${temp}/hooks`,
	`--migrationsDir=${temp}/migrations`
];
const env = { ...process.env, DUITKU_API_KEY: '', DUITKU_MERCHANT_CODE: '' };
const pb = new PocketBase(base);
pb.autoCancellation(false);
let server;
let logs = '';
let serial = 0;
const results = [];
const png = Buffer.from(
	'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRz8AAAAASUVORK5CYII=',
	'base64'
);

async function start() {
	server = spawn(binary, ['serve', `--http=127.0.0.1:${port}`, ...args], {
		env,
		stdio: ['ignore', 'pipe', 'pipe']
	});
	server.stdout.on('data', (data) => {
		logs += data;
	});
	server.stderr.on('data', (data) => {
		logs += data;
	});
	for (let attempt = 0; attempt < 100; attempt++) {
		if (server.exitCode !== null)
			throw new Error('Isolated PocketBase exited: ' + logs.slice(-3000));
		try {
			if (logs.includes(`127.0.0.1:${port}`) && (await fetch(base + '/api/health')).ok) return;
		} catch {
			/* startup */
		}
		await new Promise((resolve) => setTimeout(resolve, 50));
	}
	throw new Error('Isolated PocketBase did not start');
}
async function stop() {
	if (server && server.exitCode === null) {
		const exited = once(server, 'exit');
		server.kill('SIGTERM');
		await exited;
	}
}
async function check(label, run) {
	await run();
	results.push(label);
	console.log('PASS ' + label);
}
async function denied(run) {
	await assert.rejects(run, (error) => [400, 401, 403, 404].includes(error.status));
}
async function user(verified = true) {
	const email = `quality-${++serial}@example.test`;
	const record = await pb
		.collection('users')
		.create({ email, password, passwordConfirm: password, name: 'QA Owner', verified });
	const client = new PocketBase(base);
	client.autoCancellation(false);
	await client.collection('users').authWithPassword(email, password);
	return { client, record, email };
}
async function provision(client) {
	const result = await client.send('/api/wedez/account/provision', { method: 'POST' });
	await client.collection('users').authRefresh();
	return result.wedding_id;
}
function guest(wedding, extra = {}) {
	return {
		wedding,
		name: 'QA Guest',
		whatsapp: '+628123456789',
		rsvp_token: `qa${String(++serial).padStart(10, '0')}`,
		rsvp_status: 'pending',
		guest_count: 1,
		...extra
	};
}

async function waitFor(test, label) {
	for (let attempt = 0; attempt < 100; attempt++) {
		if (test()) return;
		await new Promise((resolve) => setTimeout(resolve, 50));
	}
	throw new Error('Timeout: ' + label);
}
async function subscribe(client, subscriptions) {
	const controller = new AbortController();
	const response = await fetch(base + '/api/realtime', { signal: controller.signal });
	assert.equal(response.status, 200);
	const reader = response.body.getReader();
	const decoder = new TextDecoder();
	const events = [];
	let clientId = '';
	const reading = (async () => {
		let buffer = '';
		try {
			while (true) {
				const { value, done } = await reader.read();
				if (done) break;
				buffer += decoder.decode(value, { stream: true }).replaceAll('\r\n', '\n');
				let end;
				while ((end = buffer.indexOf('\n\n')) !== -1) {
					const frame = buffer.slice(0, end);
					buffer = buffer.slice(end + 2);
					const data = frame
						.split('\n')
						.filter((line) => line.startsWith('data:'))
						.map((line) => line.slice(5).trim())
						.join('\n');
					if (!data) continue;
					const event = JSON.parse(data);
					if (event.clientId) clientId = event.clientId;
					else events.push(event);
				}
			}
		} catch (error) {
			if (!controller.signal.aborted) throw error;
		}
	})();
	await waitFor(() => !!clientId, 'realtime connection');
	await client.send('/api/realtime', { method: 'POST', body: { clientId, subscriptions } });
	return {
		events,
		close: async () => {
			controller.abort();
			await reading;
		}
	};
}

try {
	await cp(path.join(root, 'pocketbase/pb_hooks'), `${temp}/hooks`, {
		recursive: true,
		filter: (file) => !upgrade || !file.endsWith('wedding_validation.pb.js')
	});
	await cp(path.join(root, 'pocketbase/pb_migrations'), `${temp}/migrations`, {
		recursive: true,
		filter: (file) => !upgrade || !file.endsWith(migration)
	});
	const setup = spawnSync(
		binary,
		['superuser', 'upsert', 'quality-admin@example.test', password, ...args],
		{ env, encoding: 'utf8' }
	);
	assert.equal(setup.status, 0, setup.stdout + setup.stderr);
	await start();
	await pb.collection('_superusers').authWithPassword('quality-admin@example.test', password);
	// Synthetic account setup exceeds the default login throttle. Keep the actual
	// application endpoint limits enabled in this disposable database.
	const settings = await pb.settings.getAll();
	await pb.settings.update({
		rateLimits: {
			...settings.rateLimits,
			rules: settings.rateLimits.rules.filter((rule) => rule.label.includes('/api/wedez/'))
		}
	});
	let legacy;
	if (upgrade) {
		// Older project databases can lack PocketBase's default avatar field.
		const users = await pb.collections.getOne('users');
		await pb.collections.update(users.id, {
			fields: users.fields.filter((field) => field.name !== 'avatar')
		});
		const owner = await user();
		const id = await provision(owner.client);
		legacy = await owner.client.collection('weddings').update(id, {
			slug: 'admin',
			cover: new File(['<h1>legacy</h1>'], 'legacy.html', { type: 'text/html' })
		});
		await stop();
		await cp(
			path.join(root, 'pocketbase/pb_migrations', migration),
			`${temp}/migrations/${migration}`
		);
		await cp(
			path.join(root, 'pocketbase/pb_hooks/wedding_validation.pb.js'),
			`${temp}/hooks/wedding_validation.pb.js`
		);
		logs = '';
		await start();
		await check(
			'migration adds a missing avatar field without changing existing users',
			async () => {
				const users = await pb.collections.getOne('users');
				const avatar = users.fields.find((field) => field.name === 'avatar');
				assert.equal(avatar?.type, 'file');
				assert.equal(avatar.maxSelect, 1);
				assert.equal(avatar.maxSize, 10 * 1024 * 1024);
				assert.deepEqual(avatar.mimeTypes, ['image/jpeg', 'image/png', 'image/webp']);
				const after = await owner.client.collection('users').getOne(owner.record.id);
				assert.equal(after.email, owner.email);
				assert.equal(after.wedding_id, id);
				assert.equal(after.avatar, '');
			}
		);
		await check(
			'populated migration preserves legacy records/files and allows unrelated edits',
			async () => {
				const after = await owner.client
					.collection('weddings')
					.update(id, { quote: 'Still editable' });
				assert.equal(after.slug, 'admin');
				assert.equal(after.cover, legacy.cover);
				assert.equal((await fetch(pb.files.getURL(after, after.cover))).status, 200);
				await owner.client.collection('weddings').update(id, { slug: 'legacy-fixed' });
			}
		);
	}
	const a = await user(),
		b = await user(),
		unverified = await user(false);
	const wa = await provision(a.client),
		wb = await provision(b.client);
	const anonymous = new PocketBase(base);
	await check(
		'gift visibility is independent, preserves account data and hides inactive public accounts',
		async () => {
			const giftOwner = await user();
			const giftWedding = await provision(giftOwner.client);
			const data = {
				slug: 'qa-gift-visibility',
				gift_enabled: true,
				groom_payment_account_name: 'QA Pria',
				groom_payment_provider: 'BCA',
				groom_payment_number: '00012345678',
				bride_payment_account_name: 'QA Wanita',
				bride_payment_provider: 'DANA',
				bride_payment_number: '081234567890'
			};
			const saved = await giftOwner.client.collection('weddings').update(giftWedding, data);
			assert.equal(saved.groom_gift_hidden, false);
			assert.equal(saved.bride_gift_hidden, false);
			for (const person of ['groom', 'bride']) {
				const other = person === 'groom' ? 'bride' : 'groom';
				await giftOwner.client
					.collection('weddings')
					.update(giftWedding, { [`${person}_gift_hidden`]: true });
				const own = await giftOwner.client.collection('weddings').getOne(giftWedding);
				assert.equal(own[`${person}_payment_number`], data[`${person}_payment_number`]);
				assert.equal(calculateWeddingCompletion(own).totalFields, 20);
				for (const reader of [anonymous, b.client]) {
					const visible = await reader.collection('weddings').getOne(giftWedding);
					for (const field of ['payment_number', 'payment_provider', 'payment_account_name']) {
						assert.equal(visible[`${person}_${field}`], undefined);
						assert.equal(visible[`${other}_${field}`], data[`${other}_${field}`]);
					}
				}
				const projection = await anonymous
					.collection('weddings')
					.getOne(giftWedding, { fields: `${person}_payment_number,${other}_payment_number` });
				assert.equal(projection[`${person}_payment_number`], undefined);
				await giftOwner.client
					.collection('weddings')
					.update(giftWedding, { [`${person}_gift_hidden`]: false });
				const restored = await anonymous.collection('weddings').getOne(giftWedding);
				assert.equal(restored[`${person}_payment_number`], data[`${person}_payment_number`]);
			}
			await giftOwner.client
				.collection('weddings')
				.update(giftWedding, { groom_gift_hidden: true, bride_gift_hidden: true });
			const bothHidden = await anonymous.collection('weddings').getOne(giftWedding);
			assert.equal(bothHidden.groom_payment_number, undefined);
			assert.equal(bothHidden.bride_payment_number, undefined);
			assert.equal(calculateWeddingCompletion(bothHidden).totalFields, 17);
			const story = await giftOwner.client.collection('wedding_stories').create({
				wedding: giftWedding,
				title: 'Gift privacy',
				content: 'Synthetic privacy test',
				sort_order: 1
			});
			for (const reader of [anonymous, b.client]) {
				for (const person of ['groom', 'bride']) {
					for (const suffix of ['number', 'provider', 'account_name']) {
						const field = `${person}_payment_${suffix}`;
						for (const filter of [
							`${field} = "${data[field]}"`,
							`${field} ~ "${data[field].slice(0, 2)}"`
						]) {
							await denied(() => reader.collection('weddings').getList(1, 1, { filter }));
							await denied(() =>
								reader.collection('wedding_stories').getList(1, 1, { filter: `wedding.${filter}` })
							);
						}
						await denied(() => reader.collection('weddings').getList(1, 1, { sort: field }));
						await denied(() =>
							reader.collection('wedding_stories').getList(1, 1, { sort: `-wedding.${field}` })
						);
					}
				}
			}
			const feeds = await Promise.all(
				[giftOwner.client, anonymous, b.client].map((reader) =>
					subscribe(reader, [`weddings/${giftWedding}`])
				)
			);
			try {
				await giftOwner.client.collection('weddings').update(giftWedding, {
					gift_enabled: false,
					groom_gift_hidden: false,
					bride_gift_hidden: false
				});
				await waitFor(() => feeds.every((feed) => feed.events.length), 'gift realtime delivery');
				for (const reader of [anonymous, b.client]) {
					const direct = await reader.collection('weddings').getOne(giftWedding);
					const projected = await reader.collection('weddings').getOne(giftWedding, {
						fields: 'id,groom_payment_number,bride_payment_number'
					});
					const expanded = await reader.collection('wedding_stories').getOne(story.id, {
						expand: 'wedding'
					});
					for (const record of [direct, projected, expanded.expand.wedding]) {
						for (const person of ['groom', 'bride'])
							for (const suffix of ['number', 'provider', 'account_name'])
								assert.equal(record[`${person}_payment_${suffix}`], undefined);
					}
				}
				for (const feed of feeds.slice(1))
					assert.equal(feed.events[0].record.groom_payment_number, undefined);
				assert.equal(feeds[0].events[0].record.groom_payment_number, data.groom_payment_number);
				for (const reader of [giftOwner.client, pb]) {
					const own = await reader.collection('weddings').getOne(giftWedding);
					assert.equal(own.groom_payment_number, data.groom_payment_number);
					assert.equal(own.bride_payment_number, data.bride_payment_number);
				}
			} finally {
				await Promise.all(feeds.map((feed) => feed.close()));
				await giftOwner.client.collection('wedding_stories').delete(story.id);
			}
			await denied(() =>
				b.client.collection('weddings').update(giftWedding, { groom_gift_hidden: false })
			);
		}
	);
	const collections = await pb.collections.getFullList();
	await writeFile(
		`${temp}/schema.json`,
		JSON.stringify(
			collections.map(
				({ name, fields, indexes, listRule, viewRule, createRule, updateRule, deleteRule }) => ({
					name,
					fields,
					indexes,
					listRule,
					viewRule,
					createRule,
					updateRule,
					deleteRule
				})
			),
			null,
			2
		)
	);
	await check('all 51 themes agree across the editor, renderer and migrated schema', async () => {
		assert.deepEqual(webThemes, invitationThemes);
		assert.deepEqual(
			[
				...collections.find((c) => c.name === 'weddings').fields.find((f) => f.name === 'theme')
					.values
			].sort(),
			[...webThemes].sort()
		);
	});
	await check('provisioning is verified-only and idempotent under concurrency', async () => {
		await denied(() => provision(unverified.client));
		await denied(() => provision(anonymous));
		const ids = await Promise.all(Array.from({ length: 4 }, () => provision(a.client)));
		assert.deepEqual([...new Set(ids)], [wa]);
	});
	await check('owner, other user, anonymous and superuser collection boundaries', async () => {
		await a.client.collection('weddings').getOne(wa);
		await pb.collection('weddings').getOne(wa);
		for (const client of [anonymous, b.client]) {
			await denied(() => client.collection('weddings').getOne(wa));
			await denied(() => client.collection('weddings').update(wa, { quote: 'intrusion' }));
			await denied(() => client.collection('weddings').delete(wa));
			await denied(() => client.collection('users').getOne(a.record.id));
			assert.ok(!(await client.collection('weddings').getFullList()).some((w) => w.id === wa));
		}
		// Hidden owner fields are ignored by the record API, not accepted as an ownership transfer.
		await a.client.collection('weddings').update(wa, { owner: b.record.id });
		await pb
			.collection('weddings')
			.getFirstListItem(
				pb.filter('id = {:id} && owner = {:owner}', { id: wa, owner: a.record.id })
			);
		await denied(() => a.client.collection('weddings').update(wa, { plan_tier: 'pro' }));
		await denied(() => a.client.collection('users').update(a.record.id, { wedding_id: wb }));
		await denied(() =>
			unverified.client.collection('users').update(unverified.record.id, { verified: true })
		);
		assert.equal((await pb.collection('users').getOne(unverified.record.id)).verified, false);
	});
	await check('reserved/invalid slugs cannot be saved; valid domains still publish', async () => {
		for (const slug of [
			'api',
			'admin',
			'www',
			'dokploy',
			'mail',
			'app',
			'status',
			'web',
			'wedding',
			'-bad',
			'bad-',
			'a.b',
			'Uppercase',
			'a'.repeat(64)
		]) {
			await denied(() => a.client.collection('weddings').update(wa, { slug }));
		}
		await a.client.collection('weddings').update(wa, {
			slug: 'quality-wedding',
			groom_name: 'QA Groom',
			bride_name: 'QA Bride',
			whatsapp_template: 'PRIVATE-TEMPLATE'
		});
	});
	await check(
		'private WhatsApp template redacted from public, explicit fields and expanded responses',
		async () => {
			for (const client of [anonymous, b.client]) {
				for (const options of [{}, { fields: 'id,whatsapp_template' }]) {
					const data = await client.collection('weddings').getOne(wa, options);
					assert.ok(!('whatsapp_template' in data));
					assert.ok(!('owner' in data));
				}
			}
			assert.equal(
				(await a.client.collection('weddings').getOne(wa)).whatsapp_template,
				'PRIVATE-TEMPLATE'
			);
			assert.equal(
				(await pb.collection('weddings').getOne(wa)).whatsapp_template,
				'PRIVATE-TEMPLATE'
			);
			for (const client of [anonymous, b.client, a.client]) {
				await denied(() =>
					client
						.collection('weddings')
						.getList(1, 1, { filter: 'whatsapp_template = "PRIVATE-TEMPLATE"' })
				);
				await denied(() =>
					client.collection('weddings').getList(1, 1, { sort: 'whatsapp_template' })
				);
				await denied(() =>
					client
						.collection('wedding_stories')
						.getList(1, 1, { filter: 'wedding.whatsapp_template ~ "PRIVATE"' })
				);
			}
			const story = await a.client
				.collection('wedding_stories')
				.create({ wedding: wa, title: 'Story', content: 'Synthetic', sort_order: 1 });
			assert.ok(
				!(
					'whatsapp_template' in
					(await anonymous.collection('wedding_stories').getOne(story.id, { expand: 'wedding' }))
						.expand.wedding
				)
			);
		}
	);
	await check(
		'image MIME and size limits enforce content, not a forged filename/header',
		async () => {
			for (const field of ['cover', 'groom_photo', 'bride_photo', 'gallery']) {
				await denied(() =>
					a.client.collection('weddings').update(wa, {
						[field]: new File(['<html>not an image</html>'], 'photo.png', { type: 'image/png' })
					})
				);
				await a.client
					.collection('weddings')
					.update(wa, { [field]: new File([png], 'photo.png', { type: 'image/png' }) });
			}
			await denied(() =>
				a.client.collection('weddings').update(wa, {
					cover: new File([png, new Uint8Array(10 * 1024 * 1024)], 'large.png', {
						type: 'image/png'
					})
				})
			);
			const after = await a.client
				.collection('users')
				.update(a.record.id, { avatar: new File([png], 'avatar.png', { type: 'image/png' }) });
			assert.equal((await fetch(pb.files.getURL(after, after.avatar))).status, 200);
			await denied(() =>
				b.client
					.collection('users')
					.update(a.record.id, { avatar: new File([png], 'avatar.png', { type: 'image/png' }) })
			);
		}
	);
	let firstGuest;
	await check('50-guest CSV batch succeeds and oversized batches are rejected', async () => {
		const batch = a.client.createBatch();
		for (let i = 0; i < 50; i++) batch.collection('guests').create(guest(wa));
		const saved = await batch.send();
		assert.equal(saved.length, 50);
		firstGuest = saved[0].body;
		const excessive = a.client.createBatch();
		for (let i = 0; i < 51; i++) excessive.collection('guests').create(guest(wa));
		await denied(() => excessive.send());
		assert.equal((await a.client.collection('guests').getList(1, 1)).totalItems, 50);
	});
	await check('batch rollback and guest ownership remain enforced', async () => {
		const batch = a.client.createBatch();
		batch.collection('guests').create(guest(wa));
		batch.collection('guests').create(guest(wb));
		await denied(() => batch.send());
		assert.equal((await a.client.collection('guests').getList(1, 1)).totalItems, 50);
		for (const client of [anonymous, b.client]) {
			assert.equal((await client.collection('guests').getFullList()).length, 0);
			await denied(() => client.collection('guests').getOne(firstGuest.id));
			const attack = client.createBatch();
			attack.collection('guests').update(firstGuest.id, { name: 'intrusion' });
			await denied(() => attack.send());
		}
		await denied(() => a.client.collection('guests').update(firstGuest.id, { wedding: wb }));
	});
	await check('multipart story batches are atomic on validation failure', async () => {
		const original = (await a.client.collection('wedding_stories').getFullList())[0];
		const failed = a.client.createBatch();
		failed.collection('wedding_stories').update(original.id, { title: 'Must rollback' });
		failed.collection('wedding_stories').create({
			wedding: wa,
			title: '',
			content: 'Invalid',
			sort_order: 2,
			image: new File([png], 'story.png', { type: 'image/png' })
		});
		await denied(() => failed.send());
		assert.equal(
			(await a.client.collection('wedding_stories').getOne(original.id)).title,
			original.title
		);
		const valid = a.client.createBatch();
		valid.collection('wedding_stories').update(original.id, {
			title: 'Updated',
			image: new File([png], 'story.png', { type: 'image/png' })
		});
		assert.equal((await valid.send())[0].status, 200);
	});
	await check('RSVP token/slug validation and privacy, invalid payloads and replay', async () => {
		const body = { slug: 'quality-wedding', token: firstGuest.rsvp_token };
		const send = (body) => anonymous.send('/api/wedez/rsvp/respond', { method: 'POST', body });
		for (const override of [
			{ token: 'bad' },
			{ slug: 'other-wedding' },
			{ rsvp_status: 'unknown' },
			{ message: 'a'.repeat(1001) }
		]) {
			await denied(() => send({ ...body, rsvp_status: 'attending', ...override }));
		}
		for (let i = 0; i < 2; i++) {
			const response = await send({
				...body,
				rsvp_status: 'attending',
				message: 'Selamat QA',
				wedding: wb,
				guest_count: 999
			});
			assert.deepEqual(Object.keys(response).sort(), ['message', 'name', 'rsvp_status']);
		}
		const after = await a.client.collection('guests').getOne(firstGuest.id);
		assert.equal(after.wedding, wa);
		assert.equal(after.guest_count, 1);
		const messages = await anonymous.send('/api/wedez/rsvp/messages', {
			method: 'POST',
			body: { slug: body.slug }
		});
		assert.equal(messages.items[0].message, 'Selamat QA');
		assert.ok(!('rsvp_token' in messages.items[0]) && !('whatsapp' in messages.items[0]));
	});
	await check(
		'realtime delivers owner changes but never leaks private guests or templates',
		async () => {
			const subscriptions = [`weddings/${wa}`, `guests/${firstGuest.id}`];
			const feeds = await Promise.all(
				[a.client, b.client, anonymous].map((client) => subscribe(client, subscriptions))
			);
			try {
				await a.client.collection('guests').update(firstGuest.id, { name: 'Realtime QA' });
				await a.client.collection('weddings').update(wa, { quote: 'Realtime QA' });
				await waitFor(
					() =>
						feeds[0].events.length === 2 && feeds.slice(1).every((feed) => feed.events.length >= 1),
					'realtime delivery'
				);
				await new Promise((resolve) => setTimeout(resolve, 200));
				assert.equal(
					feeds[0].events.find((e) => e.record.id === wa).record.whatsapp_template,
					'PRIVATE-TEMPLATE'
				);
				for (const feed of feeds.slice(1)) {
					assert.equal(feed.events.length, 1);
					assert.equal(feed.events[0].record.id, wa);
					assert.ok(!('whatsapp_template' in feed.events[0].record));
				}
			} finally {
				await Promise.all(feeds.map((feed) => feed.close()));
			}
		}
	);
	await check('dedicated RSVP enumeration limit returns 429', async () => {
		let limited = false;
		for (let i = 0; i < 61; i++) {
			try {
				await anonymous.send('/api/wedez/rsvp/guest', {
					method: 'POST',
					body: { slug: 'quality-wedding', token: 'aaaaaa' }
				});
			} catch (error) {
				if (error.status === 429) {
					limited = true;
					break;
				}
				assert.equal(error.status, 404);
			}
		}
		assert.ok(limited);
	});
	await check('on-demand summaries are owner-only, fresh, and omit private records', async () => {
		const owner = await user();
		const id = await provision(owner.client);
		const initial = await owner.client.send('/api/wedez/dashboard');
		assert.deepEqual(initial.guests, { total: 0, attending: 0, notAttending: 0, pending: 0 });
		assert.deepEqual(Object.keys(initial).sort(), ['completion', 'guests', 'plan_tier', 'slug']);
		await denied(() => anonymous.send('/api/wedez/dashboard'));
		await denied(() => anonymous.send('/api/wedez/weddings/summary'));
		const unverified = await user(false);
		await denied(() => unverified.client.send('/api/wedez/dashboard'));
		await denied(() => unverified.client.send('/api/wedez/weddings/summary'));
		const noWedding = await user();
		await denied(() => noWedding.client.send('/api/wedez/dashboard'));
		const story = await owner.client.collection('wedding_stories').create({
			wedding: id,
			title: 'QA Story',
			content: 'Private story content',
			date: '2027-01-01',
			sort_order: 1
		});
		await pb.collection('guests').create(guest(id, { guest_count: 3, rsvp_status: 'attending' }));
		await pb
			.collection('guests')
			.create(guest(id, { guest_count: 2, rsvp_status: 'not_attending' }));
		const pendingGuest = await pb.collection('guests').create(guest(id, { guest_count: 4 }));
		const record = await owner.client.collection('weddings').update(id, {
			slug: 'qa-summary',
			quote: 'Private quote',
			whatsapp_template: 'PRIVATE-SUMMARY-TEMPLATE',
			gift_enabled: true,
			groom_gift_hidden: true,
			bride_gift_hidden: false,
			separate_events: true,
			reception_address: 'Private address'
		});
		const summary = await owner.client.send('/api/wedez/weddings/summary');
		assert.deepEqual(
			summary.completion,
			calculateWeddingCompletion({ ...record, stories: [story] })
		);
		assert.equal(summary.sections.Story, false);
		assert.equal(summary.sections.Quote, true);
		assert.equal(summary.id, id);
		assert.deepEqual(Object.keys(summary).sort(), [
			'completion',
			'id',
			'plan_tier',
			'sections',
			'slug'
		]);
		assert.doesNotMatch(JSON.stringify(summary), /Private|PRIVATE|whatsapp|payment_number/);
		for (const flags of [
			{ gift_enabled: false, separate_events: false },
			{ gift_enabled: true, groom_gift_hidden: true, bride_gift_hidden: true },
			{ groom_gift_hidden: false, bride_gift_hidden: false, separate_events: true },
			{ groom_gift_hidden: false, bride_gift_hidden: true }
		]) {
			const updated = await owner.client.collection('weddings').update(id, flags);
			assert.deepEqual(
				(await owner.client.send('/api/wedez/weddings/summary')).completion,
				calculateWeddingCompletion({ ...updated, stories: [story] })
			);
		}
		await owner.client.collection('wedding_stories').update(story.id, {
			image: new File([png], 'story.png', { type: 'image/png' })
		});
		assert.equal((await owner.client.send('/api/wedez/weddings/summary')).sections.Story, true);
		const dashboard = await owner.client.send('/api/wedez/dashboard');
		assert.equal(dashboard.slug, 'qa-summary');
		assert.deepEqual(dashboard.guests, { total: 9, attending: 3, notAttending: 2, pending: 4 });
		await owner.client.collection('guests').update(pendingGuest.id, { rsvp_status: 'attending' });
		assert.deepEqual((await owner.client.send('/api/wedez/dashboard')).guests, {
			total: 9,
			attending: 7,
			notAttending: 2,
			pending: 0
		});
		const other = await b.client.send(
			`/api/wedez/dashboard?wedding=${id}&owner=${owner.record.id}`
		);
		assert.notEqual(other.slug, 'qa-summary');
		const response = await fetch(base + '/api/wedez/dashboard', {
			headers: { Authorization: owner.client.authStore.token }
		});
		assert.equal(response.headers.get('cache-control'), 'no-store');
	});
	assert.doesNotMatch(logs, /failed to execute .*\.pb\.js|ReferenceError|SyntaxError|TypeError/);
	await writeFile(
		`${temp}/fixture.json`,
		JSON.stringify(
			{
				base,
				adminEmail: 'quality-admin@example.test',
				password,
				owner: {
					email: a.email,
					record: a.client.authStore.record,
					token: a.client.authStore.token
				},
				other: { email: b.email },
				wedding: wa,
				guest: firstGuest
			},
			null,
			2
		)
	);
	console.log(`${results.length} quality scenarios passed. Artifacts: ${temp}`);
	if (process.env.WEDEZ_KEEP_TEST_SERVER === '1') {
		await new Promise((resolve) => {
			process.once('SIGINT', resolve);
			process.once('SIGTERM', resolve);
		});
	}
} catch (error) {
	console.error('Quality failure:', JSON.stringify(error.response ?? error.message));
	throw error;
} finally {
	await stop();
	await writeFile(`${temp}/server.log`, logs);
	await writeFile(
		`${temp}/results.json`,
		JSON.stringify({ upgrade, passed: results.length, results }, null, 2)
	);
}
