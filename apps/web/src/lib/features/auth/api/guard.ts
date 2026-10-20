import { browser } from '$app/env';
import { redirect } from '@sveltejs/kit';
import { pocketBase } from '#lib/infrastructure/pocketbase/index.js';
import { isAuthenticated, isEmailVerified } from '../model/session.js';
import { safeDestination, verificationUrl, type AccountIntent } from '../model/navigation.js';

// These redirects control navigation. PocketBase remains the authorization boundary.
// Navigation uses the existing login token and must not renew its expiration.
export async function requireVerifiedAccount(path: string, area: AccountIntent = 'wedding') {
	if (!browser) return;
	const login = '/login';
	const destination = safeDestination(
		path,
		area === 'affiliate' ? '/affiliate/dashboard' : '/user/dashboard'
	);
	if (!isAuthenticated()) {
		pocketBase.authStore.clear();
		redirect(307, `${login}?next=${encodeURIComponent(destination)}`);
	}
	if (!isEmailVerified()) redirect(307, verificationUrl(destination));
}
