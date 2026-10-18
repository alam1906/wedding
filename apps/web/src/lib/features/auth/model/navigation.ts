import { pocketBase } from '#lib/infrastructure/pocketbase/index.js';

export type AccountIntent = 'wedding' | 'affiliate';

const destinations = new Set([
	'/user/dashboard',
	'/user/data',
	'/user/invitation',
	'/user/setting',
	'/payment',
	'/start',
	'/affiliate/dashboard',
	'/affiliate/commissions',
	'/affiliate/payouts',
	'/affiliate/settings'
]);

export function hasWedding(): boolean {
	const id = pocketBase.authStore.record?.wedding_id;
	return typeof id === 'string' ? id.length > 0 : Array.isArray(id) && id.length > 0;
}

export function getAccountHome(): string {
	const area = pocketBase.authStore.record?.home_area;
	if (area === 'affiliate') return '/affiliate/dashboard';
	if (hasWedding()) return '/user/dashboard';
	return '/start';
}

export function safeDestination(
	value: string | null | undefined,
	fallback = getAccountHome()
): string {
	return value && destinations.has(value) ? value : fallback;
}

export function postLoginDestination(next: string | null | undefined): string {
	const home = getAccountHome();
	if (home === '/start') return home;
	const destination = safeDestination(next, home);
	return destination === '/start' ? home : destination;
}

export function verificationUrl(next: string): string {
	return `/verification?next=${encodeURIComponent(safeDestination(next))}`;
}
