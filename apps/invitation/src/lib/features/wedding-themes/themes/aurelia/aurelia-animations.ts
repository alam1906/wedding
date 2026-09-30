export type AureliaMotion = {
	open: (complete: () => void) => void;
	refresh: () => void;
	destroy: () => void;
};

export function mountAureliaAnimations(root: HTMLElement): AureliaMotion {
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
			const [{ gsap }, { ScrollTrigger }] = await Promise.all([
				import('gsap'),
				import('gsap/ScrollTrigger')
			]);
			if (disposed) return;
			gsap.registerPlugin(ScrollTrigger);
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
						const intro =
							!opened && !introPlayed
								? gsap
										.timeline()
										.from('.aurelia-cover-card', {
											y: 32,
											scale: 0.97,
											autoAlpha: 0,
											duration: 1.4,
											ease: 'power2.out',
											clearProps: 'transform,opacity,visibility'
										})
										.from(
											'.aurelia-cover-card > *',
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
							scenesBuilt = true;
							root.querySelectorAll<HTMLElement>('[data-aurelia-reveal]').forEach((element) => {
								gsap.from(element, {
									y: 28,
									autoAlpha: 0,
									duration: 1,
									ease: 'power2.out',
									clearProps: 'transform,opacity,visibility',
									scrollTrigger: { trigger: element, start: 'top 93%', once: true }
								});
							});
							root.querySelectorAll<HTMLElement>('.aurelia-portrait img').forEach((portrait) => {
								gsap.from(portrait, {
									scale: 1.08,
									duration: 1.3,
									ease: 'power2.out',
									clearProps: 'transform',
									scrollTrigger: { trigger: portrait, start: 'top 90%', once: true }
								});
							});
							const photos = root.querySelectorAll<HTMLElement>('[data-aurelia-photo]');
							if (photos.length)
								gsap.from(photos, {
									y: 30,
									autoAlpha: 0,
									duration: 0.85,
									stagger: 0.08,
									ease: 'power2.out',
									clearProps: 'transform,opacity,visibility',
									scrollTrigger: {
										trigger: root.querySelector('.aurelia-gallery'),
										start: 'top 90%',
										once: true
									}
								});
							const storyLine = root.querySelector('.aurelia-story-line span');
							if (storyLine)
								gsap.from(storyLine, {
									scaleY: 0,
									transformOrigin: 'top',
									ease: 'none',
									scrollTrigger: {
										trigger: root.querySelector('.aurelia-stories'),
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
								opening
									.to('.aurelia-cover-card', {
										y: -24,
										scale: 0.96,
										autoAlpha: 0,
										duration: 0.65,
										ease: 'power2.inOut'
									})
									.to(
										'.aurelia-cover',
										{
											autoAlpha: 0,
											duration: 0.6,
											ease: 'power2.inOut'
										},
										0.3
									);
							});
						};
						return () => {
							finishOpening();
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
			console.error('Aurelia menggunakan tampilan tanpa animasi.', error);
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
