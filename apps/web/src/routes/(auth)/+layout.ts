import { browser } from '$app/env';
import { redirect } from '@sveltejs/kit';

import { isEmailVerified } from '#lib/features/auth/index.js';
import type { LayoutLoad } from './$types';
import { postLoginDestination } from '#lib/features/auth/model/navigation.js';

export const prerender = false;

export const load: LayoutLoad = ({ url }) => {
	if (browser && isEmailVerified()) {
		redirect(307, postLoginDestination(url.searchParams.get('next')));
	}
};
