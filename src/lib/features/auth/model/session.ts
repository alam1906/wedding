import { pocketBase } from '#lib/infrastructure/pocketbase/index.js';

export function isAuthenticated(): boolean {
	return pocketBase.authStore.isValid && pocketBase.authStore.record !== null;
}

export function isEmailVerified(): boolean {
	return isAuthenticated() && pocketBase.authStore.record?.verified === true;
}

export function getAuthenticatedEmail(): string {
	const email = pocketBase.authStore.record?.email;
	return typeof email === 'string' ? email : '';
}

export function logout(): void {
	pocketBase.authStore.clear();
}
