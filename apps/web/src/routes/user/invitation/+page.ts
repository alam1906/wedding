import { error } from '@sveltejs/kit';

import { GuestDataError, getGuests } from '#lib/features/guests/index.js';
import {
	getCurrentWeddingSlug,
	getWhatsappTemplate,
	WhatsappTemplateError,
	WeddingDataError
} from '#lib/features/weddings/index.js';
import type { PageLoad } from './$types';

export const load = (async () => {
	try {
		const [guests, weddingSlug, whatsappTemplate] = await Promise.all([
			getGuests(),
			getCurrentWeddingSlug(),
			getWhatsappTemplate()
		]);

		return { guests, weddingSlug, whatsappTemplate };
	} catch (cause) {
		throw error(500, {
			message:
				cause instanceof GuestDataError ||
				cause instanceof WeddingDataError ||
				cause instanceof WhatsappTemplateError
					? cause.message
					: 'Data undangan gagal dimuat.'
		});
	}
}) satisfies PageLoad;
