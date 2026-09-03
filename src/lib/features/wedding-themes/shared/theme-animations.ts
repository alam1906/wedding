import type { WeddingThemeKey } from '../model/wedding-theme.js';

export type WeddingThemeAnimation = WeddingThemeKey;

export function mountWeddingThemeAnimations(rootSelector: string, variant: WeddingThemeAnimation) {
	if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
		return () => undefined;
	}

	let cancelled = false;
	let revertAnimations: (() => void) | undefined;

	void (async () => {
		try {
			const [{ gsap }, { ScrollTrigger }] = await Promise.all([
				import('gsap'),
				import('gsap/ScrollTrigger')
			]);
			const root = document.querySelector<HTMLElement>(rootSelector);

			if (cancelled || !root) {
				return;
			}

			gsap.registerPlugin(ScrollTrigger);
			const context = gsap.context(() => {
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
				if (galleryItems.length > 0) {
					gsap.from(galleryItems, {
						autoAlpha: 0,
						y: 30,
						scale: 0.88,
						rotate: (index) => (isBrutalism || isPlayful ? (index % 2 === 0 ? -3 : 3) : 0),
						duration: 0.65,
						stagger: 0.07,
						ease: 'back.out(1.35)',
						scrollTrigger: { trigger: galleryItems[0], start: 'top 90%', once: true }
					});
				}
			}, root);

			revertAnimations = () => context.revert();
			ScrollTrigger.refresh();
		} catch {
			revertAnimations?.();
		}
	})();

	return () => {
		cancelled = true;
		revertAnimations?.();
	};
}
