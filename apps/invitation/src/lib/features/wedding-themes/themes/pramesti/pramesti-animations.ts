import {
	createThemeScrollSmoother,
	type ThemeScrollSmoother
} from '../../shared/theme-scroll-smoother.js';

export type PramestiMotion = {
	open: (complete: () => void) => void;
	refresh: () => void;
	destroy: () => void;
};

export function mountPramestiAnimations(root: HTMLElement): PramestiMotion {
	let disposed = false;
	let opened = false;
	let introPlayed = false;
	let refreshTimer: number | undefined;
	let cleanup = () => {};
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
						const intro =
							!opened && !introPlayed
								? gsap.from('.pramesti-cover-content > *', {
										y: 18,
										autoAlpha: 0,
										stagger: 0.1,
										duration: 0.9,
										ease: 'power2.out',
										clearProps: 'transform,opacity,visibility'
									})
								: undefined;
						introPlayed = true;
						gsap.to('.pramesti-ambient', {
							xPercent: 8,
							yPercent: -5,
							duration: 10,
							yoyo: true,
							repeat: -1,
							ease: 'sine.inOut'
						});
						mediaContext.add('buildScenes', () => {
							if (scenesBuilt || !opened) return;
							mediaContext.ignore(() => {
								const content = root.querySelector<HTMLElement>('[data-theme-scroll-content]');
								if (content) smoother = createThemeScrollSmoother(root, content, ScrollSmoother);
							});
							scenesBuilt = true;
							root.querySelectorAll<HTMLElement>('[data-pramesti-reveal]').forEach((element) => {
								gsap.from(element, {
									y: 26,
									autoAlpha: 0,
									duration: 0.9,
									ease: 'power2.out',
									clearProps: 'transform,opacity,visibility',
									scrollTrigger: { trigger: element, start: 'top 92%', once: true }
								});
							});
							const timeline = root.querySelector('.pramesti-timeline');
							if (timeline)
								gsap.from('.pramesti-timeline-progress', {
									scaleY: 0,
									transformOrigin: 'top',
									ease: 'none',
									scrollTrigger: {
										trigger: timeline,
										start: 'top 70%',
										end: 'bottom 65%',
										scrub: 0.6
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
								opening
									.to('.pramesti-cover-content', {
										y: -24,
										opacity: 0,
										duration: 0.4,
										ease: 'power2.in'
									})
									.to('.pramesti-cover', { opacity: 0, duration: 0.55 }, 0.3)
									.from(
										'.pramesti-hero [data-intro]',
										{
											y: 25,
											autoAlpha: 0,
											duration: 0.9,
											stagger: 0.12,
											ease: 'power3.out',
											clearProps: 'transform,opacity,visibility'
										},
										0.5
									);
							});
						};
						return () => {
							finishOpening();
							smoother?.destroy();
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
			console.error('Pramesti menggunakan tampilan tanpa animasi.', error);
		}
	})();

	return {
		open: (done) => {
			opened = true;
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
