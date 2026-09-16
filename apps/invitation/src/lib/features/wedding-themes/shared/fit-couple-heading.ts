import type { Attachment } from 'svelte/attachments';

/** Keep the names on one line only while their rendered text fits the heading. */
export const fitCoupleHeading: Attachment<HTMLHeadingElement> = (node) => {
	let disposed = false;
	let frame: number | undefined;
	let observedWidth = node.clientWidth;

	const measure = () => {
		frame = undefined;
		if (disposed || !node.isConnected || node.clientWidth === 0) return;

		// Measure the inline layout even when currently stacked, so widening restores it.
		node.dataset.nameLayout = 'inline';
		if (node.scrollWidth > node.clientWidth) {
			node.dataset.nameLayout = 'stacked';
		}
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
