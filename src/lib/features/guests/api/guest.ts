import { ClientResponseError, type RecordModel } from 'pocketbase';

import { pocketBase } from '#lib/infrastructure/pocketbase/index.js';
import type { Guest, GuestInput } from '../model/guest.js';

const GUEST_FIELDS = [
	'id',
	'wedding',
	'name',
	'whatsapp',
	'rsvp_status',
	'message',
	'rsvp_token',
	'guest_count'
] as const;

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
	const digits = value.replace(/\D/g, '');
	let normalized = '';

	if (digits.startsWith('0')) {
		normalized = `+62${digits.slice(1)}`;
	} else if (digits.startsWith('62')) {
		normalized = `+${digits}`;
	} else if (digits.startsWith('8')) {
		normalized = `+62${digits}`;
	}

	if (!/^\+[1-9][0-9]{7,14}$/.test(normalized)) {
		throw new GuestDataError('Nomor WhatsApp tidak valid. Gunakan nomor Indonesia yang aktif.');
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
	const alphabet = 'abcdefghijklmnopqrstuvwxyz';
	const tokenLength = 32;
	let token = '';

	while (token.length < tokenLength) {
		const bytes = crypto.getRandomValues(new Uint8Array(tokenLength));

		for (const byte of bytes) {
			if (byte >= 234) continue;

			token += alphabet[byte % alphabet.length];
			if (token.length === tokenLength) break;
		}
	}

	return token;
}

export function getGuests(): Promise<Guest[]> {
	return handleGuestRequest(async () => {
		const weddingId = getCurrentWeddingId();
		const records = await pocketBase.collection('guests').getFullList({
			filter: pocketBase.filter('wedding = {:weddingId}', { weddingId }),
			fields: GUEST_FIELDS.join(','),
			requestKey: `guests-${weddingId}`
		});

		return records.map(toGuest).sort((left, right) => left.name.localeCompare(right.name, 'id'));
	});
}

export function createGuest(input: GuestInput): Promise<Guest> {
	return handleGuestRequest(async () => {
		const record = await pocketBase.collection('guests').create(
			{
				...guestPayload(input),
				wedding: getCurrentWeddingId(),
				rsvp_token: createRsvpToken()
			},
			{ fields: GUEST_FIELDS.join(',') }
		);

		return toGuest(record);
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
