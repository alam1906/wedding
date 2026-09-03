import { browser } from '$app/env';
import { redirect } from '@sveltejs/kit';

import { isEmailVerified } from '#lib/features/auth/index.js';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = () => {
	if (browser && isEmailVerified()) {
		redirect(307, '/user/dashboard');
	}
};
