import { browser } from '$app/env';
import { redirect } from '@sveltejs/kit';

import { requireVerifiedAccount } from '#lib/features/auth/api/guard.js';
import { hasWedding, getAccountHome } from '#lib/features/auth/model/navigation.js';
import { pocketBase } from '#lib/infrastructure/pocketbase/index.js';
import type { LayoutLoad } from './$types';

export const prerender = false;

export const load: LayoutLoad = async ({ url, fetch }) => {
	await requireVerifiedAccount(url.pathname, 'wedding', fetch);
	if (browser && !hasWedding()) redirect(307, getAccountHome());
	const memberships = await pocketBase
		.collection('affiliates')
		.getList(1, 1, { fields: 'id', fetch });
	return { hasAffiliate: memberships.items.length > 0 };
};
