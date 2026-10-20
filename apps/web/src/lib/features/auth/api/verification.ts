import PocketBase, { BaseAuthStore, ClientResponseError } from 'pocketbase';

import { pocketBase } from '#lib/infrastructure/pocketbase/index.js';

export class VerificationError extends Error {
	constructor(message: string, options?: ErrorOptions) {
		super(message, options);
		this.name = 'VerificationError';
	}
}

function getVerificationErrorMessage(
	error: ClientResponseError,
	action: 'request' | 'confirm' | 'refresh' | 'subscribe'
): string {
	if (error.isAbort) {
		return 'Permintaan verifikasi dibatalkan. Silakan coba lagi.';
	}

	if (error.status === 429) {
		return 'Terlalu banyak permintaan verifikasi. Silakan tunggu sebentar.';
	}

	if (error.status === 0) {
		return 'Tidak dapat terhubung ke server. Periksa koneksi lalu coba lagi.';
	}

	if (action === 'confirm' && error.status === 400) {
		return 'Link verifikasi tidak valid atau sudah kedaluwarsa.';
	}

	if (action === 'request') {
		return 'Email verifikasi gagal dikirim. Silakan coba lagi.';
	}

	if (action === 'refresh') {
		return 'Status akun gagal diperbarui. Silakan masuk kembali.';
	}

	if (action === 'subscribe') {
		return 'Pemantauan status verifikasi gagal dimulai. Silakan muat ulang halaman.';
	}

	return 'Email gagal diverifikasi. Silakan coba lagi.';
}

async function handleVerificationRequest<T>(
	request: () => Promise<T>,
	action: 'request' | 'confirm' | 'refresh' | 'subscribe'
): Promise<T> {
	try {
		return await request();
	} catch (error) {
		if (error instanceof VerificationError) throw error;

		const message =
			error instanceof ClientResponseError
				? getVerificationErrorMessage(error, action)
				: 'Terjadi kesalahan saat memverifikasi email. Silakan coba lagi.';

		throw new VerificationError(message, { cause: error });
	}
}

export function requestEmailVerification(email: string) {
	return handleVerificationRequest(
		() => pocketBase.collection('users').requestVerification(email),
		'request'
	);
}

export function confirmEmailVerification(token: string) {
	return handleVerificationRequest(
		() => pocketBase.collection('users').confirmVerification(token),
		'confirm'
	);
}

// Refresh account fields only; preserve the login token and its expiration.
export function refreshAuthenticatedUser(signal?: AbortSignal) {
	return handleVerificationRequest(async () => {
		const token = pocketBase.authStore.token;
		const record = pocketBase.authStore.record;

		if (!pocketBase.authStore.isValid || !record) {
			throw new VerificationError('Sesi Anda sudah berakhir. Silakan masuk kembali.');
		}

		// Read current account data with the captured session without renewing its token.
		// A late response must not replace another tab's login or restore a logged-out session.
		const client = new PocketBase(pocketBase.baseURL, new BaseAuthStore());
		client.authStore.save(token, record);
		const updatedRecord = await client.collection('users').getOne(record.id, {
			signal,
			requestKey: null,
			cache: 'no-store'
		});

		if (
			signal?.aborted ||
			pocketBase.authStore.token !== token ||
			pocketBase.authStore.record?.id !== record.id
		) {
			throw new VerificationError('Sesi akun berubah. Silakan muat ulang halaman.');
		}

		pocketBase.authStore.save(token, updatedRecord);
		return { token, record: updatedRecord };
	}, 'refresh');
}

export function subscribeToEmailVerification(onVerified: () => void): Promise<() => Promise<void>> {
	const recordId = pocketBase.authStore.record?.id;

	if (!recordId) {
		return Promise.resolve(async () => {});
	}

	return handleVerificationRequest(
		() =>
			pocketBase.collection('users').subscribe(recordId, (event) => {
				if (event.action === 'update' && event.record.verified === true) {
					onVerified();
				}
			}),
		'subscribe'
	);
}
