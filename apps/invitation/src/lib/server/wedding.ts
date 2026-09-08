import PocketBase, { ClientResponseError, type RecordModel } from 'pocketbase';

import { pocketBaseUrl } from '#lib/infrastructure/pocketbase/index.js';
import type { WeddingData, WeddingStoryItem } from '#lib/features/weddings/model/wedding.js';

const PUBLIC_WEDDING_FIELDS = [
	'id',
	'collectionId',
	'collectionName',
	'slug',
	'theme',
	'plan_tier',
	'groom_name',
	'groom_father_name',
	'groom_mother_name',
	'groom_photo',
	'groom_payment_number',
	'groom_payment_provider',
	'bride_name',
	'bride_father_name',
	'bride_mother_name',
	'bride_photo',
	'bride_payment_number',
	'bride_payment_provider',
	'cover',
	'quote',
	'address',
	'maps',
	'akad',
	'reception',
	'music',
	'gallery'
] as const;

const WEDDING_STORY_FIELDS = [
	'id',
	'collectionId',
	'collectionName',
	'wedding',
	'title',
	'content',
	'date',
	'image',
	'sort_order'
] as const;

export class PublicWeddingError extends Error {
	constructor(message: string, options?: ErrorOptions) {
		super(message, options);
		this.name = 'PublicWeddingError';
	}
}

function fileURL(
	client: PocketBase,
	record: RecordModel,
	filename: unknown,
	thumb?: string
): string {
	if (typeof filename !== 'string' || filename.length === 0) return '';
	return client.files.getURL(record, filename, thumb ? { thumb } : undefined);
}

function toWeddingStory(client: PocketBase, record: RecordModel): WeddingStoryItem {
	const image = typeof record.image === 'string' ? record.image : '';

	return {
		id: record.id,
		title: typeof record.title === 'string' ? record.title : '',
		content: typeof record.content === 'string' ? record.content : '',
		date: typeof record.date === 'string' ? record.date : '',
		image,
		image_url: fileURL(client, record, image, '1200x800'),
		sort_order: Number(record.sort_order) || 0
	};
}

function toWeddingData(
	client: PocketBase,
	record: RecordModel,
	stories: WeddingStoryItem[],
	music: { id: string; title: string; url: string } | null
): WeddingData {
	const galleryNames = Array.isArray(record.gallery)
		? record.gallery.filter((filename): filename is string => typeof filename === 'string')
		: [];

	return {
		id: record.id,
		slug: typeof record.slug === 'string' ? record.slug : '',
		theme: typeof record.theme === 'string' && record.theme ? record.theme : 'minimalist-1',
		plan_tier: record.plan_tier === 'pro' ? 'pro' : 'free',
		groom_name: typeof record.groom_name === 'string' ? record.groom_name : '',
		groom_father_name: typeof record.groom_father_name === 'string' ? record.groom_father_name : '',
		groom_mother_name: typeof record.groom_mother_name === 'string' ? record.groom_mother_name : '',
		groom_photo: typeof record.groom_photo === 'string' ? record.groom_photo : '',
		groom_photo_url: fileURL(client, record, record.groom_photo, '400x400'),
		groom_payment_number:
			typeof record.groom_payment_number === 'string' ? record.groom_payment_number : '',
		groom_payment_provider:
			typeof record.groom_payment_provider === 'string' ? record.groom_payment_provider : '',
		bride_name: typeof record.bride_name === 'string' ? record.bride_name : '',
		bride_father_name: typeof record.bride_father_name === 'string' ? record.bride_father_name : '',
		bride_mother_name: typeof record.bride_mother_name === 'string' ? record.bride_mother_name : '',
		bride_photo: typeof record.bride_photo === 'string' ? record.bride_photo : '',
		bride_photo_url: fileURL(client, record, record.bride_photo, '400x400'),
		bride_payment_number:
			typeof record.bride_payment_number === 'string' ? record.bride_payment_number : '',
		bride_payment_provider:
			typeof record.bride_payment_provider === 'string' ? record.bride_payment_provider : '',
		cover: typeof record.cover === 'string' ? record.cover : '',
		cover_url: fileURL(client, record, record.cover, '800x500'),
		quote: typeof record.quote === 'string' ? record.quote : '',
		address: typeof record.address === 'string' ? record.address : '',
		maps: typeof record.maps === 'string' ? record.maps : '',
		akad: typeof record.akad === 'string' ? record.akad : '',
		reception: typeof record.reception === 'string' ? record.reception : '',
		music: music?.id ?? '',
		music_title: music?.title ?? '',
		music_url: music?.url ?? '',
		gallery: galleryNames.map((name) => ({
			name,
			url: fileURL(client, record, name, '400x400')
		})),
		stories
	};
}

async function getWeddingMusic(
	client: PocketBase,
	musicId: unknown
): Promise<{ id: string; title: string; url: string } | null> {
	if (typeof musicId !== 'string' || musicId.length === 0) return null;

	try {
		const record = await client.collection('musics').getOne(musicId, {
			fields: 'id,collectionId,collectionName,title,music'
		});
		const filename = typeof record.music === 'string' ? record.music : '';
		if (!filename) return null;

		return {
			id: record.id,
			title: typeof record.title === 'string' ? record.title.trim() : '',
			url: fileURL(client, record, filename)
		};
	} catch {
		// Musik bersifat pelengkap; undangan tetap dapat dibuka jika rekamannya sudah dihapus.
		return null;
	}
}

function errorMessage(error: ClientResponseError): string {
	if (error.status === 0) return 'Tidak dapat terhubung ke server.';
	return 'Undangan tidak ditemukan atau belum dipublikasikan.';
}

export async function getWeddingBySlug(slug: string): Promise<WeddingData> {
	const client = new PocketBase(pocketBaseUrl);

	try {
		const record = await client
			.collection('weddings')
			.getFirstListItem(client.filter('slug = {:slug}', { slug }), {
				fields: PUBLIC_WEDDING_FIELDS.join(',')
			});
		const [storyRecords, music] = await Promise.all([
			client.collection('wedding_stories').getFullList({
				filter: client.filter('wedding = {:weddingId}', { weddingId: record.id }),
				fields: WEDDING_STORY_FIELDS.join(','),
				sort: 'sort_order,date,id'
			}),
			getWeddingMusic(client, record.music)
		]);

		return toWeddingData(
			client,
			record,
			storyRecords.map((story) => toWeddingStory(client, story)),
			music
		);
	} catch (error) {
		throw new PublicWeddingError(
			error instanceof ClientResponseError ? errorMessage(error) : 'Undangan gagal dimuat.',
			{ cause: error }
		);
	}
}
