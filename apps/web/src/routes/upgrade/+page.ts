import { browser } from '$app/env';
import { redirect } from '@sveltejs/kit';

import { requireVerifiedAccount } from '#lib/features/auth/api/guard.js';
import { hasWedding } from '#lib/features/auth/model/navigation.js';
import type { PageLoad } from './$types';

export const prerender = false;

export const load: PageLoad = async ({ fetch }) => {
	await requireVerifiedAccount('/upgrade', 'wedding', fetch);
	if (browser && !hasWedding()) redirect(307, '/start');
};
