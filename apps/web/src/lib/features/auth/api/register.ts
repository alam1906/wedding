import { ClientResponseError } from 'pocketbase';

import { pocketBase } from '#lib/infrastructure/pocketbase/index.js';
import type { RegisterInput } from '../model/register-schema.js';

export class RegisterError extends Error {
	constructor(message: string, options?: ErrorOptions) {
		super(message, options);
		this.name = 'RegisterError';
	}
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
	try {
		return await pocketBase.collection('users').create({
			name: input.name,
			email: input.email,
			password: input.password,
			passwordConfirm: input.passwordConfirm
		});
	} catch (error) {
		const message =
			error instanceof ClientResponseError
				? getRegisterErrorMessage(error)
				: 'Terjadi kesalahan saat mendaftar. Silakan coba lagi.';

		throw new RegisterError(message, { cause: error });
	}
}
