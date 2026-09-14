import { browser } from '$app/env';
import { redirect } from '@sveltejs/kit';

import { isAuthenticated, isEmailVerified } from '#lib/features/auth/index.js';
import type { PageLoad } from './$types';

export const load: PageLoad = () => {
	if (browser && !isAuthenticated()) {
		redirect(307, '/login');
	}

	if (browser && !isEmailVerified()) {
		redirect(307, '/verification');
	}
};
