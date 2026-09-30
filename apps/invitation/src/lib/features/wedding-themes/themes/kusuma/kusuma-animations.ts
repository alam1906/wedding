export type KusumaMotion = {
	open: (complete: () => void) => void;
	refresh: () => void;
	destroy: () => void;
};

export function mountKusumaAnimations(root: HTMLElement): KusumaMotion {
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
										.from('.kusuma-cover-card', {
											y: 24,
											scale: 0.97,
											autoAlpha: 0,
											duration: 1.1,
											ease: 'power2.out',
											clearProps: 'transform,opacity,visibility'
										})
										.from(
											'.kusuma-cover-card > *',
											{
												y: 12,
												autoAlpha: 0,
												stagger: 0.1,
												duration: 0.8,
												ease: 'power2.out',
												clearProps: 'transform,opacity,visibility'
											},
											0.2
										)
								: undefined;
						introPlayed = true;
						const petals = Array.from(
							root.querySelectorAll<HTMLElement>('.kusuma-falling-petal')
						).map((petal, index) => {
							const tween = gsap.fromTo(
								petal,
								{
									y: -32,
									x: index % 2 ? -16 : 16,
									rotation: index * 32
								},
								{
									y: () => window.innerHeight + 32,
									x: index % 2 ? 38 : -38,
									rotation: 210 + index * 24,
									duration: 22 + index * 1.5,
									ease: 'none',
									repeat: -1,
									repeatRefresh: true,
									paused: true
								}
							);
							tween.progress(index / 10);
							return tween;
						});
						const syncAmbient = () => {
							petals.forEach((tween) => {
								if (document.hidden || !opened || disposed) tween.pause();
								else tween.play();
							});
						};
						document.addEventListener('visibilitychange', syncAmbient);
						mediaContext.add('buildScenes', () => {
							if (scenesBuilt || !opened) return;
							scenesBuilt = true;
							syncAmbient();
							root.querySelectorAll<HTMLElement>('[data-kusuma-reveal]').forEach((element) => {
								gsap.from(element, {
									y: 26,
									autoAlpha: 0,
									duration: 0.95,
									ease: 'power2.out',
									clearProps: 'transform,opacity,visibility',
									scrollTrigger: { trigger: element, start: 'top 93%', once: true }
								});
							});
							root
								.querySelectorAll<HTMLElement>('.kusuma-content .kusuma-flower')
								.forEach((flower, index) => {
									gsap.fromTo(
										flower,
										{ y: 7, rotation: index % 2 ? 10 : -12 },
										{
											y: -8,
											rotation: index % 2 ? -4 : 5,
											ease: 'none',
											scrollTrigger: {
												trigger: flower.parentElement,
												start: 'top bottom',
												end: 'bottom top',
												scrub: 1.2
											}
										}
									);
								});
							const line = root.querySelector('.kusuma-story-line span');
							if (line)
								gsap.from(line, {
									scaleY: 0,
									transformOrigin: 'top',
									ease: 'none',
									scrollTrigger: {
										trigger: root.querySelector('.kusuma-stories'),
										start: 'top 65%',
										end: 'bottom 65%',
										scrub: 0.5
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
									.to('.kusuma-cover-card', {
										y: -22,
										scale: 0.98,
										opacity: 0,
										duration: 0.55,
										ease: 'power2.inOut'
									})
									.to(
										'.kusuma-cover',
										{
											opacity: 0,
											duration: 0.65,
											ease: 'power2.inOut'
										},
										0.3
									);
							});
						};
						return () => {
							finishOpening();
							document.removeEventListener('visibilitychange', syncAmbient);
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
			console.error('Kusuma menggunakan tampilan tanpa animasi.', error);
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
