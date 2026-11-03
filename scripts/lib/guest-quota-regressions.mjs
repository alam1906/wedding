import assert from 'node:assert/strict';

export async function testGuestQuotas({ pb, user, provision, guest, check, denied }) {
	const owner = await user();
	const wedding = await provision(owner.client);
	const client = owner.client;
	const quota = () => client.send('/api/wedez/guests/quota');
	const count = async () => (await client.collection('guests').getList(1, 1)).totalItems;
	const addBatch = async (size) => {
		const batch = client.createBatch();
		for (let i = 0; i < size; i++) batch.collection('guests').create(guest(wedding));
		return batch.send();
	};
	await check(
		'Free quota is owner-scoped, uncached and counts invitations rather than headcount',
		async () => {
			assert.deepEqual(await quota(), { plan_tier: 'free', total: 0, limit: 30 });
			await client.collection('guests').create(guest(wedding, { guest_count: 4 }));
			assert.deepEqual(await quota(), { plan_tier: 'free', total: 1, limit: 30 });
			const other = await user();
			await provision(other.client);
			assert.equal((await other.client.send('/api/wedez/guests/quota')).total, 0);
			assert.equal(
				(await other.client.send(`/api/wedez/guests/quota?wedding=${wedding}`)).total,
				0
			);
			const response = await fetch(`${client.baseURL}/api/wedez/guests/quota`, {
				headers: { Authorization: client.authStore.token }
			});
			assert.equal(response.headers.get('cache-control'), 'no-store');
			assert.equal((await fetch(`${client.baseURL}/api/wedez/guests/quota`)).status, 401);
		}
	);
	await check(
		'Free rejects a CSV batch exceeding the remaining quota without partial imports',
		async () => {
			await addBatch(28);
			await assert.rejects(
				() => addBatch(2),
				(error) => {
					assert.equal(error.status, 400);
					assert.match(JSON.stringify(error.response), /guest_limit_reached/);
					return true;
				}
			);
			assert.equal(await count(), 29);
		}
	);
	await check(
		'simultaneous Free creates admit only the final available slot and reject guest 31',
		async () => {
			const results = await Promise.allSettled(
				Array.from({ length: 5 }, () => client.collection('guests').create(guest(wedding)))
			);
			assert.equal(results.filter((r) => r.status === 'fulfilled').length, 1);
			for (const result of results.filter((r) => r.status === 'rejected')) {
				assert.equal(result.reason.status, 400);
				assert.match(JSON.stringify(result.reason.response), /guest_limit_reached/);
			}
			assert.equal(await count(), 30);
			await denied(() => client.collection('guests').create(guest(wedding)));
			assert.deepEqual(await quota(), { plan_tier: 'free', total: 30, limit: 30 });
		}
	);
	await check(
		'Free at capacity permits edits and RSVP, deletion frees a slot, and exactly 30 can be imported',
		async () => {
			const existing = (await client.collection('guests').getList(1, 1)).items[0];
			await client.collection('guests').update(existing.id, { name: 'Edited at capacity' });
			await client.collection('weddings').update(wedding, { slug: `quota-${wedding}` });
			const rsvp = await client.send('/api/wedez/rsvp/respond', {
				method: 'POST',
				body: {
					slug: `quota-${wedding}`,
					token: existing.rsvp_token,
					rsvp_status: 'attending',
					message: ''
				}
			});
			assert.equal(rsvp.rsvp_status, 'attending');
			await client.collection('guests').delete(existing.id);
			await client.collection('guests').create(guest(wedding));
			assert.equal(await count(), 30);
			const fresh = await user();
			const freshWedding = await provision(fresh.client);
			const batch = fresh.client.createBatch();
			for (let i = 0; i < 30; i++) batch.collection('guests').create(guest(freshWedding));
			assert.equal((await batch.send()).length, 30);
		}
	);
	await check(
		'Pro lifts the quota; returning to Free preserves existing guests and edits',
		async () => {
			await pb.collection('weddings').update(wedding, { plan_tier: 'pro' });
			await addBatch(50);
			assert.deepEqual(await quota(), { plan_tier: 'pro', total: 80, limit: null });
			await pb.collection('weddings').update(wedding, { plan_tier: 'free' });
			assert.deepEqual(await quota(), { plan_tier: 'free', total: 80, limit: 30 });
			const existing = (await client.collection('guests').getList(1, 1)).items[0];
			await client.collection('guests').update(existing.id, { name: 'Legacy guest retained' });
			await denied(() => client.collection('guests').create(guest(wedding)));
			// Model hooks also protect server-side saves and moving records into a full wedding.
			await denied(() => pb.collection('guests').create(guest(wedding)));
			const other = await user();
			const otherWedding = await provision(other.client);
			const moved = await other.client.collection('guests').create(guest(otherWedding));
			await denied(() => pb.collection('guests').update(moved.id, { wedding }));
			assert.equal(await count(), 80);
		}
	);
}
