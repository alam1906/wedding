import { browser } from '$app/env';
import { redirect } from '@sveltejs/kit';

import { requireVerifiedAccount } from '#lib/features/auth/api/guard.js';
import { hasWedding, getAccountHome } from '#lib/features/auth/model/navigation.js';
import type { LayoutLoad } from './$types';

export const prerender = false;

export const load: LayoutLoad = async ({ url }) => {
	await requireVerifiedAccount(url.pathname, 'wedding');
	if (browser && !hasWedding()) redirect(307, getAccountHome());
};
