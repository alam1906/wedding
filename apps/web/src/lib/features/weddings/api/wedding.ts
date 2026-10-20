import { ClientResponseError, type RecordModel } from 'pocketbase';

import { pocketBase } from '#lib/infrastructure/pocketbase/index.js';
import type { WeddingData, WeddingStoryItem, WeddingStorySaveInput } from '../model/wedding.js';

const PUBLIC_WEDDING_FIELDS = [
	'id',
	'collectionId',
	'collectionName',
	'slug',
	'theme',
	'music',
	'plan_tier',
	'gift_enabled',
	'groom_gift_hidden',
	'bride_gift_hidden',
	'groom_name',
	'groom_father_name',
	'groom_mother_name',
	'groom_photo',
	'groom_payment_number',
	'groom_payment_provider',
	'groom_payment_account_name',
	'bride_name',
	'bride_father_name',
	'bride_mother_name',
	'bride_photo',
	'bride_payment_number',
	'bride_payment_provider',
	'bride_payment_account_name',
	'cover',
	'quote',
	'address',
	'separate_events',
	'reception_address',
	'reception_maps',
	'maps',
	'akad',
	'reception',
	'gallery'
] as const;

const OWNER_WEDDING_FIELDS = [...PUBLIC_WEDDING_FIELDS, 'whatsapp_template'] as const;

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

export class WeddingDataError extends Error {
	constructor(message: string, options?: ErrorOptions) {
		super(message, options);
		this.name = 'WeddingDataError';
	}
}

function getCurrentWeddingId(): string {
	const weddingId = pocketBase.authStore.record?.wedding_id;

	if (typeof weddingId === 'string' && weddingId.length > 0) {
		return weddingId;
	}

	if (Array.isArray(weddingId) && typeof weddingId[0] === 'string') {
		return weddingId[0];
	}

	throw new WeddingDataError('Wedding untuk akun ini tidak ditemukan.');
}

function fileURL(record: RecordModel, filename: unknown, thumb?: string): string {
	if (typeof filename !== 'string' || filename.length === 0) {
		return '';
	}

	return pocketBase.files.getURL(record, filename, thumb ? { thumb } : undefined);
}

function toWeddingStory(record: RecordModel): WeddingStoryItem {
	const image = typeof record.image === 'string' ? record.image : '';

	return {
		id: record.id,
		title: typeof record.title === 'string' ? record.title : '',
		content: typeof record.content === 'string' ? record.content : '',
		date: typeof record.date === 'string' ? record.date : '',
		image,
		image_url: fileURL(record, image, '1200x800'),
		sort_order: Number(record.sort_order) || 0
	};
}

function toWeddingData(record: RecordModel, stories: WeddingStoryItem[]): WeddingData {
	const galleryNames = Array.isArray(record.gallery)
		? record.gallery.filter((filename): filename is string => typeof filename === 'string')
		: [];

	return {
		id: record.id,
		slug: typeof record.slug === 'string' ? record.slug : '',
		theme: typeof record.theme === 'string' && record.theme ? record.theme : 'nocturne',
		music: typeof record.music === 'string' ? record.music : '',
		plan_tier: record.plan_tier === 'pro' ? 'pro' : 'free',
		gift_enabled: record.gift_enabled === true,
		groom_gift_hidden: record.groom_gift_hidden === true,
		bride_gift_hidden: record.bride_gift_hidden === true,
		whatsapp_template: typeof record.whatsapp_template === 'string' ? record.whatsapp_template : '',
		groom_name: typeof record.groom_name === 'string' ? record.groom_name : '',
		groom_father_name: typeof record.groom_father_name === 'string' ? record.groom_father_name : '',
		groom_mother_name: typeof record.groom_mother_name === 'string' ? record.groom_mother_name : '',
		groom_photo: typeof record.groom_photo === 'string' ? record.groom_photo : '',
		groom_photo_url: fileURL(record, record.groom_photo, '400x400'),
		groom_payment_number:
			typeof record.groom_payment_number === 'string' ? record.groom_payment_number : '',
		groom_payment_provider:
			typeof record.groom_payment_provider === 'string' ? record.groom_payment_provider : '',
		groom_payment_account_name:
			typeof record.groom_payment_account_name === 'string'
				? record.groom_payment_account_name
				: '',
		bride_name: typeof record.bride_name === 'string' ? record.bride_name : '',
		bride_father_name: typeof record.bride_father_name === 'string' ? record.bride_father_name : '',
		bride_mother_name: typeof record.bride_mother_name === 'string' ? record.bride_mother_name : '',
		bride_photo: typeof record.bride_photo === 'string' ? record.bride_photo : '',
		bride_photo_url: fileURL(record, record.bride_photo, '400x400'),
		bride_payment_number:
			typeof record.bride_payment_number === 'string' ? record.bride_payment_number : '',
		bride_payment_provider:
			typeof record.bride_payment_provider === 'string' ? record.bride_payment_provider : '',
		bride_payment_account_name:
			typeof record.bride_payment_account_name === 'string'
				? record.bride_payment_account_name
				: '',
		cover: typeof record.cover === 'string' ? record.cover : '',
		cover_url: fileURL(record, record.cover, '800x500'),
		quote: typeof record.quote === 'string' ? record.quote : '',
		address: typeof record.address === 'string' ? record.address : '',
		separate_events: record.separate_events === true,
		reception_address: typeof record.reception_address === 'string' ? record.reception_address : '',
		reception_maps: typeof record.reception_maps === 'string' ? record.reception_maps : '',
		maps: typeof record.maps === 'string' ? record.maps : '',
		akad: typeof record.akad === 'string' ? record.akad : '',
		reception: typeof record.reception === 'string' ? record.reception : '',
		gallery: galleryNames.map((name) => ({
			name,
			url: fileURL(record, name, '400x400')
		})),
		stories
	};
}

