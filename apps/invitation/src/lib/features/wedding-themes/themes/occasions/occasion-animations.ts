import type { gsap as Gsap } from 'gsap';

// Called inside the edition's scoped, reduced-motion-aware GSAP context.
export function createOccasionIntro(root: HTMLElement, gsap: typeof Gsap) {
	const intro = gsap.timeline();
	const photo = root.querySelector('.edition-cover .occasion-scene-photo');
	const image = photo?.querySelector('img');
	const titles = root.querySelectorAll('.edition-cover .occasion-title > *');
	const invite = root.querySelector('.edition-cover .occasion-invite');
	const editorial = ['luxury-2', 'bachelorette-1', 'rehearsal-dinner-1', 'post-wedding-1'].some(
		(key) => root.classList.contains(key)
	);
	if (photo && editorial)
		intro.fromTo(
			photo,
			{ clipPath: 'inset(0 0 100% 0)' },
			{ clipPath: 'inset(0 0 0% 0)', duration: 1.5, ease: 'power3.inOut', clearProps: 'clipPath' },
			0
		);
	if (image)
		intro.from(
			image,
			{ scale: 1.075, duration: 2, ease: 'power2.out', clearProps: 'transform' },
			0
		);
	if (titles.length)
		intro.from(
			titles,
			{
				y: 24,
				autoAlpha: 0,
				stagger: 0.16,
				duration: 1.2,
				ease: 'power3.out',
				clearProps: 'transform,opacity,visibility'
			},
			0.35
		);
	if (invite)
		intro.from(
			invite,
			{
				y: 16,
				autoAlpha: 0,
				duration: 0.9,
				ease: 'power2.out',
				clearProps: 'transform,opacity,visibility'
			},
			0.8
		);
	root
		.querySelectorAll<SVGGeometryElement>('.edition-cover .occasion-wave path')
		.forEach((line, index) => {
			const length = line.getTotalLength();
			intro.fromTo(
				line,
				{ strokeDasharray: length, strokeDashoffset: length },
				{
					strokeDashoffset: 0,
					duration: 1.8,
					ease: 'power2.inOut',
					clearProps: 'strokeDasharray,strokeDashoffset'
				},
				(index % 18) * 0.012
			);
		});
	return intro;
}

export function mountOccasionScenes(root: HTMLElement, gsap: typeof Gsap) {
	const hero = root.querySelector('.occasion-hero');
	const photo = hero?.querySelector('.occasion-scene-photo img');
	if (photo)
		gsap.fromTo(
			photo,
			{ scale: 1.065, yPercent: -2 },
			{
				yPercent: 2,
				ease: 'none',
				scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.8 }
			}
		);
	root
		.querySelectorAll<HTMLElement | SVGElement>('.edition-content [data-occasion-ornament]')
		.forEach((ornament, index) => {
			const lantern = ornament.classList.contains('occasion-lantern');
			gsap.fromTo(ornament, lantern ? { rotation: -1.4 } : { y: -10 }, {
				...(lantern ? { rotation: 1.4 } : { y: 10 }),
				ease: 'none',
				scrollTrigger: {
					trigger: ornament.closest('section'),
					start: 'top bottom',
					end: 'bottom top',
					scrub: 1 + (index % 2) * 0.2
				}
			});
		});
	root.querySelectorAll<HTMLElement>('.edition-story-photo').forEach((photo) => {
		gsap.fromTo(
			photo,
			{ clipPath: 'inset(0 0 12% 0)' },
			{
				clipPath: 'inset(0 0 0% 0)',
				duration: 1.3,
				ease: 'power3.out',
				clearProps: 'clipPath',
				scrollTrigger: { trigger: photo, start: 'top 94%', once: true }
			}
		);
	});
}

export function openOccasionCover(root: HTMLElement, timeline: ReturnType<typeof Gsap.timeline>) {
	const copy = root.querySelectorAll(
		'.edition-cover .occasion-title, .edition-cover .occasion-invite'
	);
	const photo = root.querySelector('.edition-cover .occasion-scene-photo img');
	const cover = root.querySelector('.edition-cover');
	const editorial = ['luxury-2', 'bachelorette-1', 'rehearsal-dinner-1', 'post-wedding-1'].some(
		(key) => root.classList.contains(key)
	);
	if (copy.length)
		timeline.to(
			copy,
			{ y: -16, autoAlpha: 0, duration: 0.5, stagger: 0.06, ease: 'power2.inOut' },
			0
		);
	if (photo) timeline.to(photo, { scale: 1.04, duration: 1.2, ease: 'sine.inOut' }, 0);
	if (cover)
		timeline.to(
			cover,
			editorial
				? { clipPath: 'inset(0 0 100% 0)', duration: 1.15, ease: 'power3.inOut' }
				: { autoAlpha: 0, duration: 1.05, ease: 'sine.inOut' },
			0.25
		);
}
