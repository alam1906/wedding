import { ClientResponseError } from 'pocketbase';

import { pocketBase } from '#lib/infrastructure/pocketbase/index.js';
import { optimizeImage, ImageOptimizationError } from '#lib/shared/image/optimize-image.js';

const MAX_NAME_LENGTH = 255;

export class UpdateProfileError extends Error {
	constructor(message: string, options?: ErrorOptions) {
		super(message, options);
		this.name = 'UpdateProfileError';
	}
}

function validateName(name: string): string {
	const normalizedName = name.trim();

	if (!normalizedName) {
		throw new UpdateProfileError('Nama lengkap wajib diisi.');
	}

	if (normalizedName.length > MAX_NAME_LENGTH) {
		throw new UpdateProfileError(`Nama lengkap maksimal ${MAX_NAME_LENGTH} karakter.`);
	}

	return normalizedName;
}

function getUpdateProfileErrorMessage(error: ClientResponseError): string {
	if (error.status === 400) {
		return 'Nama lengkap tidak valid. Periksa kembali nama yang dimasukkan.';
	}

	if (error.status === 401 || error.status === 403) {
		return 'Sesi Anda sudah berakhir. Silakan masuk kembali.';
	}

	if (error.status === 0) {
		return 'Tidak dapat terhubung ke server. Periksa koneksi lalu coba lagi.';
	}

	return 'Nama lengkap gagal diperbarui. Silakan coba lagi.';
}

export async function updateAuthenticatedName(name: string): Promise<string> {
	const userId = pocketBase.authStore.record?.id;
	const normalizedName = validateName(name);

	if (!pocketBase.authStore.isValid || !userId) {
		throw new UpdateProfileError('Sesi Anda sudah berakhir. Silakan masuk kembali.');
	}

	try {
		const user = await pocketBase.collection('users').update(userId, { name: normalizedName });
		const updatedName = typeof user.name === 'string' ? user.name.trim() : '';

		if (!updatedName) {
			throw new UpdateProfileError('Respons pembaruan profil tidak valid.');
		}

		if (pocketBase.authStore.record?.id === userId && pocketBase.authStore.isValid) {
			pocketBase.authStore.save(pocketBase.authStore.token, user);
		}
		return updatedName;
	} catch (error) {
		if (error instanceof UpdateProfileError) {
			throw error;
		}

		throw new UpdateProfileError(
			error instanceof ClientResponseError
				? getUpdateProfileErrorMessage(error)
				: 'Nama lengkap gagal diperbarui. Silakan coba lagi.',
			{ cause: error }
		);
	}
}

export function getAuthenticatedAvatarUrl(): string {
	const user = pocketBase.authStore.record;
	return user && typeof user.avatar === 'string' && user.avatar
		? pocketBase.files.getURL(user, user.avatar, { thumb: '100x100' })
		: '';
}

export async function updateAuthenticatedAvatar(file: File): Promise<string> {
	const userId = pocketBase.authStore.record?.id;
	if (!pocketBase.authStore.isValid || !userId) {
		throw new UpdateProfileError('Sesi Anda sudah berakhir. Silakan masuk kembali.');
	}
	try {
		if (file.size > 10 * 1024 * 1024) throw new UpdateProfileError('Foto maksimal 10 MB.');
		const avatar = await optimizeImage(file, { maxWidth: 512, maxHeight: 512, quality: 0.85 });
		// Image decoding is asynchronous; a logout must not turn this into another user's request.
		if (pocketBase.authStore.record?.id !== userId || !pocketBase.authStore.isValid) {
			throw new UpdateProfileError('Sesi Anda sudah berakhir. Silakan masuk kembali.');
		}
		const user = await pocketBase.collection('users').update(userId, { avatar });
		if (pocketBase.authStore.record?.id === userId && pocketBase.authStore.isValid) {
			pocketBase.authStore.save(pocketBase.authStore.token, user);
		}
		return pocketBase.files.getURL(user, String(user.avatar), { thumb: '100x100' });
	} catch (error) {
		if (error instanceof UpdateProfileError || error instanceof ImageOptimizationError) throw error;
		throw new UpdateProfileError('Foto profil gagal diperbarui. Periksa koneksi lalu coba lagi.', {
			cause: error
		});
	}
}
