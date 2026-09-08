import { ClientResponseError, type RecordModel } from 'pocketbase';

import { pocketBase } from '#lib/infrastructure/pocketbase/index.js';
import type { MusicOption } from '../model/music.js';

const MUSIC_FIELDS = ['id', 'collectionId', 'collectionName', 'title', 'music'] as const;

export class MusicDataError extends Error {
	constructor(message: string, options?: ErrorOptions) {
		super(message, options);
		this.name = 'MusicDataError';
	}
}

function toMusicOption(record: RecordModel): MusicOption {
	const music = typeof record.music === 'string' ? record.music : '';

	return {
		id: record.id,
		title: typeof record.title === 'string' ? record.title.trim() : '',
		music,
		music_url: music ? pocketBase.files.getURL(record, music) : ''
	};
}

export async function getMusicOptions(): Promise<MusicOption[]> {
	try {
		const records = await pocketBase.collection('musics').getFullList({
			fields: MUSIC_FIELDS.join(','),
			filter: "title != '' && music != ''",
			sort: 'title,id',
			requestKey: 'music-options'
		});

		return records.map(toMusicOption);
	} catch (error) {
		const message =
			error instanceof ClientResponseError && error.status === 0
				? 'Tidak dapat terhubung ke server musik.'
				: 'Daftar musik gagal dimuat.';

		throw new MusicDataError(message, { cause: error });
	}
}
