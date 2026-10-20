import { redirect } from '@sveltejs/kit';
import { requireVerifiedAccount } from '#lib/features/auth/api/guard.js';
import { getAuthenticatedName, getAuthenticatedEmail } from '#lib/features/auth/index.js';
import { getAccountHome, hasWedding } from '#lib/features/auth/model/navigation.js';
import { getAffiliateOverview } from '#lib/features/affiliates/api/affiliate.js';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ url, depends, fetch }) => {
	depends('wedez:affiliate');
	await requireVerifiedAccount(url.pathname, 'affiliate');
	if (getAccountHome() === '/start') redirect(307, '/start');
	return {
		overview: await getAffiliateOverview(fetch),
		name: getAuthenticatedName(),
		email: getAuthenticatedEmail(),
		hasWedding: hasWedding()
	};
};
