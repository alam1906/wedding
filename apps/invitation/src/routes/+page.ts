import { getWeddingBySlug, PublicWeddingError } from '#lib/features/weddings/api/public-wedding.js';
import { getWeddingSlug } from '#lib/features/weddings/model/wedding-url.js';
import type { PageLoad } from './$types';

const DEFAULT_WEDDING_URL = 'https://wedding.onlytest.my.id';

export const load = (async ({ fetch, url }) => {
	const mainWebsiteUrl = (
		import.meta.env.PUBLIC_WEDDING_URL?.trim() || DEFAULT_WEDDING_URL
	).replace(/\/+$/, '');
	const weddingSlug = getWeddingSlug(url);

	if (!weddingSlug) {
		return {
			wedding: null,
			errorMessage: 'Alamat undangan tidak valid.',
			mainWebsiteUrl
		};
	}

	try {
		return {
			wedding: await getWeddingBySlug(weddingSlug, fetch),
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
}) satisfies PageLoad;
