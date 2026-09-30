import { ClientResponseError } from 'pocketbase';

import { pocketBase } from '#lib/infrastructure/pocketbase/index.js';
import type { PublicRsvpGuest, PublicRsvpInput, PublicRsvpMessagePage } from '../model/guest.js';
import {
	DEMO_WEDDING_SLUG,
	DEMO_RSVP_TOKEN,
	getDemoGuest,
	getDemoMessages,
	submitDemoGuest
} from '../model/demo-rsvp.js';

const RSVP_TOKEN_PATTERN = /^(?:[a-z]{6}|[A-Za-z0-9_-]{12,64})$/;
const MAX_MESSAGE_LENGTH = 1000;

export class PublicRsvpError extends Error {
	constructor(message: string, options?: ErrorOptions) {
		super(message, options);
		this.name = 'PublicRsvpError';
	}
}

function normalizeIdentity(slug: string, token: string): { slug: string; token: string } {
	const normalizedSlug = slug.trim();
	const normalizedToken = token.trim();

	if (!normalizedSlug || !RSVP_TOKEN_PATTERN.test(normalizedToken)) {
		throw new PublicRsvpError('Tautan RSVP tidak valid atau tidak lengkap.');
	}
	if (normalizedSlug === DEMO_WEDDING_SLUG && normalizedToken !== DEMO_RSVP_TOKEN) {
		throw new PublicRsvpError('Tautan preview RSVP tidak valid.');
	}

	return { slug: normalizedSlug, token: normalizedToken };
}

function isGuestStatus(value: unknown): value is PublicRsvpGuest['rsvp_status'] {
	return value === 'pending' || value === 'attending' || value === 'not_attending';
}

function toPublicGuest(value: unknown): PublicRsvpGuest {
	if (typeof value !== 'object' || value === null) {
		throw new PublicRsvpError('Respons RSVP dari server tidak valid.');
	}

	const payload = value as Record<string, unknown>;

	if (typeof payload.name !== 'string' || !isGuestStatus(payload.rsvp_status)) {
		throw new PublicRsvpError('Respons RSVP dari server tidak lengkap.');
	}

	return {
		name: payload.name,
		rsvp_status: payload.rsvp_status,
		message: typeof payload.message === 'string' ? payload.message : ''
	};
}

function toPublicMessagePage(value: unknown): PublicRsvpMessagePage {
	if (typeof value !== 'object' || value === null) {
		throw new PublicRsvpError('Respons ucapan dari server tidak valid.');
	}

	const payload = value as Record<string, unknown>;

	if (!Array.isArray(payload.items) || typeof payload.has_more !== 'boolean') {
		throw new PublicRsvpError('Respons ucapan dari server tidak lengkap.');
	}

	return {
		items: payload.items.map((item) => {
			if (typeof item !== 'object' || item === null) {
				throw new PublicRsvpError('Data ucapan dari server tidak valid.');
			}

			const message = item as Record<string, unknown>;

			if (
				typeof message.name !== 'string' ||
				typeof message.message !== 'string' ||
				!isGuestStatus(message.rsvp_status)
			) {
				throw new PublicRsvpError('Data ucapan dari server tidak lengkap.');
			}

			return {
				name: message.name,
				message: message.message,
				rsvp_status: message.rsvp_status
			};
		}),
		has_more: payload.has_more
	};
}

function requestErrorMessage(error: ClientResponseError): string {
	if (error.status === 400) {
		return typeof error.response?.message === 'string' && error.response.message
			? error.response.message
			: 'Jawaban RSVP tidak valid.';
	}

	if (error.status === 404) {
		return 'Tautan RSVP tidak ditemukan atau tidak sesuai dengan undangan ini.';
	}

	if (error.status === 429) {
		return 'Terlalu banyak percobaan. Silakan tunggu sebentar lalu coba lagi.';
	}

	if (error.status === 0) {
		return 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.';
	}

	return 'RSVP belum dapat diproses. Silakan coba kembali.';
}

async function handlePublicRsvpRequest(request: () => Promise<unknown>): Promise<PublicRsvpGuest> {
	try {
		return toPublicGuest(await request());
	} catch (error) {
		if (error instanceof PublicRsvpError) {
			throw error;
		}

		const message =
			error instanceof ClientResponseError
				? requestErrorMessage(error)
				: 'RSVP belum dapat diproses. Silakan coba kembali.';

		throw new PublicRsvpError(message, { cause: error });
	}
}

export function getPublicGuestRsvp(slug: string, token: string): Promise<PublicRsvpGuest> {
	const identity = normalizeIdentity(slug, token);
	if (identity.slug === DEMO_WEDDING_SLUG) return Promise.resolve(getDemoGuest());

	return handlePublicRsvpRequest(() =>
		pocketBase.send('/api/wedez/rsvp/guest', {
			method: 'POST',
			body: identity
		})
	);
}

export function submitPublicGuestRsvp(input: PublicRsvpInput): Promise<PublicRsvpGuest> {
	const identity = normalizeIdentity(input.slug, input.token);
	const message = input.message.trim();

	if (input.rsvp_status !== 'attending' && input.rsvp_status !== 'not_attending') {
		throw new PublicRsvpError('Pilih konfirmasi kehadiran terlebih dahulu.');
	}

	if (message.length > MAX_MESSAGE_LENGTH) {
		throw new PublicRsvpError(`Pesan maksimal ${MAX_MESSAGE_LENGTH} karakter.`);
	}
	if (identity.slug === DEMO_WEDDING_SLUG) {
		return Promise.resolve(submitDemoGuest(input.rsvp_status, message));
	}

	return handlePublicRsvpRequest(() =>
		pocketBase.send('/api/wedez/rsvp/respond', {
			method: 'POST',
			body: {
				...identity,
				rsvp_status: input.rsvp_status,
				message
			}
		})
	);
}

export async function getPublicRsvpMessages(
	slug: string,
	page: number
): Promise<PublicRsvpMessagePage> {
	const normalizedSlug = slug.trim();
	const normalizedPage = Math.max(1, Math.floor(page));

	if (!normalizedSlug) {
		throw new PublicRsvpError('Undangan tidak valid.');
	}
	if (normalizedSlug === DEMO_WEDDING_SLUG) return getDemoMessages(normalizedPage);

	try {
		return toPublicMessagePage(
			await pocketBase.send('/api/wedez/rsvp/messages', {
				method: 'POST',
				body: { slug: normalizedSlug, page: normalizedPage }
			})
		);
	} catch (error) {
		if (error instanceof PublicRsvpError) {
			throw error;
		}

		const message =
			error instanceof ClientResponseError
				? requestErrorMessage(error)
				: 'Ucapan tamu belum dapat dimuat.';

		throw new PublicRsvpError(message, { cause: error });
	}
}
