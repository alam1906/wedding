import type { Attachment } from 'svelte/attachments';

const STACKED_FONT_SIZE_PROPERTY = '--hero-stacked-font-size';
const STACKED_WIDTH_RATIO = 0.9;
const MINIMUM_STACKED_FONT_SIZE_REM = 1.75;

/** Keep both names on separate centered lines and fit them to the available width. */
export const fitCoupleHeading: Attachment<HTMLHeadingElement> = (node) => {
	let disposed = false;
	let frame: number | undefined;
	let observedWidth = node.clientWidth;

	const measure = () => {
		frame = undefined;
		if (disposed || !node.isConnected || node.clientWidth === 0) return;

		node.style.removeProperty(STACKED_FONT_SIZE_PROPERTY);
		node.dataset.nameLayout = 'stacked';
		const names = node.querySelectorAll<HTMLElement>('.hero-name');
		const widestName = Math.max(0, ...Array.from(names, (name) => name.scrollWidth));
		if (widestName === 0) return;

		const maximumFontSize = Number.parseFloat(window.getComputedStyle(node).fontSize);
		const rootFontSize = Number.parseFloat(
			window.getComputedStyle(document.documentElement).fontSize
		);
		const minimumFontSize = rootFontSize * MINIMUM_STACKED_FONT_SIZE_REM;
		const availableWidth = node.clientWidth * STACKED_WIDTH_RATIO;
		const fittedFontSize = Math.max(
			minimumFontSize,
			Math.min(maximumFontSize, maximumFontSize * (availableWidth / widestName))
		);

		node.style.setProperty(STACKED_FONT_SIZE_PROPERTY, `${fittedFontSize}px`);
	};

	const scheduleMeasure = () => {
		if (!disposed && frame === undefined) {
			frame = window.requestAnimationFrame(measure);
		}
	};

	const resizeObserver = new ResizeObserver(([entry]) => {
		if (entry && entry.contentRect.width !== observedWidth) {
			observedWidth = entry.contentRect.width;
			scheduleMeasure();
		}
	});
	const textObserver = new MutationObserver(scheduleMeasure);
	resizeObserver.observe(node);
	textObserver.observe(node, { childList: true, characterData: true, subtree: true });
	window.addEventListener('resize', scheduleMeasure);
	document.fonts.addEventListener('loadingdone', scheduleMeasure);
	void document.fonts.ready.then(scheduleMeasure);
	measure();

	return () => {
		disposed = true;
		if (frame !== undefined) window.cancelAnimationFrame(frame);
		resizeObserver.disconnect();
		textObserver.disconnect();
		window.removeEventListener('resize', scheduleMeasure);
		document.fonts.removeEventListener('loadingdone', scheduleMeasure);
	};
};
