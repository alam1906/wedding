import { error } from '@sveltejs/kit';

import { WeddingDataError, getCurrentWedding } from '#lib/features/weddings/index.js';
import type { PageLoad } from './$types';

export const load = (async () => {
	try {
		return { wedding: await getCurrentWedding() };
	} catch (cause) {
		throw error(500, {
			message: cause instanceof WeddingDataError ? cause.message : 'Data wedding gagal dimuat.'
		});
	}
}) satisfies PageLoad;
