import { ClientResponseError } from 'pocketbase';

import { pocketBase } from '#lib/infrastructure/pocketbase/index.js';
import type { RegisterInput } from '../model/register-schema.js';

const RECORD_ID_ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';
const RECORD_ID_LENGTH = 15;

export class RegisterError extends Error {
	constructor(message: string, options?: ErrorOptions) {
		super(message, options);
		this.name = 'RegisterError';
	}
}

function generateRecordId(): string {
	const bytes = crypto.getRandomValues(new Uint8Array(RECORD_ID_LENGTH));
	return Array.from(bytes, (byte) => RECORD_ID_ALPHABET[byte % RECORD_ID_ALPHABET.length]).join('');
}

async function createInitialWedding(userId: string): Promise<void> {
	const weddingId = generateRecordId();
	const batch = pocketBase.createBatch();

	batch.collection('weddings').create({
		id: weddingId,
		owner: userId,
		slug: '',
		theme: 'minimalist-1',
		plan_tier: 'free'
	});
	batch.collection('users').update(userId, { wedding_id: weddingId });

	await batch.send();
}

function hasFieldError(error: ClientResponseError, field: string): boolean {
	const data = error.response?.data;
	return typeof data === 'object' && data !== null && field in data;
}

function getRegisterErrorMessage(error: ClientResponseError): string {
	if (error.isAbort) {
		return 'Permintaan pendaftaran dibatalkan. Silakan coba lagi.';
	}

	if (error.status === 400 && hasFieldError(error, 'email')) {
		return 'Email sudah terdaftar atau tidak dapat digunakan.';
	}

	if (error.status === 400) {
		return 'Data pendaftaran tidak valid. Periksa kembali data Anda.';
	}

	if (error.status === 429) {
		return 'Terlalu banyak percobaan pendaftaran. Silakan tunggu sebentar.';
	}

	if (error.status === 0) {
		return 'Tidak dapat terhubung ke server. Periksa koneksi lalu coba lagi.';
	}

	return 'Terjadi kesalahan saat mendaftar. Silakan coba lagi.';
}

export async function registerWithPassword(input: RegisterInput) {
	let createdUserId: string | null = null;

	try {
		const user = await pocketBase.collection('users').create({
			name: input.name,
			email: input.email,
			password: input.password,
			passwordConfirm: input.passwordConfirm
		});
		createdUserId = user.id;

		await pocketBase.collection('users').authWithPassword(input.email, input.password);
		await createInitialWedding(user.id);

		return user;
	} catch (error) {
		if (createdUserId && pocketBase.authStore.isValid) {
			try {
				await pocketBase.collection('users').delete(createdUserId);
			} catch {
				// The original provisioning error is more useful to the caller.
			}
		}

		const message = createdUserId
			? 'Akun dan undangan gagal disiapkan. Silakan coba mendaftar kembali.'
			: error instanceof ClientResponseError
				? getRegisterErrorMessage(error)
				: 'Terjadi kesalahan saat mendaftar. Silakan coba lagi.';

		throw new RegisterError(message, { cause: error });
	} finally {
		if (createdUserId) {
			pocketBase.authStore.clear();
		}
	}
}
