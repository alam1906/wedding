import type { WeddingThemeKey } from '../model/wedding-theme.js';
import { createThemeScrollSmoother } from './theme-scroll-smoother.js';

export type WeddingThemeAnimation = WeddingThemeKey;

export type WeddingThemeAnimationController = {
	refresh: () => void;
	scrollToTop: () => void;
	destroy: () => void;
};

export function mountWeddingThemeAnimations(
	rootSelector: string,
	variant: WeddingThemeAnimation
): WeddingThemeAnimationController {
	const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
	let controller = mountAnimations(rootSelector, variant);
	const changed = () => {
		controller.destroy();
		controller = mountAnimations(rootSelector, variant);
		controller.refresh();
	};
	preference.addEventListener('change', changed);
	return {
		refresh: () => controller.refresh(),
		scrollToTop: () => controller.scrollToTop(),
		destroy: () => {
			preference.removeEventListener('change', changed);
			controller.destroy();
		}
	};
}

function mountAnimations(
	rootSelector: string,
	variant: WeddingThemeAnimation
): WeddingThemeAnimationController {
	if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
		return {
			refresh: () => undefined,
			scrollToTop: () => undefined,
			destroy: () => undefined
		};
	}

	let cancelled = false;
	let revertAnimations: (() => void) | undefined;
	let refreshAnimations: (() => void) | undefined;
	let scrollToTopAnimations: (() => void) | undefined;
	let refreshRequested = false;
	let scrollToTopRequested = false;

	void (async () => {
		try {
			const [{ gsap }, { ScrollTrigger }, { ScrollSmoother }] = await Promise.all([
				import('gsap'),
				import('gsap/ScrollTrigger'),
				import('gsap/ScrollSmoother')
			]);
			const root = document.querySelector<HTMLElement>(rootSelector);
			const wrapper = root?.parentElement;

			if (cancelled || !root || !wrapper) {
				return;
			}

			gsap.registerPlugin(ScrollTrigger, ScrollSmoother);
			const smoother = createThemeScrollSmoother(root, root, ScrollSmoother);
			revertAnimations = () => smoother.destroy();
			scrollToTopAnimations = () => {
				smoother?.scrollTop(0);
				window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
			};
			if (scrollToTopRequested) {
				scrollToTopRequested = false;
				scrollToTopAnimations();
			}
			const context = gsap.context(() => {
				if (variant === 'nocturne') {
					gsap
						.timeline({ defaults: { ease: 'power3.out' } })
						.from(
							'.hero > .cover-frame img, .hero > .cover-frame .cover-placeholder',
							{
								scale: 1.2,
								duration: 2.4,
								ease: 'power2.out'
							},
							0
						)
						.from(
							'.hero-copy > *',
							{
								autoAlpha: 0,
								y: 42,
								duration: 1,
								stagger: 0.13
							},
							0.2
						)
						.from(
							'.hero .decoration',
							{
								autoAlpha: 0,
								scale: 0.7,
								rotate: -35,
								duration: 1.8,
								stagger: 0.18
							},
							0.1
						);

					gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((element, index) => {
						gsap.from(element, {
							autoAlpha: 0,
							y: 54,
							x: index % 2 === 0 ? -16 : 16,
							duration: 1.15,
							ease: 'power3.out',
							scrollTrigger: { trigger: element, start: 'top 88%', once: true }
						});
					});

					gsap.utils.toArray<HTMLElement>('[data-gallery-item]').forEach((item, index) => {
						gsap.from(item, {
							autoAlpha: 0,
							y: 65,
							rotate: index % 2 === 0 ? -4 : 4,
							duration: 1,
							ease: 'power3.out',
							scrollTrigger: { trigger: item, start: 'top 90%', once: true }
						});
					});
					return;
				}

				const isBrutalism = variant.startsWith('neubrutalism');
				const isPlayful = variant.startsWith('playful');
				gsap.from('[data-hero-content] > *', {
					autoAlpha: 0,
					x: isBrutalism ? -45 : 0,
					y: isBrutalism ? 0 : isPlayful ? 38 : 30,
					rotate: isBrutalism ? -1.5 : isPlayful ? 2 : 0,
					duration: 0.75,
					stagger: 0.11,
					ease: isBrutalism || isPlayful ? 'back.out(1.5)' : 'power3.out'
				});

				gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((element, index) => {
					gsap.from(element, {
						autoAlpha: 0,
						x: isBrutalism ? (index % 2 === 0 ? -45 : 45) : 0,
						y: isBrutalism ? 0 : 44,
						scale: isBrutalism ? 1 : isPlayful ? 0.9 : 0.97,
						duration: 0.8,
						ease: isBrutalism || isPlayful ? 'back.out(1.25)' : 'power3.out',
						scrollTrigger: { trigger: element, start: 'top 88%', once: true }
					});
				});

				const galleryItems = gsap.utils.toArray<HTMLElement>('[data-gallery-item]');
				galleryItems.forEach((item, index) => {
					gsap.from(item, {
						autoAlpha: 0,
						y: 30,
						scale: 0.88,
						rotate: isBrutalism || isPlayful ? (index % 2 === 0 ? -3 : 3) : 0,
						duration: 0.65,
						ease: 'back.out(1.35)',
						scrollTrigger: { trigger: item, start: 'top 90%', once: true }
					});
				});
			}, root);
			let refreshFrame: number | undefined;
			let observedHeight = root.scrollHeight;
			const scheduleRefresh = () => {
				if (cancelled || refreshFrame !== undefined) {
					return;
				}

				refreshFrame = window.requestAnimationFrame(() => {
					refreshFrame = undefined;
					if (!cancelled) {
						ScrollTrigger.refresh(true);
					}
				});
			};
			const resizeObserver = new ResizeObserver(() => {
				const nextHeight = root.scrollHeight;
				if (Math.abs(nextHeight - observedHeight) < 1) {
					return;
				}

				observedHeight = nextHeight;
				scheduleRefresh();
			});
			const refreshAfterWindowLoad = () => scheduleRefresh();

			resizeObserver.observe(root);
			if (document.readyState === 'complete') {
				scheduleRefresh();
			} else {
				window.addEventListener('load', refreshAfterWindowLoad, { once: true });
			}
			void document.fonts.ready.then(scheduleRefresh);

			refreshAnimations = () => {
				if (refreshFrame !== undefined) {
					window.cancelAnimationFrame(refreshFrame);
					refreshFrame = undefined;
				}
				ScrollTrigger.refresh();
			};

			revertAnimations = () => {
				if (refreshFrame !== undefined) {
					window.cancelAnimationFrame(refreshFrame);
				}
				window.removeEventListener('load', refreshAfterWindowLoad);
				resizeObserver.disconnect();
				context.revert();
				smoother.destroy();
			};
			if (refreshRequested) {
				refreshRequested = false;
				refreshAnimations();
			} else {
				scheduleRefresh();
			}
		} catch {
			revertAnimations?.();
		}
	})();

	return {
		refresh: () => {
			if (cancelled) {
				return;
			}

			if (refreshAnimations) {
				refreshAnimations();
			} else {
				refreshRequested = true;
			}
		},
		scrollToTop: () => {
			if (cancelled) {
				return;
			}

			if (scrollToTopAnimations) {
				scrollToTopAnimations();
			} else {
				scrollToTopRequested = true;
			}
		},
		destroy: () => {
			cancelled = true;
			refreshAnimations = undefined;
			scrollToTopAnimations = undefined;
			revertAnimations?.();
		}
	};
}
