import { requireVerifiedAccount } from '#lib/features/auth/api/guard.js';
import type { PageLoad } from './$types';

export const prerender = false;
export const load: PageLoad = async ({ fetch }) => {
	await requireVerifiedAccount('/start', 'wedding', fetch);
};
