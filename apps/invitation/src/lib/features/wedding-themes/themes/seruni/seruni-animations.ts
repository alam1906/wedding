export type SeruniMotion = {
	open: (complete: () => void) => void;
	refresh: () => void;
	destroy: () => void;
};

export function mountSeruniAnimations(root: HTMLElement): SeruniMotion {
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
										.from('.seruni-cover-media', {
											scale: 1.06,
											duration: 2.2,
											ease: 'power2.out',
											clearProps: 'transform'
										})
										.from(
											'.seruni-cover-content > *',
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
							root.querySelectorAll<HTMLElement>('[data-seruni-reveal]').forEach((element) => {
								gsap.from(element, {
									y: 28,
									autoAlpha: 0,
									duration: 1,
									ease: 'power2.out',
									clearProps: 'transform,opacity,visibility',
									scrollTrigger: { trigger: element, start: 'top 93%', once: true }
								});
							});
							gsap.fromTo(
								'.seruni-hero-media',
								{ yPercent: -3 },
								{
									yPercent: 5,
									ease: 'none',
									scrollTrigger: {
										trigger: root.querySelector('.seruni-hero'),
										start: 'top top',
										end: 'bottom top',
										scrub: 0.7
									}
								}
							);
							root.querySelectorAll<HTMLElement>('.seruni-wash').forEach((wash, index) => {
								const drift = gsap.to(wash, {
									x: index % 2 ? -18 : 18,
									y: -14,
									rotation: 8,
									duration: 7 + index,
									repeat: -1,
									yoyo: true,
									ease: 'sine.inOut',
									paused: true
								});
								ScrollTrigger.create({
									trigger: wash.parentElement,
									start: 'top bottom',
									end: 'bottom top',
									onToggle: (trigger) => {
										if (trigger.isActive) drift.play();
										else drift.pause();
									}
								});
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
									.to('.seruni-cover-content', {
										y: -18,
										opacity: 0,
										duration: 0.45,
										ease: 'power2.in'
									})
									.to('.seruni-cover', { opacity: 0, duration: 0.8, ease: 'power2.inOut' }, 0.3)
									.from(
										'.seruni-hero [data-intro]',
										{
											y: 22,
											autoAlpha: 0,
											duration: 1,
											ease: 'power2.out',
											clearProps: 'transform,opacity,visibility'
										},
										0.65
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
			console.error('Seruni menggunakan tampilan tanpa animasi.', error);
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
