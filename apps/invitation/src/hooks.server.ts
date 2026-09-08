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

function getWeddingSlug(url: URL): string {
	const hostname = url.hostname.toLowerCase();

	if (hostname === 'localhost' || hostname === '127.0.0.1') {
		return url.searchParams.get('slug')?.trim().toLowerCase() ?? '';
	}

	const baseHostname = configuredBaseHostname();
	const suffix = `.${baseHostname}`;

	if (!hostname.endsWith(suffix)) return '';

	const slug = hostname.slice(0, -suffix.length);
	return SLUG_PATTERN.test(slug) && !RESERVED_SUBDOMAINS.has(slug) ? slug : '';
}

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.weddingSlug = getWeddingSlug(event.url);
	return resolve(event);
};
