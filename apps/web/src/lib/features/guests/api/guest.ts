import { ClientResponseError, type RecordModel } from 'pocketbase';

import { pocketBase } from '#lib/infrastructure/pocketbase/index.js';
import type { Guest, GuestInput, GuestStatus } from '../model/guest.js';
import { INVALID_GUEST_WHATSAPP_MESSAGE, normalizeGuestWhatsapp } from '../model/guest-form.js';

const GUEST_FIELDS = [
	'id',
	'created_at',
	'wedding',
	'name',
	'whatsapp',
	'rsvp_status',
	'message',
	'rsvp_token',
	'guest_count'
] as const;
const RSVP_TOKEN_ALPHABET = 'abcdefghijklmnopqrstuvwxyz';
const RSVP_TOKEN_LENGTH = 6;
const RSVP_TOKEN_GENERATION_ATTEMPTS = 10;

export class GuestDataError extends Error {
	constructor(message: string, options?: ErrorOptions) {
		super(message, options);
		this.name = 'GuestDataError';
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

	throw new GuestDataError('Wedding untuk akun ini tidak ditemukan.');
}

function toGuest(record: RecordModel): Guest {
	return {
		id: record.id,
		created_at: typeof record.created_at === 'string' ? record.created_at : '',
		wedding: typeof record.wedding === 'string' ? record.wedding : '',
		name: typeof record.name === 'string' ? record.name : '',
		whatsapp: typeof record.whatsapp === 'string' ? record.whatsapp : '',
		rsvp_status:
			record.rsvp_status === 'attending' || record.rsvp_status === 'not_attending'
				? record.rsvp_status
				: 'pending',
		message: typeof record.message === 'string' ? record.message : '',
		rsvp_token: typeof record.rsvp_token === 'string' ? record.rsvp_token : '',
		guest_count: Number(record.guest_count) || 1
	};
}

function validationMessage(error: ClientResponseError): string | null {
	const responseData = error.response?.data;

	if (typeof responseData !== 'object' || responseData === null) {
		return null;
	}

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

	return null;
}

function guestErrorMessage(error: ClientResponseError): string {
	if (error.status === 400) {
		return validationMessage(error) ?? 'Data tamu tidak valid.';
	}

	if (error.status === 401 || error.status === 403 || error.status === 404) {
		return 'Anda tidak memiliki akses ke data tamu ini.';
	}

	if (error.status === 0) {
		return 'Tidak dapat terhubung ke server.';
	}

	return 'Data tamu gagal diproses.';
}

async function handleGuestRequest<T>(request: () => Promise<T>): Promise<T> {
	try {
		return await request();
	} catch (error) {
		if (error instanceof GuestDataError) {
			throw error;
		}

		const message =
			error instanceof ClientResponseError ? guestErrorMessage(error) : 'Data tamu gagal diproses.';

		throw new GuestDataError(message, { cause: error });
	}
}

function normalizeWhatsapp(value: string): string {
	const normalized = normalizeGuestWhatsapp(value);
	if (!normalized) {
		throw new GuestDataError(INVALID_GUEST_WHATSAPP_MESSAGE);
	}

	return normalized;
}

function guestPayload(input: GuestInput): Record<string, unknown> {
	return {
		name: input.name.trim(),
		whatsapp: normalizeWhatsapp(input.whatsapp),
		rsvp_status: input.rsvp_status,
		message: input.message.trim(),
		guest_count: input.guest_count
	};
}

function createRsvpToken(): string {
	let token = '';

	while (token.length < RSVP_TOKEN_LENGTH) {
		const bytes = crypto.getRandomValues(new Uint8Array(RSVP_TOKEN_LENGTH));

		for (const byte of bytes) {
			if (byte >= 234) continue;

			token += RSVP_TOKEN_ALPHABET[byte % RSVP_TOKEN_ALPHABET.length];
			if (token.length === RSVP_TOKEN_LENGTH) break;
		}
	}

	return token;
}

function containsRsvpTokenConflict(value: unknown): boolean {
	if (typeof value !== 'object' || value === null) return false;

	for (const [key, nestedValue] of Object.entries(value)) {
		if (
			key === 'rsvp_token' &&
			typeof nestedValue === 'object' &&
			nestedValue !== null &&
			'code' in nestedValue &&
			nestedValue.code === 'validation_not_unique'
		) {
			return true;
		}

		if (containsRsvpTokenConflict(nestedValue)) return true;
	}

	return false;
}

function isRsvpTokenConflict(error: unknown): boolean {
	return (
		error instanceof ClientResponseError &&
		error.status === 400 &&
		containsRsvpTokenConflict(error.response)
	);
}

export const GUEST_PAGE_SIZE = 50;
export type GuestPageQuery = {
	page?: number;
	search?: string;
	status?: 'all' | GuestStatus;
	sort?: 'name' | 'created_at';
	direction?: 'ascending' | 'descending';
	signal?: AbortSignal;
};
export type GuestPage = {
	items: Guest[];
	page: number;
	totalPages: number;
	totalItems: number;
};

export function getGuestPage(query: GuestPageQuery = {}): Promise<GuestPage> {
	return handleGuestRequest(async () => {
		const weddingId = getCurrentWeddingId();
		const filters = [pocketBase.filter('wedding = {:weddingId}', { weddingId })];
		if (query.search?.trim()) {
			// Escape LIKE wildcards so searching for "%" or "_" remains literal.
			const search = `%${query.search.trim().replace(/[\\%_]/g, '\\$&')}%`;
			filters.push(pocketBase.filter('(name ~ {:search} || whatsapp ~ {:search})', { search }));
		}
		if (query.status && query.status !== 'all') {
			filters.push(pocketBase.filter('rsvp_status = {:status}', { status: query.status }));
		}
		const sort = query.sort === 'created_at' ? 'created_at' : 'name';
		const records = await pocketBase
			.collection('guests')
			.getList(query.page ?? 1, GUEST_PAGE_SIZE, {
				cache: 'no-store',
				filter: filters.join(' && '),
				sort: `${query.direction === 'descending' ? '-' : ''}${sort},id`,
				fields: GUEST_FIELDS.join(','),
				requestKey: null,
				signal: query.signal
			});

		return { ...records, items: records.items.map(toGuest) };
	});
}

export function getExistingGuestNumbers(numbers: string[]): Promise<Set<string>> {
	return handleGuestRequest(async () => {
		const remaining = new Set(numbers);
		if (remaining.size > 50) throw new GuestDataError('Pemeriksaan CSV maksimal 50 nomor.');
		const existing = new Set<string>();
		const weddingId = getCurrentWeddingId();
		// Query only candidate numbers, not every guest. Removing each matched
		// number also bounds reads when legacy records contain many duplicates.
		while (remaining.size) {
			const candidates = [...remaining].map((number) =>
				pocketBase.filter('whatsapp = {:number}', { number })
			);
			const result = await pocketBase.collection('guests').getList(1, 50, {
				filter: `${pocketBase.filter('wedding = {:weddingId}', { weddingId })} && (${candidates.join(' || ')})`,
				fields: 'whatsapp',
				skipTotal: true,
				requestKey: null,
				cache: 'no-store'
			});
			if (!result.items.length) break;
			for (const record of result.items) {
				existing.add(record.whatsapp);
				remaining.delete(record.whatsapp);
			}
		}
		return existing;
	});
}

export function createGuest(input: GuestInput): Promise<Guest> {
	return handleGuestRequest(async () => {
		const payload = guestPayload(input);
		const weddingId = getCurrentWeddingId();

		for (let attempt = 0; attempt < RSVP_TOKEN_GENERATION_ATTEMPTS; attempt += 1) {
			const token = createRsvpToken();

			try {
				const record = await pocketBase.collection('guests').create(
					{
						...payload,
						wedding: weddingId,
						rsvp_token: token
					},
					{ fields: GUEST_FIELDS.join(','), requestKey: null }
				);

				return toGuest(record);
			} catch (error) {
				if (!isRsvpTokenConflict(error)) {
					throw error;
				}
			}
		}

		throw new GuestDataError('Token RSVP unik gagal dibuat. Silakan coba lagi.');
	});
}

export function createGuests(inputs: GuestInput[]): Promise<Guest[]> {
	return handleGuestRequest(async () => {
		if (inputs.length === 0) return [];

		const weddingId = getCurrentWeddingId();

		for (let attempt = 0; attempt < RSVP_TOKEN_GENERATION_ATTEMPTS; attempt += 1) {
			const batch = pocketBase.createBatch();

			for (const input of inputs) {
				batch.collection('guests').create(
					{
						...guestPayload(input),
						wedding: weddingId,
						rsvp_token: createRsvpToken()
					},
					{ fields: GUEST_FIELDS.join(',') }
				);
			}

			try {
				const results = await batch.send({ requestKey: null });
				return results.map((result) => toGuest(result.body as RecordModel));
			} catch (error) {
				if (!isRsvpTokenConflict(error)) throw error;
			}
		}

		throw new GuestDataError('Token RSVP unik gagal dibuat. Silakan coba lagi.');
	});
}

export function updateGuest(id: string, input: GuestInput): Promise<Guest> {
	return handleGuestRequest(async () => {
		const record = await pocketBase.collection('guests').update(id, guestPayload(input), {
			fields: GUEST_FIELDS.join(',')
		});

		return toGuest(record);
	});
}

export function deleteGuest(id: string): Promise<boolean> {
	return handleGuestRequest(() => pocketBase.collection('guests').delete(id));
}
