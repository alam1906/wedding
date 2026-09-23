const DEFAULT_INVITATION_URL = 'https://wedez.id';
const RESERVED_SUBDOMAINS = new Set([
	'api',
	'app',
	'admin',
	'dokploy',
	'mail',
	'status',
	'web',
	'wedding',
	'www'
]);
const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

function configuredBaseHostname(): string {
	const configuredUrl = import.meta.env.PUBLIC_INVITATION_URL?.trim() || DEFAULT_INVITATION_URL;

	try {
		return new URL(configuredUrl).hostname.toLowerCase();
	} catch {
		return new URL(DEFAULT_INVITATION_URL).hostname;
	}
}

function normalizeWeddingSlug(value: string): string {
	const slug = value.trim().toLowerCase();
	return SLUG_PATTERN.test(slug) && !RESERVED_SUBDOMAINS.has(slug) ? slug : '';
}

export function getWeddingSlug(url: URL): string {
	const hostname = url.hostname.toLowerCase();

	if (hostname === 'localhost' || hostname === '127.0.0.1') {
		return normalizeWeddingSlug(url.searchParams.get('slug') ?? '');
	}

	const localhostSuffix = '.localhost';
	if (hostname.endsWith(localhostSuffix)) {
		return normalizeWeddingSlug(hostname.slice(0, -localhostSuffix.length));
	}

	const suffix = `.${configuredBaseHostname()}`;
	if (!hostname.endsWith(suffix)) return '';

	return normalizeWeddingSlug(hostname.slice(0, -suffix.length));
}
