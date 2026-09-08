const DEFAULT_WEDDING_URL = 'https://wedding.onlytest.my.id';

function baseWeddingUrl(): URL {
	const configuredUrl = import.meta.env.PUBLIC_WEDDING_URL?.trim() || DEFAULT_WEDDING_URL;

	try {
		return new URL(configuredUrl);
	} catch {
		return new URL(DEFAULT_WEDDING_URL);
	}
}

export function getWeddingInvitationBaseHost(): string {
	return baseWeddingUrl().host;
}

export function getWeddingInvitationUrl(slug: string, rsvpToken?: string): string {
	const normalizedSlug = slug.trim().toLowerCase();
	if (!normalizedSlug) return '';

	const url = baseWeddingUrl();
	url.hostname = `${normalizedSlug}.${url.hostname}`;
	url.pathname = '/';
	url.search = '';
	url.hash = '';

	if (rsvpToken) url.searchParams.set('rsvp', rsvpToken.trim());
	return url.toString();
}

export function getWeddingInvitationHost(slug: string): string {
	const invitationUrl = getWeddingInvitationUrl(slug);
	return invitationUrl ? new URL(invitationUrl).host : '';
}
