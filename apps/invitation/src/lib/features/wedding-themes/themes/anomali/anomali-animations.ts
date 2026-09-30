import {
	createThemeScrollSmoother,
	type ThemeScrollSmoother
} from '../../shared/theme-scroll-smoother.js';

export type AnomaliMotion = {
	open: (target: HTMLElement, complete: () => void) => void;
	revealPhoto: () => void;
	refresh: () => void;
	destroy: () => void;
};

/** Scoped, native-scroll choreography. Static styles are the usable fallback. */
export function mountAnomaliAnimations(root: HTMLElement): AnomaliMotion {
	let disposed = false;
	let opened = false;
	let introPlayed = false;
	let refreshTimer: number | undefined;
	let cleanup: () => void = () => undefined;
	let refreshScene: () => void = () => undefined;
	let revealPhoto: () => void = () => undefined;
	const staticEntry = (target: HTMLElement, complete: () => void) => {
		target.scrollIntoView({ behavior: 'instant' });
		complete();
	};
	let enter = staticEntry;

	const refresh = () => {
		if (disposed) return;
		window.clearTimeout(refreshTimer);
		refreshTimer = window.setTimeout(() => {
			if (!disposed) refreshScene();
		}, 120);
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
			const listenerCleanups = new Set<() => void>();
			cleanup = () => {
				listenerCleanups.forEach((remove) => remove());
				listenerCleanups.clear();
				media.revert();
				context.revert();
			};

			context.add(() => {
				media.add(
					{
						desktop: '(min-width: 900px)',
						mobile: '(max-width: 899px)',
						fine: '(hover: hover) and (pointer: fine)',
						reduce: '(prefers-reduced-motion: reduce)'
					},
					(mediaContext) => {
						finishEntry();
						finishIntro = () => undefined;
						const { desktop, fine, reduce } = mediaContext.conditions ?? {};
						if (reduce) return;
						let smoother: ThemeScrollSmoother;
						mediaContext.ignore(() => {
							smoother = createThemeScrollSmoother(
								root,
								root.querySelector<HTMLElement>('[data-theme-scroll-content]')!,
								ScrollSmoother
							);
						});
						const select = gsap.utils.selector(root);
						const localCleanups: Array<() => void> = [];
						const listen = (element: Element, type: string, handler: EventListener) => {
							element.addEventListener(type, handler, { passive: true });
							const remove = () => element.removeEventListener(type, handler);
							localCleanups.push(remove);
							listenerCleanups.add(remove);
						};
						const reveal = (targets: Element[], trigger: Element, stagger = 0.1) => {
							if (!targets.length) return;
							gsap.from(targets, {
								y: 28,
								autoAlpha: 0,
								duration: 1.05,
								stagger,
								ease: 'power3.out',
								scrollTrigger: { trigger, start: 'top 88%', once: true }
							});
						};
						const parallax = (image: Element, trigger: Element, distance = 4) => {
							gsap.fromTo(
								image,
								{ yPercent: distance },
								{
									yPercent: -distance,
									ease: 'none',
									scrollTrigger: {
										trigger,
										start: 'top bottom',
										end: 'bottom top',
										scrub: 1.2
									}
								}
							);
						};

						const hero = root.querySelector<HTMLElement>('.cover-section');
						const coverImage = root.querySelector<HTMLImageElement>('.cover-image');
						if (!opened && !introPlayed) {
							introPlayed = true;
							const intro = gsap.timeline({ defaults: { ease: 'power3.out' } });
							finishIntro = () => {
								intro.progress(1);
							};
							intro.fromTo(
								select('.cover-curtain'),
								{ scaleX: 1 },
								{
									scaleX: 0,
									duration: 1.85,
									ease: 'power3.inOut'
								},
								0
							);
							if (coverImage)
								intro.fromTo(
									coverImage,
									{ scale: 1.12 },
									{
										scale: 1,
										duration: 2.4,
										ease: 'power2.out'
									},
									0.1
								);
							intro
								.from(select('.cover-greeting'), { y: 14, autoAlpha: 0, duration: 0.8 }, 0.5)
								.from(
									select('[data-name-letter]'),
									{
										yPercent: 110,
										autoAlpha: 0,
										duration: 1.25,
										stagger: { amount: 0.38, from: 'start' },
										ease: 'power4.out'
									},
									0.55
								)
								.from(
									select('.hero-ampersand'),
									{
										y: 12,
										autoAlpha: 0,
										duration: 1
									},
									0.85
								)
								.from(
									select('.countdown-block > p'),
									{
										y: 14,
										autoAlpha: 0,
										duration: 0.85
									},
									1.05
								)
								.from(
									select('.countdown-cell'),
									{
										y: 18,
										autoAlpha: 0,
										duration: 0.9,
										stagger: 0.07
									},
									1.15
								)
								.from(
									select('.open-button'),
									{
										y: 14,
										autoAlpha: 0,
										duration: 0.9
									},
									1.4
								);
						}
						if (hero) {
							gsap
								.timeline({
									scrollTrigger: {
										trigger: hero,
										start: 'top top',
										end: 'bottom top',
										scrub: 0.9
									}
								})
								.to(select('.cover-image-scroll'), { yPercent: 16, ease: 'none' }, 0)
								.to(select('.cover-content'), { yPercent: 12, opacity: 0.12, ease: 'none' }, 0);
						}

						root.querySelectorAll<HTMLElement>('[data-split-heading]').forEach((heading) => {
							const letters = heading.querySelectorAll('[data-heading-letter]');
							gsap.from(letters, {
								yPercent: 110,
								autoAlpha: 0,
								duration: 1.05,
								stagger: { amount: 0.35 },
								ease: 'power4.out',
								scrollTrigger: { trigger: heading, start: 'top 90%', once: true }
							});
						});

						root.querySelectorAll<HTMLElement>('[data-person]').forEach((person, index) => {
							const frame = person.querySelector('.portrait-frame');
							const photo = person.querySelector('img');
							const copy = person.querySelectorAll('.person-copy > *');
							const timeline = gsap.timeline({
								defaults: { ease: 'power3.out' },
								scrollTrigger: { trigger: person, start: 'top 86%', once: true },
								delay: desktop ? index * 0.12 : 0
							});
							if (frame)
								timeline.fromTo(
									frame,
									{
										clipPath: 'inset(0% 0% 100% 0%)',
										y: 28
									},
									{
										clipPath: 'inset(0% 0% 0% 0%)',
										y: 0,
										duration: 1.45
									},
									0
								);
							timeline.from(
								copy,
								{
									y: 20,
									autoAlpha: 0,
									duration: 1,
									stagger: 0.12
								},
								0.45
							);
							if (photo) parallax(photo, person, 4);
						});

						const events = root.querySelector<HTMLElement>('.event-section');
						const eventBackdrop = root.querySelector('.event-backdrop');
						if (events && eventBackdrop) parallax(eventBackdrop, events, 4);
						root.querySelectorAll<HTMLElement>('[data-event-ticket]').forEach((ticket, index) => {
							const rule = ticket.querySelector('[data-rule]');
							const details = ticket.querySelectorAll(
								'.small-label, h3, .event-time, .event-address'
							);
							const timeline = gsap.timeline({
								defaults: { ease: 'power3.out' },
								delay: desktop ? index * 0.12 : 0,
								scrollTrigger: { trigger: ticket, start: 'top 88%', once: true }
							});
							timeline
								.from(ticket, { y: 38, autoAlpha: 0, duration: 1.1 }, 0)
								.from(details, { y: 15, autoAlpha: 0, duration: 0.85, stagger: 0.09 }, 0.2);
							if (rule) timeline.from(rule, { scaleX: 0, duration: 0.9 }, 0.55);
						});

						const quote = root.querySelector<HTMLElement>('[data-quote-stage]');
						if (quote) {
							gsap
								.timeline({
									scrollTrigger: { trigger: quote, start: 'top 82%', once: true }
								})
								.from(
									quote.querySelectorAll('[data-quote-rule]'),
									{
										scaleX: 0,
										duration: 1.1,
										ease: 'power3.out'
									},
									0
								)
								.from(
									quote.querySelectorAll('[data-quote-word]'),
									{
										y: 8,
										opacity: 0.45,
										duration: 0.9,
										stagger: { amount: 0.9 },
										ease: 'power2.out'
									},
									0.15
								);
						}

						const stories = root.querySelector('.stories');
						const storyProgress = root.querySelector('[data-story-progress]');
						if (stories && storyProgress) {
							gsap.fromTo(
								storyProgress,
								{ scaleY: 0 },
								{
									scaleY: 1,
									ease: 'none',
									scrollTrigger: {
										trigger: stories,
										start: 'top 60%',
										end: 'bottom 60%',
										scrub: 0.6
									}
								}
							);
						}
						root.querySelectorAll<HTMLElement>('[data-story]').forEach((story) => {
							const frame = story.querySelector('.story-visual');
							const photo = frame?.querySelector('img');
							const details = story.querySelectorAll('.story-copy > *');
							const timeline = gsap.timeline({
								defaults: { ease: 'power3.out' },
								scrollTrigger: { trigger: story, start: 'top 86%', once: true }
							});
							if (frame)
								timeline.fromTo(
									frame,
									{
										clipPath: 'inset(0% 0% 100% 0%)',
										y: 24
									},
									{
										clipPath: 'inset(0% 0% 0% 0%)',
										y: 0,
										duration: 1.35
									},
									0
								);
							timeline.from(
								details,
								{
									y: 22,
									autoAlpha: 0,
									duration: 1,
									stagger: 0.12
								},
								frame ? 0.3 : 0
							);
							if (photo) parallax(photo, story, 4);
						});

						root.querySelectorAll<HTMLElement>('[data-gallery-batch]').forEach((batch) => {
							const slots = Array.from(batch.querySelectorAll<HTMLElement>('.gallery-slot'));
							const timeline = gsap.timeline({
								scrollTrigger: { trigger: batch, start: 'top 88%', once: true }
							});
							slots.forEach((slot, index) => {
								const card = slot.querySelector('[data-gallery-card]');
								const photo = slot.querySelector('img');
								timeline.fromTo(
									slot,
									{
										clipPath: 'inset(5% 4% 95% 4%)',
										y: 28
									},
									{
										clipPath: 'inset(0% 0% 0% 0%)',
										y: 0,
										duration: 1.4,
										ease: 'power3.inOut'
									},
									index * 0.13
								);
								if (photo) {
									parallax(photo, slot, 3);
									if (fine && card) {
										const zoom = gsap.quickTo(photo, 'scale', {
											duration: 0.8,
											ease: 'power3.out'
										});
										listen(card, 'pointerenter', () => {
											zoom(1.045);
										});
										listen(card, 'pointerleave', () => {
											zoom(1);
										});
										listen(card, 'focus', () => {
											zoom(1.045);
										});
										listen(card, 'blur', () => {
											zoom(1);
										});
									}
								}
							});
						});

						const gifts = root.querySelector('.gift-grid');
						if (gifts) reveal(Array.from(gifts.children), gifts, 0.14);
						root
							.querySelectorAll<HTMLElement>('.response-paper, .wishes-paper')
							.forEach((panel) => {
								reveal([panel], panel);
							});
						const closing = root.querySelector<HTMLElement>('.closing-section');
						const closingPhoto = closing?.querySelector('.closing-photo');
						if (closing && closingPhoto) parallax(closingPhoto, closing, 4);
						if (closing)
							reveal(Array.from(closing.querySelectorAll('.closing-copy h2 > *')), closing, 0.12);

						// Pointer drift is deliberately bounded to a few pixels, never tilting the layout.
						if (fine && hero && coverImage) {
							const moveX = gsap.quickTo(coverImage, 'x', { duration: 1.3, ease: 'power3.out' });
							const moveY = gsap.quickTo(coverImage, 'y', { duration: 1.3, ease: 'power3.out' });
							listen(hero, 'pointermove', (event) => {
								const pointer = event as PointerEvent;
								const bounds = hero.getBoundingClientRect();
								moveX(((pointer.clientX - bounds.left) / bounds.width - 0.5) * 10);
								moveY(((pointer.clientY - bounds.top) / bounds.height - 0.5) * 6);
							});
							listen(hero, 'pointerleave', () => {
								moveX(0);
								moveY(0);
							});
						}
						return () => {
							smoother.destroy();
							finishIntro = () => undefined;
							localCleanups.forEach((remove) => {
								remove();
								listenerCleanups.delete(remove);
							});
						};
					},
					root
				);
			});

			enter = (target, complete) => {
				finishIntro();
				ScrollTrigger.refresh();
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
					const exit = root.querySelectorAll('.name-mask, .cover-bottom, .cover-greeting');
					const timeline = gsap.timeline({ onComplete: done });
					finishEntry = () => {
						timeline.progress(1);
					};
					timeline
						.to(exit, { y: -16, opacity: 0, duration: 0.55, stagger: 0.035, ease: 'power2.in' }, 0)
						.to(
							window,
							{
								scrollTo: { y: target, autoKill: true, onAutoKill: done },
								duration: 1.35,
								ease: 'power3.inOut'
							},
							0.16
						)
						.set(exit, { clearProps: 'transform,opacity' });
				});
			};
			revealPhoto = () => {
				if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
				context.add(() => {
					const photo = root.querySelector('.photo-dialog > img');
					if (photo)
						gsap.fromTo(
							photo,
							{ opacity: 0.25, scale: 0.985 },
							{
								opacity: 1,
								scale: 1,
								duration: 0.5,
								ease: 'power2.out',
								overwrite: true
							}
						);
				});
			};
			refreshScene = () => ScrollTrigger.refresh();
			const imageReady = (event: Event) => {
				if (event.target instanceof HTMLImageElement && !event.target.closest('dialog')) refresh();
			};
			root.addEventListener('load', imageReady, true);
			root.addEventListener('error', imageReady, true);
			listenerCleanups.add(() => {
				root.removeEventListener('load', imageReady, true);
				root.removeEventListener('error', imageReady, true);
			});
			void document.fonts.ready.then(refresh);
			refresh();
		} catch (error) {
			cleanup();
			enter = staticEntry;
			revealPhoto = () => undefined;
			refreshScene = () => undefined;
			console.error('Animasi Anomali tidak dapat dimuat.', error);
		}
	})();

	return {
		open: (target, complete) => {
			opened = true;
			enter(target, complete);
		},
		revealPhoto: () => revealPhoto(),
		refresh,
		destroy: () => {
			disposed = true;
			window.clearTimeout(refreshTimer);
			cleanup();
		}
	};
}
