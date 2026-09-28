import type { WeddingThemeKey } from '../model/wedding-theme.js';

export type WeddingThemeAnimation = WeddingThemeKey;

export type WeddingThemeAnimationController = {
	refresh: () => void;
	scrollToTop: () => void;
	destroy: () => void;
};

const regionalThemes = new Set<WeddingThemeKey>([
	'pinto-aceh',
	'kawung-jawa',
	'gorga-batak',
	'lipa-sabbe-bugis',
	'gigi-balang-betawi',
	'gonjong-minang',
	'tongkonan-toraja'
]);

export function mountWeddingThemeAnimations(
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
			const smoother =
				variant === 'nocturne' || variant === 'puspa-parahyangan' || regionalThemes.has(variant)
					? undefined
					: ScrollSmoother.create({
							wrapper,
							content: root,
							smooth: 1.2,
							smoothTouch: 0.12,
							effects: false
						});
			scrollToTopAnimations = () => {
				smoother?.scrollTop(0);
				window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
			};
			if (scrollToTopRequested) {
				scrollToTopRequested = false;
				scrollToTopAnimations();
			}
			const context = gsap.context(() => {
				if (regionalThemes.has(variant)) {
					const angular = variant === 'gorga-batak' || variant === 'lipa-sabbe-bugis';
					const lively = variant === 'gigi-balang-betawi';
					gsap
						.timeline({ defaults: { ease: angular ? 'power3.out' : 'power2.out' } })
						.from(
							'.hero > .cover-frame img, .hero > .cover-frame .cover-placeholder',
							{
								scale: angular ? 1.04 : 1.1,
								duration: 2.2
							},
							0
						)
						.from(
							'.regional-ornament',
							{
								autoAlpha: 0,
								scale: angular ? 0.9 : 0.75,
								y: -22,
								duration: 1.1
							},
							0.1
						)
						.from(
							'.hero-copy > :not(.regional-ornament)',
							{
								autoAlpha: 0,
								y: lively ? 34 : 24,
								duration: 0.85,
								stagger: 0.11,
								ease: lively ? 'back.out(1.25)' : 'power2.out'
							},
							0.3
						);
					gsap.to('.regional-ornament', {
						y: 5,
						duration: 3.2,
						repeat: -1,
						yoyo: true,
						ease: 'sine.inOut',
						delay: 1.35
					});
					gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((element, index) => {
						gsap.from(element, {
							autoAlpha: 0,
							x: angular ? (index % 2 === 0 ? -22 : 22) : 0,
							y: angular ? 12 : 30,
							duration: 0.85,
							ease: 'power2.out',
							scrollTrigger: { trigger: element, start: 'top 90%', once: true }
						});
					});
					gsap.utils.toArray<HTMLElement>('[data-gallery-item]').forEach((item, index) => {
						gsap.from(item, {
							autoAlpha: 0,
							y: 25,
							rotate: lively ? (index % 2 === 0 ? -2 : 2) : 0,
							duration: 0.8,
							ease: 'power2.out',
							scrollTrigger: { trigger: item, start: 'top 92%', once: true }
						});
					});
					return;
				}
				if (variant === 'puspa-parahyangan') {
					gsap
						.timeline({ defaults: { ease: 'power2.out' } })
						.from(
							'.hero > .cover-frame img, .hero > .cover-frame .cover-placeholder',
							{
								scale: 1.08,
								duration: 2.2
							},
							0
						)
						.from(
							'.sunda-ornament',
							{
								autoAlpha: 0,
								scale: 0.72,
								y: -25,
								duration: 1.1
							},
							0.1
						)
						.from(
							'.hero-copy > :not(.sunda-ornament)',
							{
								autoAlpha: 0,
								y: 28,
								duration: 0.9,
								stagger: 0.12
							},
							0.3
						);
					gsap.to('.sunda-ornament', {
						y: 6,
						duration: 3,
						repeat: -1,
						yoyo: true,
						ease: 'sine.inOut',
						delay: 1.4
					});

					gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((element) => {
						gsap.from(element, {
							autoAlpha: 0,
							y: 32,
							duration: 0.85,
							ease: 'power2.out',
							scrollTrigger: { trigger: element, start: 'top 90%', once: true }
						});
					});

					gsap.utils.toArray<HTMLElement>('[data-gallery-item]').forEach((item) => {
						gsap.from(item, {
							autoAlpha: 0,
							y: 28,
							duration: 0.8,
							ease: 'power2.out',
							scrollTrigger: { trigger: item, start: 'top 92%', once: true }
						});
					});
					return;
				}

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
				smoother?.kill();
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
