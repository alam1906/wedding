// Disposable database only; never reads project pb_data or .env files.
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { once } from 'node:events';
import { cp, mkdtemp } from 'node:fs/promises';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import path from 'node:path';
import PocketBase from '../apps/web/node_modules/pocketbase/dist/pocketbase.es.mjs';
import {
	createEventDraft,
	eventDateParts,
	eventDateTimeToISO
} from '../apps/web/src/lib/features/weddings/model/wedding-events.ts';
import { getEventLocation } from '../apps/invitation/src/lib/features/wedding-themes/shared/theme-utils.ts';
import { calculateWeddingCompletion } from '../apps/web/src/lib/features/weddings/model/wedding-completion.ts';

const fixture = {
	address: 'Masjid A',
	maps: 'https://example.com/akad',
	reception_address: 'Gedung B',
	reception_maps: 'https://example.com/resepsi',
	akad: '2026-12-31 18:00:00.000Z',
	reception: '2027-01-01 03:00:00.000Z',
	separate_events: false
};
assert.deepEqual(eventDateParts(fixture.akad), { date: '2027-01-01', time: '01:00' });
assert.equal(eventDateTimeToISO('2027-01-01', '01:00'), '2026-12-31T18:00:00.000Z');
assert.equal(createEventDraft(fixture).separate, false);
assert.equal(createEventDraft({ ...fixture, reception: '2027-01-02T03:00:00Z' }).separate, true);
assert.equal(createEventDraft(fixture).receptionAddress, fixture.address);
assert.equal(createEventDraft({ ...fixture, separate_events: true }).receptionAddress, 'Gedung B');
assert.equal(getEventLocation(fixture, 'reception').address, 'Masjid A');
assert.equal(
	getEventLocation({ ...fixture, separate_events: true }, 'reception').address,
	'Gedung B'
);
assert.equal(getEventLocation({ ...fixture, separate_events: true }, 'akad').maps, fixture.maps);
assert.equal(
	getEventLocation(
		{ ...fixture, separate_events: true, reception_maps: 'javascript:alert(1)' },
		'reception'
	).maps,
	null
);
assert.equal(
	getEventLocation({ ...fixture, separate_events: true, reception_address: '' }, 'reception')
		.address,
	''
);
assert.equal(calculateWeddingCompletion(fixture).totalFields, 23);
assert.equal(calculateWeddingCompletion({ ...fixture, separate_events: true }).totalFields, 24);
console.log('PASS date round-trip, legacy mode, per-event locations, safe URLs, completeness');

const temp = await mkdtemp(path.join(tmpdir(), 'wedez-events-'));
const root = path.resolve(import.meta.dirname, '..');
const migration = '1792713600_add_separate_wedding_events.js';
const binary = path.join(root, 'pocketbase/pocketbase');
const args = [
	`--dir=${temp}/data`,
	`--hooksDir=${temp}/hooks`,
	`--migrationsDir=${temp}/migrations`
];
const probe = createServer();
probe.listen(0, '127.0.0.1');
await once(probe, 'listening');
const port = probe.address().port;
await new Promise((resolve) => probe.close(resolve));
const base = `http://127.0.0.1:${port}`;
const pb = new PocketBase(base);
pb.autoCancellation(false);
const password = 'Synthetic-Events-Only-1234';
let server;
let logs = '';

async function start() {
	server = spawn(binary, ['serve', `--http=127.0.0.1:${port}`, ...args], {
		stdio: ['ignore', 'pipe', 'pipe']
	});
	server.stdout.on('data', (data) => {
		logs += data;
	});
	server.stderr.on('data', (data) => {
		logs += data;
	});
	for (let i = 0; i < 100; i++) {
		if (server.exitCode !== null) throw new Error(logs.slice(-3000));
		try {
			if ((await fetch(`${base}/api/health`)).ok) return;
		} catch {
			/* starting */
		}
		await new Promise((resolve) => setTimeout(resolve, 50));
	}
	throw new Error('PocketBase startup timed out');
}
async function stop() {
	if (server && server.exitCode === null) {
		const exited = once(server, 'exit');
		server.kill('SIGTERM');
		await exited;
	}
}

