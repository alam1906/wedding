import assert from 'node:assert/strict';

export async function testThemeAccess({ pb, user, provision, check, denied, themes }) {
	const owner = await user();
	const id = await provision(owner.client);
	const weddings = owner.client.collection('weddings');
	const summary = () => owner.client.send('/api/wedez/weddings/summary');
	const free = (await summary()).free_theme_keys;
	const premium = themes.filter((theme) => !free.includes(theme));
	await check(
		'Free has exactly 10 stable, registered themes including the provisioned default',
		async () => {
			assert.deepEqual(free, [
				'minimalist-1',
				'minimalist-2',
				'minimalist-3',
				'neubrutalism-1',
				'neubrutalism-2',
				'neubrutalism-3',
				'playful-1',
				'playful-2',
				'playful-3',
				'nocturne'
			]);
			assert.equal(new Set(free).size, 10);
			assert.ok(free.every((theme) => themes.includes(theme)));
			assert.ok(free.includes((await weddings.getOne(id)).theme));
			for (const theme of free) assert.equal((await weddings.update(id, { theme })).theme, theme);
		}
	);
	await check(
		'Free cannot select any premium theme through direct API requests or plan spoofing',
		async () => {
			for (const theme of premium) {
				await assert.rejects(
					() => weddings.update(id, { theme }),
					(error) => {
						assert.equal(error.status, 400);
						assert.equal(error.response.data.theme.code, 'theme_requires_pro');
						return true;
					}
				);
			}
			await denied(() => weddings.update(id, { theme: premium[0], plan_tier: 'pro' }));
			assert.equal((await weddings.getOne(id)).theme, 'nocturne');
			await denied(() => pb.collection('weddings').update(id, { theme: premium[0] }));
		}
	);
	await check(
		'premium selections in batches roll back earlier changes and new Free records are protected',
		async () => {
			const original = await weddings.getOne(id);
			const batch = owner.client.createBatch();
			batch.collection('weddings').update(id, { slug: `theme-${id}` });
			batch.collection('weddings').update(id, { theme: premium[0] });
			await denied(() => batch.send());
			assert.equal((await weddings.getOne(id)).slug, original.slug);
			const other = await user();
			await denied(() =>
				pb
					.collection('weddings')
					.create({ owner: other.record.id, plan_tier: 'free', theme: premium[0] })
			);
		}
	);
	await check(
		'Pro can select every registered theme, and legacy Free premium themes stay unchanged until switched',
		async () => {
			await pb.collection('weddings').update(id, { plan_tier: 'pro' });
			for (const theme of themes) assert.equal((await weddings.update(id, { theme })).theme, theme);
			const activePremium = (await weddings.getOne(id)).theme;
			assert.ok(premium.includes(activePremium));
			await pb.collection('weddings').update(id, { plan_tier: 'free' });
			assert.equal((await weddings.getOne(id)).theme, activePremium);
			await weddings.update(id, { groom_name: 'Legacy theme retained', theme: activePremium });
			assert.equal((await weddings.getOne(id)).theme, activePremium);
			await weddings.update(id, { theme: free[0] });
			await denied(() => weddings.update(id, { theme: activePremium }));
		}
	);
}
