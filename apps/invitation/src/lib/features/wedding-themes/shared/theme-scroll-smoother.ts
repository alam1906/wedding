import type { ScrollSmoother as ScrollSmootherPlugin } from 'gsap/ScrollSmoother';

export const THEME_SCROLL_SETTINGS = {
	smooth: 1.2,
	smoothTouch: 0.12,
	effects: false
} as const;

export type ThemeScrollSmoother = {
	scrollTop: (position: number) => void;
	destroy: () => void;
};

/** Called before scene triggers, inside a browser-only animation lifecycle. */
export function createThemeScrollSmoother(
	root: HTMLElement,
	content: HTMLElement,
	ScrollSmoother: typeof ScrollSmootherPlugin
): ThemeScrollSmoother {
	const wrapper = content.parentElement;
	if (!wrapper) throw new Error('Theme scroll wrapper is missing.');
	const smoother = ScrollSmoother.create({
		...THEME_SCROLL_SETTINGS,
		wrapper,
		content
	});
	root.setAttribute('data-theme-scroll-active', '');
	// Native dialogs remain in the top layer; stop the underlying scroll momentum.
	const updateModalLock = () => smoother.paused(Boolean(root.querySelector('dialog[open]')));
	const dialogs = new MutationObserver(updateModalLock);
	dialogs.observe(root, { subtree: true, attributes: true, attributeFilter: ['open'] });
	updateModalLock();
	let destroyed = false;
	return {
		scrollTop: (position) => smoother.scrollTop(position),
		destroy: () => {
			if (destroyed) return;
			destroyed = true;
			dialogs.disconnect();
			smoother.kill();
			root.removeAttribute('data-theme-scroll-active');
		}
	};
}
