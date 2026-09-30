import { ClientResponseError } from 'pocketbase';

import { pocketBase } from '#lib/infrastructure/pocketbase/index.js';

export class PasswordError extends Error {
	constructor(message: string, options?: ErrorOptions) {
		super(message, options);
		this.name = 'PasswordError';
	}
}

function validateNewPassword(password: string, passwordConfirm: string) {
	if (password.length < 8) {
		throw new PasswordError('Kata sandi baru minimal 8 karakter.');
	}
	if (password !== passwordConfirm) {
		throw new PasswordError('Konfirmasi kata sandi tidak cocok.');
	}
}

function passwordError(error: unknown, action: 'request' | 'reset' | 'change'): PasswordError {
	if (error instanceof PasswordError) return error;
	let message = 'Kata sandi gagal diperbarui. Silakan coba lagi.';
	if (error instanceof ClientResponseError) {
		if (error.status === 0) {
			message = 'Tidak dapat terhubung ke server. Periksa koneksi lalu coba lagi.';
		} else if (error.status === 429) {
			message = 'Terlalu banyak percobaan. Silakan tunggu sebentar.';
		} else if (action === 'request') {
			message = 'Email pemulihan gagal dikirim. Silakan coba lagi.';
		} else if (error.status === 401 || error.status === 403 || error.status === 404) {
			message = 'Sesi Anda sudah berakhir. Silakan masuk kembali.';
		} else if (error.status === 400 && action === 'reset') {
			message = 'Link pemulihan tidak valid atau sudah kedaluwarsa. Minta link baru.';
		} else if (error.status === 400 && error.response.data?.oldPassword) {
			message = 'Kata sandi saat ini tidak benar.';
		} else if (error.status === 400) {
			message = 'Kata sandi tidak valid. Periksa kembali data yang dimasukkan.';
		}
	}
	return new PasswordError(message, { cause: error });
}

export async function requestPasswordReset(email: string): Promise<void> {
	const normalizedEmail = email.trim();
	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
		throw new PasswordError('Format email tidak valid.');
	}
	try {
		await pocketBase.collection('users').requestPasswordReset(normalizedEmail);
	} catch (error) {
		throw passwordError(error, 'request');
	}
}

export async function confirmPasswordReset(
	token: string,
	password: string,
	passwordConfirm: string
): Promise<void> {
	if (!token) throw new PasswordError('Link pemulihan tidak valid. Minta link baru.');
	validateNewPassword(password, passwordConfirm);
	try {
		await pocketBase.collection('users').confirmPasswordReset(token, password, passwordConfirm);
		// PocketBase revokes previous auth tokens after a password reset.
		pocketBase.authStore.clear();
	} catch (error) {
		throw passwordError(error, 'reset');
	}
}

export async function changeAuthenticatedPassword(
	oldPassword: string,
	password: string,
	passwordConfirm: string
): Promise<void> {
	const userId = pocketBase.authStore.record?.id;
	if (!pocketBase.authStore.isValid || !userId) {
		throw new PasswordError('Sesi Anda sudah berakhir. Silakan masuk kembali.');
	}
	if (!oldPassword) throw new PasswordError('Kata sandi saat ini wajib diisi.');
	validateNewPassword(password, passwordConfirm);
	if (oldPassword === password) {
		throw new PasswordError('Kata sandi baru harus berbeda dari kata sandi saat ini.');
	}
	try {
		await pocketBase.collection('users').update(userId, {
			oldPassword,
			password,
			passwordConfirm
		});
		// Require a fresh login instead of keeping the now-revoked token locally.
		pocketBase.authStore.clear();
	} catch (error) {
		throw passwordError(error, 'change');
	}
}
