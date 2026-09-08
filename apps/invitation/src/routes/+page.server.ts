import { getWeddingBySlug, PublicWeddingError } from '#lib/server/wedding.js';
import type { PageServerLoad } from './$types';

const DEFAULT_WEDDING_URL = 'https://wedding.onlytest.my.id';

export const load = (async ({ locals }) => {
	const mainWebsiteUrl = (
		import.meta.env.PUBLIC_WEDDING_URL?.trim() || DEFAULT_WEDDING_URL
	).replace(/\/+$/, '');

	if (!locals.weddingSlug) {
		return {
			wedding: null,
			errorMessage: 'Alamat undangan tidak valid.',
			mainWebsiteUrl
		};
	}

	try {
		return {
			wedding: await getWeddingBySlug(locals.weddingSlug),
			errorMessage: '',
			mainWebsiteUrl
		};
	} catch (error) {
		return {
			wedding: null,
			errorMessage:
				error instanceof PublicWeddingError
					? error.message
					: 'Undangan tidak ditemukan atau belum dipublikasikan.',
			mainWebsiteUrl
		};
	}
}) satisfies PageServerLoad;
