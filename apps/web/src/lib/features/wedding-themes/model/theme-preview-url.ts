import { getWeddingInvitationUrl } from '#lib/features/weddings/model/wedding-url.js';
import type { WeddingThemeKey } from './wedding-theme.js';

export function getWeddingThemePreviewUrl(theme: WeddingThemeKey): string {
	// "wedding" is reserved by the invitation slug resolver and uses its wildcard host.
	const url = new URL(getWeddingInvitationUrl('wedding'));
	url.pathname = `/preview/${theme}`;
	return url.toString();
}