try {
	await cp(path.join(root, 'pocketbase/pb_migrations'), `${temp}/migrations`, {
		recursive: true,
		filter: (file) => !file.endsWith(migration)
	});
	await cp(path.join(root, 'pocketbase/pb_hooks'), `${temp}/hooks`, { recursive: true });
	const setup = spawnSync(
		binary,
		['superuser', 'upsert', 'events@example.test', password, ...args],
		{ encoding: 'utf8' }
	);
	assert.equal(setup.status, 0, setup.stdout + setup.stderr);
	await start();
	await pb.collection('_superusers').authWithPassword('events@example.test', password);
	const user = await pb.collection('users').create({
		email: 'events-owner@example.test',
		password,
		passwordConfirm: password,
		name: 'QA Events',
		verified: true
	});
	const owner = new PocketBase(base);
	await owner.collection('users').authWithPassword(user.email, password);
	const { wedding_id: id } = await owner.send('/api/wedez/account/provision', { method: 'POST' });
	await owner.collection('users').authRefresh();
	await owner.collection('weddings').update(id, {
		slug: 'qa-events',
		address: fixture.address,
		maps: fixture.maps,
		akad: fixture.akad,
		reception: '2027-01-02T03:00:00Z'
	});
	const otherUser = await pb.collection('users').create({
		email: 'events-other@example.test',
		password,
		passwordConfirm: password,
		name: 'QA Other',
		verified: true
	});
	const sameDay = await pb.collection('weddings').create({
		owner: otherUser.id,
		slug: 'qa-same-day',
		plan_tier: 'free',
		theme: 'arsir',
		address: 'Lokasi sama',
		maps: fixture.maps,
		akad: fixture.akad,
		reception: fixture.reception
	});
	await stop();
	await cp(
		path.join(root, 'pocketbase/pb_migrations', migration),
		`${temp}/migrations/${migration}`
	);
	await start();
	const migrated = await owner.collection('weddings').getOne(id);
	assert.equal(migrated.separate_events, true);
	assert.equal(migrated.reception_address, fixture.address);
	assert.equal(migrated.reception_maps, fixture.maps);
	assert.equal((await pb.collection('weddings').getOne(sameDay.id)).separate_events, false);
	console.log('PASS migration preserves legacy locations and compares dates in WIB');
	await owner.collection('weddings').update(id, {
		separate_events: true,
		reception_address: 'Gedung B',
		reception_maps: fixture.reception_maps
	});
	const publicClient = new PocketBase(base);
	const publicRecord = await publicClient.collection('weddings').getOne(id, {
		fields: 'address,maps,separate_events,reception_address,reception_maps,akad,reception'
	});
	assert.equal(getEventLocation(publicRecord, 'reception').address, 'Gedung B');
	assert.equal(getEventLocation(publicRecord, 'reception').maps, fixture.reception_maps);
	await assert.rejects(
		() => owner.collection('weddings').update(id, { reception_maps: 'not-a-url' }),
		(error) => error.status === 400
	);
	await assert.rejects(
		() => publicClient.collection('weddings').update(id, { reception_address: 'Changed' }),
		(error) => [400, 401, 403, 404].includes(error.status)
	);
	await owner.collection('weddings').update(id, {
		separate_events: false,
		reception_address: '',
		reception_maps: '',
		reception: fixture.reception
	});
	const shared = await owner.collection('weddings').getOne(id);
	assert.equal(getEventLocation(shared, 'reception').address, fixture.address);
	assert.equal(shared.reception_address, '');
	console.log(
		'PASS owner persistence, public location contract, URL validation, access control, shared-mode reset'
	);
} catch (error) {
	if (error.response) console.error(JSON.stringify(error.response));
	throw error;
} finally {
	await stop();
}
