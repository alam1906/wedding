import {
	createThemeScrollSmoother,
	type ThemeScrollSmoother
} from '../../shared/theme-scroll-smoother.js';

export type SelarasMotion = {
	open: (target: HTMLElement, complete: () => void) => void;
	revealPhoto: () => void;
	refresh: () => void;
	destroy: () => void;
};

/** Native document scrolling drives the rails; no wheel or touch interception. */
export function mountSelarasAnimations(root: HTMLElement): SelarasMotion {
	let disposed = false;
	let opened = false;
	let introPlayed = false;
	let timer: number | undefined;
	let cleanup: () => void = () => undefined;
	let refreshScenes: () => void = () => undefined;
	let revealPhoto: () => void = () => undefined;
	const staticEntry = (target: HTMLElement, done: () => void) => {
		target.scrollIntoView({ behavior: 'instant' });
		done();
	};
	let enter = staticEntry;
	const refresh = () => {
		window.clearTimeout(timer);
		if (!disposed)
			timer = window.setTimeout(() => {
				if (!disposed) refreshScenes();
			}, 160);
	};

	void (async () => {
		try {
			const [{ gsap }, { ScrollTrigger }, { ScrollToPlugin }, { ScrollSmoother }] =
				await Promise.all([
					import('gsap'),
					import('gsap/ScrollTrigger'),
					import('gsap/ScrollToPlugin'),
					import('gsap/ScrollSmoother')
				]);
			if (disposed) return;
			gsap.registerPlugin(ScrollTrigger, ScrollToPlugin, ScrollSmoother);
			const context = gsap.context(() => undefined, root);
			const media = gsap.matchMedia();
			let finishIntro: () => void = () => undefined;
			let finishEntry: () => void = () => undefined;
			const externalCleanups: Array<() => void> = [];
			cleanup = () => {
				externalCleanups.forEach((remove) => remove());
				media.revert();
				context.revert();
			};

			context.add(() => {
				media.add(
					{
						desktop: '(min-width: 900px)',
						compact: '(max-width: 899px)',
						reduce: '(prefers-reduced-motion: reduce)'
					},
					(mediaContext) => {
						finishEntry();
						const { desktop, reduce } = mediaContext.conditions ?? {};
						finishIntro = () => undefined;
						const select = gsap.utils.selector(root);
						if (reduce) {
							refreshScenes = () => ScrollTrigger.refresh();
							return () => {
								refreshScenes = () => undefined;
							};
						}
						let smoother: ThemeScrollSmoother;
						mediaContext.ignore(() => {
							smoother = createThemeScrollSmoother(
								root,
								root.querySelector<HTMLElement>('[data-theme-scroll-content]')!,
								ScrollSmoother
							);
						});
						if (!opened && !introPlayed) {
							introPlayed = true;
							const intro = gsap.timeline({ defaults: { ease: 'power3.out' } });
							finishIntro = () => {
								intro.progress(1);
							};
							intro
								.from(
									select('.cover-photo'),
									{ clipPath: 'inset(0% 100% 0% 0%)', duration: 1.65, ease: 'power3.inOut' },
									0
								)
								.from(select('.cover-photo-inner'), { scale: 1.12, duration: 2.2 }, 0)
								.from(select('.cover-panel'), { yPercent: 12, autoAlpha: 0, duration: 1.25 }, 0.15)
								.from(
									select('.hero-name'),
									{ yPercent: 112, duration: 1.15, stagger: 0.16, ease: 'power4.out' },
									0.45
								)
								.from(
									select('.cover-greeting, .ampersand, .cover-date'),
									{ y: 14, autoAlpha: 0, duration: 0.9, stagger: 0.09 },
									0.65
								)
								.from(
									select('.countdown-cell'),
									{ y: 18, autoAlpha: 0, duration: 0.85, stagger: 0.07 },
									0.95
								)
								.from(select('.open-button'), { y: 16, autoAlpha: 0, duration: 0.9 }, 1.15);
						}

						type Rail = {
							stage: HTMLElement;
							viewport: HTMLElement;
							panels: HTMLElement[];
							animation: ReturnType<typeof gsap.to> | ReturnType<typeof gsap.timeline>;
						};
						let sceneContext: ReturnType<typeof gsap.context> | undefined;
						let rails: Rail[] = [];
						let width = window.innerWidth;
						let height = window.innerHeight;
						const fitsRail = (viewport: HTMLElement, panels: HTMLElement[]) =>
							viewport.clientHeight >= 180 &&
							panels.every((panel) => {
								const copy = panel.querySelector<HTMLElement>('.story-copy');
								if (copy) {
									const style = getComputedStyle(panel);
									const contentHeight =
										panel.clientHeight -
										parseFloat(style.paddingTop) -
										parseFloat(style.paddingBottom);
									return (
										panel.scrollHeight <= panel.clientHeight + 2 &&
										copy.offsetHeight <= contentHeight + 2
									);
								}
								return panel.scrollHeight <= viewport.clientHeight + 2;
							});

						const buildScenes = () => {
							sceneContext?.revert();
							rails = [];
							const resets: Array<() => void> = [];
							sceneContext = gsap.context(() => undefined, root);
							// Register non-GSAP cleanup before constructing any scene.
							sceneContext.add(() => () => {
								resets.forEach((reset) => reset());
							});
							sceneContext.add(() => {
								const reveal = (targets: Element[], trigger: Element, x = 0) => {
									if (!targets.length) return;
									gsap.from(targets, {
										x,
										y: x ? 0 : 26,
										autoAlpha: 0,
										duration: 1.1,
										stagger: 0.1,
										ease: 'power3.out',
										scrollTrigger: { trigger, start: 'top 88%', once: true }
									});
								};
								const parallax = (photo: Element, trigger: Element) => {
									gsap.fromTo(
										photo,
										{ yPercent: 3 },
										{
											yPercent: -3,
											ease: 'none',
											scrollTrigger: { trigger, start: 'top bottom', end: 'bottom top', scrub: 1 }
										}
									);
								};
								const enable = (stage: HTMLElement, mode: string) => {
									const previous = stage.getAttribute('data-motion');
									stage.setAttribute('data-motion', mode);
									const reset = () => {
										if (previous === null) stage.removeAttribute('data-motion');
										else stage.setAttribute('data-motion', previous);
									};
									resets.push(reset);
									return reset;
								};
								const hero = root.querySelector('.cover-section');
								if (hero) {
									gsap
										.timeline({
											scrollTrigger: {
												trigger: hero,
												start: 'top top',
												end: 'bottom top',
												scrub: 0.85
											}
										})
										.to(select('.cover-photo-inner'), { yPercent: 18, ease: 'none' }, 0)
										.to(
											select('.cover-content'),
											{ yPercent: -10, opacity: 0.15, ease: 'none' },
											0
										);
								}

								root.querySelectorAll<HTMLElement>('[data-title]').forEach((heading) => {
									reveal(Array.from(heading.querySelectorAll('[data-title-word]')), heading);
								});
								root.querySelectorAll<HTMLElement>('[data-person]').forEach((person, index) => {
									const frame = person.querySelector('.portrait-window');
									const photo = frame?.querySelector('img');
									if (frame)
										gsap.fromTo(
											frame,
											{
												clipPath: index ? 'inset(0% 100% 0% 0%)' : 'inset(0% 0% 0% 100%)'
											},
											{
												clipPath: 'inset(0% 0% 0% 0%)',
												duration: 1.4,
												ease: 'power3.inOut',
												scrollTrigger: { trigger: person, start: 'top 86%', once: true }
											}
										);
									reveal(
										Array.from(person.querySelectorAll('.person-copy > *')),
										person,
										index ? 20 : -20
									);
									if (photo) parallax(photo, person);
								});

								root.querySelectorAll<HTMLElement>('[data-event-slide]').forEach((event) => {
									reveal([event], event);
								});

								const quote = root.querySelector('.quote-inner');
								if (quote) {
									gsap
										.timeline({
											scrollTrigger: { trigger: quote, start: 'top 84%', once: true }
										})
										.from(
											quote.querySelectorAll('.fine-rule'),
											{ scaleX: 0, duration: 1.2, ease: 'power3.out' },
											0
										)
										.from(
											quote.querySelectorAll('[data-quote-word]'),
											{
												y: 8,
												opacity: 0.45,
												duration: 0.9,
												stagger: { amount: 1 },
												ease: 'power2.out'
											},
											0.15
										);
								}

								// Stories form a vertical stack; other sections use the document scroll.
								const storyStage = root.querySelector<HTMLElement>('[data-story-stage]');
								if (storyStage) {
									const viewport = storyStage.querySelector<HTMLElement>('.story-viewport')!;
									const track = storyStage.querySelector<HTMLElement>('.story-track')!;
									const slides = Array.from(
										track.querySelectorAll<HTMLElement>('[data-story-slide]')
									);
									let stacked = false;
									if (slides.length > 1) {
										const reset = enable(storyStage, 'stack');
										if (fitsRail(viewport, slides)) {
											gsap.set(slides, { y: 0, scale: 1, zIndex: (index) => index + 1 });
											gsap.set(slides.slice(1), { y: () => viewport.clientHeight + 32 });
											const animation = gsap.timeline({
												defaults: { duration: 1, ease: 'power2.inOut' },
												scrollTrigger: {
													trigger: storyStage,
													start: 'top top',
													end: () =>
														'+=' +
														(Math.max(460, viewport.clientHeight * 1.2) * (slides.length - 1) +
															180),
													pin: true,
													scrub: 0.7,
													anticipatePin: 1,
													invalidateOnRefresh: true
												}
											});
											slides.slice(1).forEach((card, offset) => {
												const index = offset + 1;
												const at = 0.25 + offset * 1.3;
												animation.fromTo(
													card,
													{ y: () => viewport.clientHeight + 32 },
													{ y: 0, immediateRender: false },
													at
												);
												slides.slice(0, index).forEach((previous, previousIndex) => {
													const depth = Math.min(index - previousIndex, 3);
													animation.to(
														previous,
														{
															y: () =>
																-depth * gsap.utils.clamp(8, 16, viewport.clientHeight * 0.025),
															scale: 1 - depth * 0.035
														},
														at
													);
												});
												const photo = card.querySelector('img');
												if (photo) animation.fromTo(photo, { scale: 1.06 }, { scale: 1 }, at);
											});
											animation.to({}, { duration: 0.3 });
											rails.push({ stage: storyStage, viewport, panels: slides, animation });
											stacked = true;
										} else reset();
									}
									// Preserve full text for long stories, short viewports, and single-card data.
									if (!stacked) slides.forEach((card) => reveal([card], card));
								}

								root.querySelectorAll<HTMLElement>('.gallery-card').forEach((card) => {
									reveal([card], card);
								});
								const gifts = root.querySelector('.gift-grid');
								if (gifts)
									Array.from(gifts.children).forEach((card, index) =>
										reveal([card], card, index ? 28 : -28)
									);
								root
									.querySelectorAll('.response-paper, .wishes-paper')
									.forEach((panel) => reveal([panel], panel));
								// A transformed scroll surface cannot use native sticky positioning.
								const closing = root.querySelector<HTMLElement>('.closing-section');
								if (closing) {
									gsap.set(root.querySelector('.closing-reveal'), { display: 'block' });
									gsap.set(closing, { position: 'relative' });
									gsap.fromTo(
										closing,
										{ yPercent: -100 },
										{
											yPercent: 0,
											ease: 'none',
											scrollTrigger: {
												trigger: root.querySelector('.closing-reveal'),
												start: 'top bottom',
												end: 'bottom bottom',
												scrub: true,
												invalidateOnRefresh: true
											}
										}
									);
								}
							});
						};

						buildScenes();
						const reflow = () => {
							// Re-measure at all viewport sizes, not only at media-query boundaries.
							const overflowing = rails.some(({ viewport, panels }) => !fitsRail(viewport, panels));
							if (
								width !== window.innerWidth ||
								(desktop && height !== window.innerHeight) ||
								overflowing
							) {
								finishIntro();
								finishEntry();
								const active = rails.find(({ animation }) => animation.scrollTrigger?.isActive);
								const bookmark = active && {
									stage: active.stage,
									progress: active.animation.scrollTrigger!.progress
								};
								width = window.innerWidth;
								height = window.innerHeight;
								try {
									buildScenes();
								} catch (error) {
									sceneContext?.revert();
									rails = [];
									console.error('Tata letak Selaras menggunakan tampilan statis.', error);
								}
								ScrollTrigger.refresh();
								if (bookmark) {
									const next = rails.find(({ stage }) => stage === bookmark.stage)?.animation
										.scrollTrigger;
									if (next) {
										window.scrollTo({
											top: next.start + (next.end - next.start) * bookmark.progress,
											behavior: 'instant'
										});
										next.update();
									}
								}
							} else {
								height = window.innerHeight;
								ScrollTrigger.refresh();
							}
						};
						refreshScenes = reflow;
						return () => {
							sceneContext?.revert();
							smoother.destroy();
							finishIntro = () => undefined;
							if (refreshScenes === reflow) refreshScenes = () => undefined;
						};
					},
					root
				);
			});

			enter = (target, complete) => {
				finishIntro();
				refreshScenes();
				if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
					staticEntry(target, complete);
					return;
				}
				context.add(() => {
					let completed = false;
					const done = () => {
						if (completed) return;
						completed = true;
						finishEntry = () => undefined;
						complete();
					};
					const targets = root.querySelectorAll('.name-line, .cover-details, .open-button');
					const timeline = gsap.timeline({ onComplete: done });
					finishEntry = () => {
						timeline.progress(1);
					};
					timeline
						.to(
							targets,
							{ y: -24, opacity: 0, duration: 0.55, stagger: 0.055, ease: 'power2.in' },
							0
						)
						.to(
							window,
							{
								scrollTo: { y: target, autoKill: true, onAutoKill: done },
								duration: 1.4,
								ease: 'power3.inOut'
							},
							0.18
						)
						.set(targets, { clearProps: 'transform,opacity' });
				});
			};
			revealPhoto = () => {
				if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
				context.add(() => {
					const photo = root.querySelector('.photo-dialog > img');
					if (photo)
						gsap.fromTo(
							photo,
							{ opacity: 0.25, y: 10, scale: 0.985 },
							{
								opacity: 1,
								y: 0,
								scale: 1,
								duration: 0.55,
								ease: 'power3.out',
								overwrite: true
							}
						);
				});
			};
			const ready = (event: Event) => {
				if (event.target instanceof HTMLImageElement && !event.target.closest('dialog')) refresh();
			};
			root.addEventListener('load', ready, true);
			root.addEventListener('error', ready, true);
			window.addEventListener('resize', refresh, { passive: true });
			externalCleanups.push(() => {
				root.removeEventListener('load', ready, true);
				root.removeEventListener('error', ready, true);
				window.removeEventListener('resize', refresh);
			});
			void document.fonts.ready.then(refresh);
			refresh();
		} catch (error) {
			cleanup();
			enter = staticEntry;
			refreshScenes = () => undefined;
			revealPhoto = () => undefined;
			console.error('Animasi Selaras tidak dapat dimuat.', error);
		}
	})();

	return {
		open: (target, done) => {
			opened = true;
			enter(target, done);
		},
		revealPhoto: () => revealPhoto(),
		refresh,
		destroy: () => {
			disposed = true;
			window.clearTimeout(timer);
			cleanup();
		}
	};
}
