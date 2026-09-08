import { ClientResponseError } from 'pocketbase';

import { pocketBase } from '#lib/infrastructure/pocketbase/index.js';

export const ACCOUNT_DELETE_CONFIRMATION = 'HAPUS';

export class DeleteAccountError extends Error {
	constructor(message: string, options?: ErrorOptions) {
		super(message, options);
		this.name = 'DeleteAccountError';
	}
}

function getDeleteAccountErrorMessage(error: ClientResponseError): string {
	if (error.status === 400) {
		return 'Konfirmasi tidak sesuai. Ketik HAPUS untuk melanjutkan.';
	}

	if (error.status === 401 || error.status === 403) {
		return 'Sesi Anda sudah berakhir. Silakan masuk kembali.';
	}

	if (error.status === 0) {
		return 'Tidak dapat terhubung ke server. Periksa koneksi lalu coba lagi.';
	}

	return 'Akun gagal dihapus. Tidak ada data yang diubah.';
}

function isDeleteAccountResponse(value: unknown): value is { success: true } {
	return (
		typeof value === 'object' && value !== null && 'success' in value && value.success === true
	);
}

export async function deleteCurrentAccount(confirmation: string): Promise<void> {
	if (confirmation !== ACCOUNT_DELETE_CONFIRMATION) {
		throw new DeleteAccountError('Konfirmasi tidak sesuai. Ketik HAPUS untuk melanjutkan.');
	}

	try {
		const response = await pocketBase.send<unknown>('/api/wedez/account', {
			method: 'DELETE',
			body: { confirmation }
		});

		if (!isDeleteAccountResponse(response)) {
			throw new DeleteAccountError('Respons penghapusan akun tidak valid.');
		}
	} catch (error) {
		if (error instanceof DeleteAccountError) {
			throw error;
		}

		throw new DeleteAccountError(
			error instanceof ClientResponseError
				? getDeleteAccountErrorMessage(error)
				: 'Akun gagal dihapus. Tidak ada data yang diubah.',
			{ cause: error }
		);
	}
}
