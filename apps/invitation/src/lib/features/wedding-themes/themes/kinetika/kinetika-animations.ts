export type BookDirection = 'next' | 'previous';
type TurnOptions = {
	host: HTMLElement;
	front: HTMLElement;
	back: HTMLElement;
	width: number;
	height: number;
	direction: BookDirection;
	complete: () => void;
};

export type BookAnimationController = {
	open: (single: boolean, complete: () => void) => Promise<void>;
	turn: (options: TurnOptions) => Promise<void>;
	settle: () => void;
	destroy: () => void;
};

function copyPrintedPage(source: HTMLElement, width: number, height: number): HTMLElement {
	const copy = source.cloneNode(true) as HTMLElement;
	copy.style.width = `${width}px`;
	copy.style.height = `${height}px`;
	copy.style.position = 'absolute';
	copy.style.top = '0';
	copy.inert = true;
	copy.setAttribute('aria-hidden', 'true');
	copy.removeAttribute('id');
	copy.querySelectorAll('[id]').forEach((node) => node.removeAttribute('id'));
	const originalFields = source.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
		'input, textarea'
	);
	copy
		.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input, textarea')
		.forEach((node, index) => {
			node.value = originalFields[index]?.value ?? '';
			if (node instanceof HTMLInputElement && originalFields[index] instanceof HTMLInputElement)
				node.checked = originalFields[index].checked;
			node.disabled = true;
		});
	return copy;
}

/** Articulated paper strips keep the actual printed content on both faces of the turn. */
function createPaperLeaf(options: TurnOptions) {
	const count = 8;
	const segments: HTMLElement[] = [];
	const shades: HTMLElement[] = [];
	let parent = options.host;
	for (let index = 0; index < count; index++) {
		const segment = document.createElement('div');
		Object.assign(segment.style, {
			position: 'absolute',
			width: `${options.width / count}px`,
			height: `${options.height}px`,
			left: index ? '100%' : '0',
			top: '0',
			transformOrigin: 'left center',
			transformStyle: 'preserve-3d'
		});
		for (const side of ['front', 'back'] as const) {
			const face = document.createElement('div');
			Object.assign(face.style, {
				position: 'absolute',
				inset: '0',
				width: `${options.width / count + 0.35}px`,
				overflow: 'hidden',
				backfaceVisibility: 'hidden',
				background: '#f8f2e5',
				transform: side === 'back' ? 'rotateY(180deg) translateZ(0.15px)' : 'translateZ(0.15px)'
			});
			const copy = copyPrintedPage(options[side], options.width, options.height);
			copy.style.left = `${(-(side === 'front' ? index : count - index - 1) * options.width) / count}px`;
			face.append(copy);
			const shade = document.createElement('div');
			Object.assign(shade.style, {
				position: 'absolute',
				inset: '0',
				background: '#554127',
				opacity: '0',
				pointerEvents: 'none'
			});
			face.append(shade);
			shades.push(shade);
			segment.append(face);
		}
		parent.append(segment);
		parent = segment;
		segments.push(segment);
	}
	return { segments, shades };
}

export function mountKinetikaAnimations(root: HTMLElement): BookAnimationController {
	let disposed = false;
	let gsap: (typeof import('gsap'))['gsap'] | undefined;
	let context: ReturnType<(typeof import('gsap'))['gsap']['context']> | undefined;
	let active: ReturnType<(typeof import('gsap'))['gsap']['timeline']> | undefined;
	let cleanupLeaf: (() => void) | undefined;
	const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	const ready = import('gsap').then(
		(module) => {
			if (disposed) return;
			gsap = module.gsap;
			context = gsap.context(() => {}, root);
		},
		() => {
			/* Keep navigation available if optional motion cannot load. */
		}
	);

	return {
		async open(single, complete) {
			await ready;
			if (disposed) return;
			const book = root.querySelector<HTMLElement>('.book-object');
			const cover = root.querySelector<HTMLElement>('.hard-cover');
			const left = root.querySelector<HTMLElement>('.left-bed');
			if (!gsap || !context || !book || !cover || reduced()) {
				complete();
				return;
			}
			context.add(() => {
				if (left) gsap?.set(left, { opacity: 0 });
				active = gsap
					?.timeline({
						onComplete: () => {
							active = undefined;
							complete();
						}
					})
					.fromTo(
						book,
						{ x: 0, xPercent: single ? 0 : -25 },
						{ xPercent: 0, duration: 1.48, ease: 'power2.inOut' },
						0
					)
					.fromTo(
						cover,
						{ rotationY: 0 },
						{
							rotationY: -180,
							duration: 1.58,
							ease: 'power2.inOut',
							transformOrigin: 'left center'
						},
						0.04
					)
					.to(cover, { '--cover-shade': 0.3, duration: 0.72, ease: 'sine.in' }, 0.04)
					.to(cover, { '--cover-shade': 0, duration: 0.75, ease: 'sine.out' }, 0.8);
				if (left) active?.to(left, { opacity: 1, duration: 0.12 }, 1.42);
			});
		},
		async turn(options) {
			await ready;
			if (disposed) return;
			if (!gsap || !context || reduced()) {
				options.complete();
				return;
			}
			const { segments, shades } = createPaperLeaf(options);
			const shadow = root.querySelector<HTMLElement>('.page-cast-shadow');
			cleanupLeaf = () => {
				options.host.replaceChildren();
				if (shadow) shadow.style.opacity = '0';
			};
			const setters = segments.map((segment) => gsap!.quickSetter(segment, 'rotationY', 'deg'));
			const state = { progress: options.direction === 'next' ? 0 : 1 };
			const draw = () => {
				const curl = Math.sin(Math.PI * state.progress);
				setters[0](-180 * state.progress - curl * 9);
				for (let index = 1; index < segments.length; index++)
					setters[index](curl * (3.4 + Math.sin((index / segments.length) * Math.PI) * 2.4));
				shades.forEach((shade, index) => {
					shade.style.opacity = String(
						curl *
							(0.09 + (index % 2 ? 0.035 : 0.1) * (1 - Math.floor(index / 2) / segments.length))
					);
				});
				if (shadow) shadow.style.opacity = String(curl * 0.32);
			};
			draw();
			context.add(() => {
				active = gsap
					?.timeline({
						onComplete: () => {
							active = undefined;
							options.complete();
							cleanupLeaf?.();
							cleanupLeaf = undefined;
						}
					})
					.to(state, {
						progress: options.direction === 'next' ? 1 : 0,
						duration: 1.12,
						ease: 'sine.inOut',
						onUpdate: draw
					});
			});
		},
		settle() {
			active?.progress(1);
		},
		destroy() {
			disposed = true;
			active?.kill();
			cleanupLeaf?.();
			context?.revert();
		}
	};
}
