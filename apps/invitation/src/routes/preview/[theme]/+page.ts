import { error, redirect } from '@sveltejs/kit';
import { DEMO_RSVP_TOKEN } from '#lib/features/guests/model/demo-rsvp.js';
import { isWeddingThemeKey } from '#lib/features/wedding-themes/model/wedding-theme.js';
import { createDemoWedding } from '#lib/features/wedding-preview/data/demo-wedding.js';
import type { PageLoad } from './$types';

export const prerender = false;

export const load = (({ params, url }) => {
	if (!isWeddingThemeKey(params.theme)) error(404, 'Tema tidak ditemukan.');

	// Also make RSVP usable when the preview URL is opened without query parameters.
	if (url.searchParams.get('rsvp') !== DEMO_RSVP_TOKEN) {
		const target = new URL(url);
		target.searchParams.set('rsvp', DEMO_RSVP_TOKEN);
		redirect(307, `${target.pathname}${target.search}${target.hash}`);
	}

	return { wedding: createDemoWedding(params.theme) };
}) satisfies PageLoad;
