import { ClientResponseError } from 'pocketbase';

import { pocketBase } from '#lib/infrastructure/pocketbase/index.js';

export const DEFAULT_WHATSAPP_TEMPLATE = `<p>Assalamu'alaikum {nama},</p><p>Dengan penuh rasa syukur, kami mengundang Bapak/Ibu/Saudara/i untuk hadir dan menjadi bagian dari hari bahagia pernikahan kami.</p><p>Silakan buka undangan pribadi Anda melalui tautan berikut:<br><a href="{link}">{link}</a></p><p>Undangan ini berlaku untuk {jumlah} orang. Mohon konfirmasi kehadiran melalui undangan tersebut.</p><p>Kehadiran dan doa restu Anda sangat berarti bagi kami. Terima kasih.</p>`;

export class WhatsappTemplateError extends Error {
	constructor(message: string, options?: ErrorOptions) {
		super(message, options);
		this.name = 'WhatsappTemplateError';
	}
}

function getCurrentWeddingId(): string {
	const weddingId = pocketBase.authStore.record?.wedding_id;

	if (typeof weddingId === 'string' && weddingId.length > 0) return weddingId;
	if (Array.isArray(weddingId) && typeof weddingId[0] === 'string') return weddingId[0];

	throw new WhatsappTemplateError('Wedding untuk akun ini tidak ditemukan.');
}

function templateErrorMessage(error: ClientResponseError): string {
	if (error.status === 400) return 'Template WhatsApp tidak valid.';
	if (error.status === 401 || error.status === 403 || error.status === 404) {
		return 'Anda tidak memiliki akses untuk mengubah template ini.';
	}
	if (error.status === 0) return 'Tidak dapat terhubung ke server.';

	return 'Template WhatsApp gagal diproses.';
}

async function handleTemplateRequest<T>(request: () => Promise<T>): Promise<T> {
	try {
		return await request();
	} catch (error) {
		if (error instanceof WhatsappTemplateError) throw error;

		const message =
			error instanceof ClientResponseError
				? templateErrorMessage(error)
				: 'Template WhatsApp gagal diproses.';

		throw new WhatsappTemplateError(message, { cause: error });
	}
}

export function getWhatsappTemplate(): Promise<string> {
	return handleTemplateRequest(async () => {
		const weddingId = getCurrentWeddingId();
		const record = await pocketBase.collection('weddings').getOne(weddingId, {
			fields: 'whatsapp_template',
			cache: 'no-store',
			requestKey: `whatsapp-template-${weddingId}`
		});
		const template =
			typeof record.whatsapp_template === 'string' ? record.whatsapp_template.trim() : '';

		return template || DEFAULT_WHATSAPP_TEMPLATE;
	});
}

export function updateWhatsappTemplate(template: string): Promise<string> {
	const normalizedTemplate = template.trim();

	if (!normalizedTemplate) {
		return Promise.reject(new WhatsappTemplateError('Template tidak boleh kosong.'));
	}
	if (!normalizedTemplate.includes('{link}')) {
		return Promise.reject(new WhatsappTemplateError('Template harus memiliki variabel {link}.'));
	}
	if (normalizedTemplate.length > 10000) {
		return Promise.reject(new WhatsappTemplateError('Template maksimal 10000 karakter.'));
	}

	return handleTemplateRequest(async () => {
		const record = await pocketBase
			.collection('weddings')
			.update(
				getCurrentWeddingId(),
				{ whatsapp_template: normalizedTemplate },
				{ fields: 'whatsapp_template' }
			);

		return typeof record.whatsapp_template === 'string'
			? record.whatsapp_template
			: normalizedTemplate;
	});
}
