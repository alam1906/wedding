import type { EditionKey } from './edition-profiles.js';
import {
	createThemeScrollSmoother,
	type ThemeScrollSmoother
} from '../../shared/theme-scroll-smoother.js';

export type EditionMotion = {
	open: (complete: () => void) => void;
	refresh: () => void;
	destroy: () => void;
};

export function mountEditionAnimations(root: HTMLElement, theme: EditionKey): EditionMotion {
	let disposed = false;
	let opened = false;
	let introPlayed = false;
	let refreshTimer: number | undefined;
	let cleanup = () => {};
	let pauseAmbient = () => {};
	let refreshScenes = () => {};
	let revealContent = () => {};
	let finishOpening = () => {};
	let enter = (done: () => void) => done();
	const refresh = () => {
		window.clearTimeout(refreshTimer);
		if (!disposed) refreshTimer = window.setTimeout(() => refreshScenes(), 100);
	};

	void (async () => {
		try {
			const [{ gsap }, { ScrollTrigger }, { ScrollSmoother }] = await Promise.all([
				import('gsap'),
				import('gsap/ScrollTrigger'),
				import('gsap/ScrollSmoother')
			]);
			if (disposed) return;
			gsap.registerPlugin(ScrollTrigger, ScrollSmoother);
			const context = gsap.context(() => {}, root);
			const media = gsap.matchMedia();
			cleanup = () => {
				media.revert();
				context.revert();
			};
			refreshScenes = () => ScrollTrigger.refresh();
			const visibilityChanged = () => pauseAmbient();
			document.addEventListener('visibilitychange', visibilityChanged);
			const revert = cleanup;
			cleanup = () => {
				document.removeEventListener('visibilitychange', visibilityChanged);
				revert();
			};
			context.add(() => {
				media.add(
					{
						motion: '(prefers-reduced-motion: no-preference)',
						reduce: '(prefers-reduced-motion: reduce)'
					},
					(mediaContext) => {
						if (mediaContext.conditions?.reduce) return;
						let scenesBuilt = false;
						let smoother: ThemeScrollSmoother | undefined;
						const particles = root.querySelectorAll('.edition-atmosphere span');
						const ambient = particles.length
							? gsap.to(particles, {
									y: -22,
									opacity: 0.55,
									duration: 3.6,
									stagger: 0.18,
									repeat: -1,
									yoyo: true,
									ease: 'sine.inOut'
								})
							: undefined;
						const petals = Array.from(root.querySelectorAll<HTMLElement>('.edition-petals span'));
						const petalDrift = petals.map((petal, index) =>
							gsap
								.fromTo(
									petal,
									{ y: -30, x: 0, rotation: index * 29 },
									{
										y: () => window.innerHeight + 80,
										x: index % 2 ? 65 : -40,
										rotation: index * 29 + 120,
										duration: 12 + (index % 5),
										repeat: -1,
										ease: 'none'
									}
								)
								.progress(index / petals.length)
						);
						const bulbs = root.querySelectorAll('.edition-string-lights span');
						if (bulbs.length)
							gsap.from(bulbs, {
								opacity: 0.45,
								duration: 1.6,
								stagger: 0.09,
								repeat: 1,
								yoyo: true,
								ease: 'sine.inOut',
								clearProps: 'opacity'
							});
						pauseAmbient = () => {
							ambient?.paused(document.hidden);
							petalDrift.forEach((animation) => animation.paused(document.hidden));
						};
						pauseAmbient();
						const intro =
							!opened && !introPlayed
								? gsap
										.timeline()
										.from('.edition-cover-card', {
											y: 32,
											scale: 0.97,
											autoAlpha: 0,
											duration: 1.4,
											ease: 'power2.out',
											clearProps: 'transform,opacity,visibility'
										})
										.from(
											'.edition-cover-card > *',
											{
												y: 18,
												autoAlpha: 0,
												duration: 1.1,
												stagger: 0.14,
												ease: 'power2.out',
												clearProps: 'transform,opacity,visibility'
											},
											0.2
										)
								: undefined;
						introPlayed = true;
						mediaContext.add('buildScenes', () => {
							if (scenesBuilt || !opened) return;
							mediaContext.ignore(() => {
								const content = root.querySelector<HTMLElement>('[data-theme-scroll-content]');
								if (content) smoother = createThemeScrollSmoother(root, content, ScrollSmoother);
							});
							scenesBuilt = true;
							const revealSelector =
								theme === 'lentera'
									? '.edition-section > .edition-container, .edition-quote, .edition-response, .edition-wishes-card, .edition-footer-card'
									: '[data-edition-reveal]';
							root.querySelectorAll<HTMLElement>(revealSelector).forEach((element, index) => {
								const playful = theme === 'komika' || theme === 'retro';
								gsap.from(element, {
									y: theme === 'swarna' ? 18 : 28,
									x:
										theme === 'safira' && element.classList.contains('edition-person')
											? index % 2
												? 18
												: -18
											: 0,
									rotation:
										(theme === 'cendana' || playful) && element.classList.contains('edition-person')
											? index % 2
												? 4
												: -4
											: 0,
									rotationX: theme === 'lentera' ? 5 : 0,
									transformPerspective: theme === 'lentera' ? 900 : 0,
									scale: playful ? 0.96 : theme === 'zamrud' ? 0.97 : 1,
									autoAlpha: 0,
									duration: 1,
									ease: playful ? 'back.out(1.1)' : 'power2.out',
									clearProps: 'transform,opacity,visibility',
									scrollTrigger: { trigger: element, start: 'top 93%', once: true }
								});
							});
							const record = root.querySelector('.edition-hero-record .edition-hero-media');
							if (record)
								gsap.to(record, {
									rotation: 120,
									ease: 'none',
									scrollTrigger: {
										trigger: record,
										start: 'top bottom',
										end: 'bottom top',
										scrub: 0.8
									}
								});
							if (
								theme === 'folio' ||
								theme === 'sinema' ||
								theme === 'pusaka' ||
								theme === 'kristal'
							) {
								const heroPhoto = root.querySelector('.edition-hero-media img');
								if (heroPhoto)
									gsap.from(heroPhoto, {
										scale: 1.09,
										duration: 1.8,
										ease: 'power2.out',
										clearProps: 'transform',
										scrollTrigger: { trigger: heroPhoto, start: 'top 90%', once: true }
									});
							}
							root.querySelectorAll<HTMLElement>('.edition-portrait img').forEach((portrait) => {
								gsap.from(portrait, {
									scale: 1.08,
									duration: 1.3,
									ease: 'power2.out',
									clearProps: 'transform',
									scrollTrigger: { trigger: portrait, start: 'top 90%', once: true }
								});
							});
							const hero = root.querySelector(
								'.edition-hero-landscape .edition-hero-media img, .edition-hero-vignette .edition-hero-media img, .edition-hero-portrait .edition-hero-media img'
							);
							if (hero)
								gsap.fromTo(
									hero,
									{ yPercent: -4 },
									{
										yPercent: 3,
										ease: 'none',
										scrollTrigger: {
											trigger: root.querySelector('.edition-hero'),
											start: 'top top',
											end: 'bottom top',
											scrub: 0.6
										}
									}
								);
							const photos = root.querySelectorAll<HTMLElement>('[data-edition-photo]');
							if (photos.length)
								gsap.from(photos, {
									y: 30,
									autoAlpha: 0,
									duration: 0.85,
									stagger: 0.08,
									ease: 'power2.out',
									clearProps: 'transform,opacity,visibility',
									scrollTrigger: {
										trigger: root.querySelector('.edition-gallery'),
										start: 'top 90%',
										once: true
									}
								});
							const storyLine = root.querySelector('.edition-story-line span');
							if (storyLine)
								gsap.from(storyLine, {
									scaleY: 0,
									transformOrigin: 'top',
									ease: 'none',
									scrollTrigger: {
										trigger: root.querySelector('.edition-stories'),
										start: 'top 65%',
										end: 'bottom 65%',
										scrub: 0.4
									}
								});
						});
						revealContent = () => mediaContext.buildScenes();
						if (opened) revealContent();
						enter = (done) => {
							intro?.progress(1);
							mediaContext.add(() => {
								const opening = gsap.timeline({
									onComplete: () => {
										finishOpening = () => {};
										done();
									}
								});
								finishOpening = () => opening.progress(1);
								if (theme === 'cendana' || theme === 'pusaka') {
									opening
										.to('.edition-cover-card', { autoAlpha: 0, scale: 0.95, duration: 0.4 })
										.to(
											'.edition-gates span:first-child',
											{ xPercent: -100, duration: 1.05, ease: 'power3.inOut' },
											0.15
										)
										.to(
											'.edition-gates span:last-child',
											{ xPercent: 100, duration: 1.05, ease: 'power3.inOut' },
											0.15
										)
										.to('.edition-cover', { autoAlpha: 0, duration: 0.35 }, 0.8);
								} else if (theme === 'amerta' || theme === 'niskala') {
									opening
										.to('.edition-cover-card', {
											y: -16,
											autoAlpha: 0,
											duration: 0.45,
											ease: 'power2.in'
										})
										.to(
											'.edition-cover-backdrop img',
											{ scale: 1.05, duration: 1.2, ease: 'power2.inOut' },
											0
										)
										.to(
											'.edition-cover',
											{ autoAlpha: 0, duration: 0.85, ease: 'power2.inOut' },
											0.35
										);
								} else if (theme === 'lazuardi' || theme === 'sakura') {
									opening
										.to('.edition-cover-card', {
											y: -28,
											scale: 0.96,
											autoAlpha: 0,
											duration: 0.75,
											ease: 'power2.inOut'
										})
										.to('.edition-cover', { autoAlpha: 0, duration: 0.8, ease: 'sine.inOut' }, 0.3);
								} else if (theme === 'adikara') {
									opening
										.to('.edition-seal', {
											scale: 0.75,
											rotation: -18,
											autoAlpha: 0,
											duration: 0.35
										})
										.to(
											'.edition-cover-card',
											{
												rotationY: -95,
												transformOrigin: 'left center',
												transformPerspective: 1400,
												autoAlpha: 0,
												duration: 1,
												ease: 'power3.inOut'
											},
											0.2
										)
										.to('.edition-cover', { autoAlpha: 0, duration: 0.6 }, 0.8);
								} else if (theme === 'folio' || theme === 'warta') {
									opening
										.to('.edition-cover-card', { y: -20, autoAlpha: 0, duration: 0.4 })
										.to(
											'.edition-cover',
											{ clipPath: 'inset(0 0 100% 0)', duration: 1.1, ease: 'power3.inOut' },
											0.2
										);
								} else if (theme === 'safira' || theme === 'jelajah') {
									opening
										.to('.edition-cover-card', { y: -24, autoAlpha: 0, duration: 0.4 })
										.to(
											'.edition-cover',
											{ yPercent: -100, duration: 0.9, ease: 'power3.inOut' },
											0.15
										);
								} else {
									opening
										.to('.edition-cover-card', {
											y: theme === 'lentera' ? 12 : -18,
											rotationY: theme === 'lentera' ? -12 : 0,
											transformPerspective: 900,
											scale: theme === 'zamrud' ? 1.04 : 0.98,
											autoAlpha: 0,
											duration: 0.6,
											ease: 'power2.inOut'
										})
										.to(
											'.edition-cover',
											{ autoAlpha: 0, duration: 0.7, ease: 'power2.inOut' },
											0.25
										);
								}
							});
						};
						return () => {
							finishOpening();
							smoother?.destroy();
							pauseAmbient = () => {};
							enter = (done) => done();
							revealContent = () => {};
						};
					},
					root
				);
			});
			void document.fonts.ready.then(refresh);
		} catch (error) {
			cleanup();
			enter = (done) => done();
			revealContent = () => {};
			console.error('Edition menggunakan tampilan tanpa animasi.', error);
		}
	})();

	return {
		open: (done) => {
			opened = true;
			revealContent();
			enter(() => {
				if (!disposed) {
					done();
					revealContent();
					refresh();
				}
			});
		},
		refresh,
		destroy: () => {
			disposed = true;
			window.clearTimeout(refreshTimer);
			cleanup();
		}
	};
}
