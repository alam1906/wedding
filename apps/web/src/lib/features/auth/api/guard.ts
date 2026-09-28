import { browser } from '$app/env';
import { redirect } from '@sveltejs/kit';
import { pocketBase } from '#lib/infrastructure/pocketbase/index.js';
import { isAuthenticated, isEmailVerified } from '../model/session.js';
import { safeDestination, verificationUrl, type AccountIntent } from '../model/navigation.js';

// These redirects control navigation. PocketBase remains the authorization boundary.
export async function requireVerifiedAccount(
	path: string,
	area: AccountIntent = 'wedding',
	fetch?: typeof globalThis.fetch
) {
	if (!browser) return;
	const login = '/login';
	const destination = safeDestination(
		path,
		area === 'affiliate' ? '/affiliate/dashboard' : '/user/dashboard'
	);
	if (!isAuthenticated()) redirect(307, `${login}?next=${encodeURIComponent(destination)}`);
	try {
		await pocketBase.collection('users').authRefresh({ fetch });
	} catch (error) {
		if (
			error &&
			typeof error === 'object' &&
			'status' in error &&
			(error.status === 401 || error.status === 403)
		) {
			pocketBase.authStore.clear();
			redirect(307, `${login}?next=${encodeURIComponent(destination)}`);
		}
		throw error;
	}
	if (!isEmailVerified()) redirect(307, verificationUrl(destination));
}
