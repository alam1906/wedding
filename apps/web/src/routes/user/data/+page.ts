import { error } from '@sveltejs/kit';

import { MusicDataError, getMusicOptions } from '#lib/features/musics/index.js';
import { WeddingDataError, getCurrentWedding } from '#lib/features/weddings/index.js';
import type { PageLoad } from './$types';

export const load = (async () => {
	try {
		const wedding = await getCurrentWedding();

		try {
			return { wedding, musics: await getMusicOptions(), musicError: '' };
		} catch (cause) {
			return {
				wedding,
				musics: [],
				musicError: cause instanceof MusicDataError ? cause.message : 'Daftar musik gagal dimuat.'
			};
		}
	} catch (cause) {
		throw error(500, {
			message: cause instanceof WeddingDataError ? cause.message : 'Data wedding gagal dimuat.'
		});
	}
}) satisfies PageLoad;
