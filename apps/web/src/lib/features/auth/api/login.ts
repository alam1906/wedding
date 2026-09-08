import { ClientResponseError } from 'pocketbase';

import { pocketBase } from '#lib/infrastructure/pocketbase/index.js';
import type { LoginInput } from '../model/login-schema.js';

export class LoginError extends Error {
	constructor(message: string, options?: ErrorOptions) {
		super(message, options);
		this.name = 'LoginError';
	}
}

function getLoginErrorMessage(error: ClientResponseError): string {
	if (error.isAbort) {
		return 'Permintaan masuk dibatalkan. Silakan coba lagi.';
	}

	if (error.status === 400 || error.status === 401 || error.status === 403) {
		return 'Email atau kata sandi tidak valid.';
	}

	if (error.status === 429) {
		return 'Terlalu banyak percobaan masuk. Silakan tunggu sebentar.';
	}

	if (error.status === 0) {
		return 'Tidak dapat terhubung ke server. Periksa koneksi lalu coba lagi.';
	}

	return 'Terjadi kesalahan saat masuk. Silakan coba lagi.';
}

export async function loginWithPassword(credentials: LoginInput) {
	try {
		return await pocketBase
			.collection('users')
			.authWithPassword(credentials.email, credentials.password);
	} catch (error) {
		const message =
			error instanceof ClientResponseError
				? getLoginErrorMessage(error)
				: 'Terjadi kesalahan saat masuk. Silakan coba lagi.';

		throw new LoginError(message, { cause: error });
	}
}