function getWeddingDataErrorMessage(error: ClientResponseError): string {
	if (error.status === 400) {
		const responseData = error.response?.data;

		if (typeof responseData === 'object' && responseData !== null) {
			for (const validation of Object.values(responseData)) {
				if (
					typeof validation === 'object' &&
					validation !== null &&
					'message' in validation &&
					typeof validation.message === 'string'
				) {
					return validation.message;
				}
			}
		}

		return 'Data yang dikirim tidak valid atau domain sudah digunakan.';
	}

	if (error.status === 401 || error.status === 403 || error.status === 404) {
		return 'Anda tidak memiliki akses ke data wedding ini.';
	}

	if (error.status === 0) {
		return 'Tidak dapat terhubung ke server.';
	}

	return 'Data wedding gagal diproses.';
}

async function getWeddingStories(weddingId: string): Promise<WeddingStoryItem[]> {
	const records = await pocketBase.collection('wedding_stories').getFullList({
		filter: pocketBase.filter('wedding = {:weddingId}', { weddingId }),
		fields: WEDDING_STORY_FIELDS.join(','),
		sort: 'sort_order,date,id',
		requestKey: `wedding-stories-${weddingId}`
	});

	return records.map(toWeddingStory);
}

async function handleWeddingRequest(request: () => Promise<RecordModel>): Promise<WeddingData> {
	try {
		const record = await request();
		return toWeddingData(record, await getWeddingStories(record.id));
	} catch (error) {
		if (error instanceof WeddingDataError) {
			throw error;
		}

		const message =
			error instanceof ClientResponseError
				? getWeddingDataErrorMessage(error)
				: 'Data wedding gagal diproses.';

		throw new WeddingDataError(message, { cause: error });
	}
}

export function getCurrentWedding(): Promise<WeddingData> {
	return handleWeddingRequest(() =>
		pocketBase.collection('weddings').getOne(getCurrentWeddingId(), {
			fields: OWNER_WEDDING_FIELDS.join(',')
		})
	);
}

export function getWeddingBySlug(slug: string): Promise<WeddingData> {
	return handleWeddingRequest(() =>
		pocketBase
			.collection('weddings')
			.getFirstListItem(pocketBase.filter('slug = {:slug}', { slug }), {
				fields: PUBLIC_WEDDING_FIELDS.join(','),
				requestKey: `public-wedding-${slug}`
			})
	);
}

export async function getCurrentWeddingSlug(): Promise<string> {
	try {
		const weddingId = getCurrentWeddingId();
		const record = await pocketBase.collection('weddings').getOne(weddingId, {
			fields: 'slug',
			requestKey: `current-wedding-slug-${weddingId}`
		});

		return typeof record.slug === 'string' ? record.slug : '';
	} catch (error) {
		if (error instanceof WeddingDataError) {
			throw error;
		}

		const message =
			error instanceof ClientResponseError
				? getWeddingDataErrorMessage(error)
				: 'Domain wedding gagal dimuat.';

		throw new WeddingDataError(message, { cause: error });
	}
}

export function updateCurrentWedding(
	data: FormData | Record<string, unknown>
): Promise<WeddingData> {
	return handleWeddingRequest(() =>
		pocketBase.collection('weddings').update(getCurrentWeddingId(), data, {
			fields: OWNER_WEDDING_FIELDS.join(',')
		})
	);
}

function toStoryDate(value: string): string {
	if (!value) {
		return '';
	}

	return value.length === 10 ? `${value} 00:00:00.000Z` : value;
}

function storyPayload(
	weddingId: string,
	story: WeddingStorySaveInput,
	sortOrder: number
): Record<string, unknown> {
	const payload: Record<string, unknown> = {
		wedding: weddingId,
		title: story.title.trim(),
		content: story.content.trim(),
		date: toStoryDate(story.date),
		sort_order: sortOrder
	};

	if (story.imageFile) {
		payload.image = story.imageFile;
	} else if (story.removeImage) {
		payload.image = '';
	}

	return payload;
}

export async function saveCurrentWeddingStories(
	stories: WeddingStorySaveInput[]
): Promise<WeddingStoryItem[]> {
	try {
		const weddingId = getCurrentWeddingId();
		const currentStories = await getWeddingStories(weddingId);
		const currentStoryIds = new Set(currentStories.map((story) => story.id));
		const retainedStoryIds = new Set<string>();
		const batch = pocketBase.createBatch();
		let operations = 0;

		for (const [index, story] of stories.entries()) {
			const payload = storyPayload(weddingId, story, index + 1);

			if (currentStoryIds.has(story.id)) {
				batch.collection('wedding_stories').update(story.id, payload);
				retainedStoryIds.add(story.id);
			} else {
				batch.collection('wedding_stories').create(payload);
			}
			operations++;
		}

		for (const story of currentStories) {
			if (!retainedStoryIds.has(story.id)) {
				batch.collection('wedding_stories').delete(story.id);
				operations++;
			}
		}
		if (operations > 50) {
			throw new WeddingDataError(
				'Maksimal 50 perubahan kisah dalam sekali simpan. Kurangi perubahan lalu coba lagi.'
			);
		}
		if (operations) await batch.send({ requestKey: null });

		return await getWeddingStories(weddingId);
	} catch (error) {
		if (error instanceof WeddingDataError) {
			throw error;
		}

		const message =
			error instanceof ClientResponseError
				? getWeddingDataErrorMessage(error)
				: 'Kisah cinta gagal disimpan.';

		throw new WeddingDataError(message, { cause: error });
	}
}
