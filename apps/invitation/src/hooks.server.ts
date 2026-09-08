import type { Handle } from '@sveltejs/kit/hooks';

const DEFAULT_WEDDING_URL = 'https://wedding.onlytest.my.id';
const RESERVED_SUBDOMAINS = new Set(['api', 'app', 'admin', 'mail', 'status', 'www']);
const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

function configuredBaseHostname(): string {
	const configuredUrl = import.meta.env.PUBLIC_WEDDING_URL?.trim() || DEFAULT_WEDDING_URL;

	try {
		return new URL(configuredUrl).hostname.toLowerCase();
	} catch {
		return new URL(DEFAULT_WEDDING_URL).hostname;
	}
}

function normalizeWeddingSlug(value: string): string {
	const slug = value.trim().toLowerCase();
	return SLUG_PATTERN.test(slug) && !RESERVED_SUBDOMAINS.has(slug) ? slug : '';
}

function getWeddingSlug(url: URL): string {
	const hostname = url.hostname.toLowerCase();

	if (hostname === 'localhost' || hostname === '127.0.0.1') {
		return normalizeWeddingSlug(url.searchParams.get('slug') ?? '');
	}

	const localhostSuffix = '.localhost';
	if (hostname.endsWith(localhostSuffix)) {
		return normalizeWeddingSlug(hostname.slice(0, -localhostSuffix.length));
	}

	const baseHostname = configuredBaseHostname();
	const suffix = `.${baseHostname}`;

	if (!hostname.endsWith(suffix)) return '';

	return normalizeWeddingSlug(hostname.slice(0, -suffix.length));
}

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.weddingSlug = getWeddingSlug(event.url);
	return resolve(event);
};
