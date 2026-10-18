import type { GuestInput } from './guest.js';

export const INVALID_GUEST_WHATSAPP_MESSAGE =
	'Nomor WhatsApp tidak valid. Gunakan nomor Indonesia yang aktif.';

export type GuestFormFieldErrors = { name?: string; whatsapp?: string };

export function sanitizeGuestWhatsappInput(value: string): string {
	return `${value.startsWith('+') ? '+' : ''}${value.replace(/\D/g, '')}`;
}

export function normalizeGuestWhatsapp(value: string): string | null {
	const digits = value.replace(/\D/g, '');
	let normalized = '';

	if (digits.startsWith('0')) {
		normalized = `+62${digits.slice(1)}`;
	} else if (digits.startsWith('62')) {
		normalized = `+${digits}`;
	} else if (digits.startsWith('8')) {
		normalized = `+62${digits}`;
	}

	return /^\+[1-9][0-9]{7,14}$/.test(normalized) ? normalized : null;
}

export function validateGuestForm(
	input: Pick<GuestInput, 'name' | 'whatsapp'>
): GuestFormFieldErrors {
	const errors: GuestFormFieldErrors = {};
	if (!input.name.trim()) errors.name = 'Nama tamu wajib diisi.';
	if (!input.whatsapp.trim()) {
		errors.whatsapp = 'Nomor WhatsApp wajib diisi.';
	} else if (!normalizeGuestWhatsapp(input.whatsapp)) {
		errors.whatsapp = INVALID_GUEST_WHATSAPP_MESSAGE;
	}
	return errors;
}
