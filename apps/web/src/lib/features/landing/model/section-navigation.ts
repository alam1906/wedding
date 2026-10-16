import { goto } from '$app/navigation';
import { page } from '$app/state';

const sectionIds = new Set(['beranda', 'tema', 'harga', 'buat-undangan', 'main-content']);

export function handleSectionClick(event: MouseEvent): boolean {
	if (
		event.defaultPrevented ||
		event.button !== 0 ||
		event.metaKey ||
		event.ctrlKey ||
		event.shiftKey ||
		event.altKey
	)
		return false;
	const link = event.currentTarget;
	if (!(link instanceof HTMLAnchorElement) || link.target || link.hasAttribute('download'))
		return false;
	const url = new URL(link.href);
	if (
		url.origin !== location.origin ||
		url.pathname !== location.pathname ||
		url.search !== location.search
	)
		return false;
	const id = url.hash.slice(1);
	if (!sectionIds.has(id)) return false;
	const target = document.getElementById(id);
	if (!target) return false;

	event.preventDefault();
	if (event.detail === 0) {
		if (!target.hasAttribute('tabindex')) {
			target.setAttribute('tabindex', '-1');
			target.addEventListener('blur', () => target.removeAttribute('tabindex'), { once: true });
		}
		target.focus({ preventScroll: true });
	}
	target.scrollIntoView({
		block: 'start',
		behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'
	});
	return true;
}

export async function clearLandingSectionHash(): Promise<void> {
	const url = new URL(location.href);
	if (url.pathname !== '/' || !sectionIds.has(url.hash.slice(1))) return;
	url.hash = '';
	// Keep SvelteKit's history state and the section position when arriving via an old anchor link.
	await goto(url, { shallow: true, replace: true, reset: false, state: page.state });
}
