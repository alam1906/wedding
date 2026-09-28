import type { WeddingData } from '#lib/features/weddings/index.js';
import { formatEventDate, formatStoryDate } from '../../shared/theme-utils.js';

export type BookGeometry = {
	width: number;
	height: number;
	single: boolean;
	padding: number;
	bodyFont: number;
	quoteFont: number;
	titleFont: number;
	innerWidth: number;
	bodyHeight: number;
};

export type BookPage = {
	id: string;
	group: string;
	label: string;
	kind:
		| 'person'
		| 'event'
		| 'location'
		| 'quote'
		| 'story'
		| 'gallery'
		| 'gift'
		| 'rsvp'
		| 'wishes'
		| 'closing'
		| 'endpaper';
	person?: 'groom' | 'bride';
	title?: string;
	date?: string;
	time?: string;
	text?: string;
	quoteStart?: boolean;
	quoteEnd?: boolean;
	image?: string;
	imageHeight?: number;
	galleryImages?: Array<{ url: string; index: number }>;
};

export type TextMeasurer = (text: string, size: number, lineHeight: number) => number;

const clamp = (low: number, value: number, high: number) => Math.max(low, Math.min(value, high));

export function getBookGeometry(viewportWidth: number, viewportHeight: number): BookGeometry {
	const single = viewportWidth < 760 || viewportHeight < 460;
	const availableHeight = Math.max(160, viewportHeight - (viewportHeight < 460 ? 92 : 132));
	const ratio = viewportHeight < 460 ? 1.08 : 0.735;
	const sideRoom = single ? 42 : 100;
	const maxWidth = Math.max(160, viewportWidth - sideRoom) / (single ? 1 : 2);
	const height = Math.floor(Math.min(availableHeight, 760, maxWidth / ratio));
	const width = Math.floor(height * ratio);
	const padding = Math.round(clamp(18, width * 0.083, 42));
	return {
		width,
		height,
		single,
		padding,
		bodyFont: clamp(13, width * 0.039, 17),
		quoteFont: clamp(19, width * 0.057, 28),
		titleFont: clamp(24, width * 0.095, 44),
		innerWidth: width - padding * 2,
		bodyHeight: height - padding * 2 - 66
	};
}

/** Uses the same font and wrapping rules as the printed page, without mounting another app. */
export function createTextMeasurer(width: number): { measure: TextMeasurer; destroy: () => void } {
	const node = document.createElement('div');
	node.style.cssText = `position:fixed;left:-10000px;top:0;visibility:hidden;pointer-events:none;width:${width}px;height:auto;padding:0;margin:0;font-family:Georgia,'Times New Roman',serif;white-space:pre-wrap;overflow-wrap:anywhere;letter-spacing:normal;`;
	document.body.append(node);
	return {
		measure(text, size, lineHeight) {
			node.style.fontSize = `${size}px`;
			node.style.lineHeight = String(lineHeight);
			node.textContent = text;
			return node.getBoundingClientRect().height;
		},
		destroy: () => node.remove()
	};
}

/** Pagination preserves the complete text; no line-clamping or ellipsis. */
export function paginateBookText(
	text: string,
	height: number,
	size: number,
	lineHeight: number,
	measure: TextMeasurer
): string[] {
	let rest = text.trim();
	const result: string[] = [];
	const available = Math.max(size * lineHeight, height - 6);
	while (rest) {
		if (measure(rest, size, lineHeight) <= available) {
			result.push(rest);
			break;
		}
		let low = 1;
		let high = rest.length;
		while (low < high) {
			const mid = Math.ceil((low + high) / 2);
			if (measure(rest.slice(0, mid), size, lineHeight) <= available) low = mid;
			else high = mid - 1;
		}
		let cut = low;
		const boundary = rest.slice(0, cut + 1).search(/\s+\S*$/u);
		if (boundary > cut * 0.55) cut = boundary;
		// Never split a UTF-16 surrogate pair between pages.
		if (/[\uD800-\uDBFF]/u.test(rest.charAt(cut - 1))) cut += cut === 1 ? 1 : -1;
		result.push(rest.slice(0, cut).trimEnd());
		rest = rest.slice(cut).trimStart();
	}
	return result.length ? result : [''];
}

export function buildBookPages(
	wedding: WeddingData,
	geometry: BookGeometry,
	measure: TextMeasurer
): BookPage[] {
	const { bodyHeight, bodyFont, titleFont, quoteFont } = geometry;
	const pages: BookPage[] = [
		{ id: 'groom', group: 'couple', kind: 'person', person: 'groom', label: 'Mempelai Pria' },
		{ id: 'bride', group: 'couple', kind: 'person', person: 'bride', label: 'Mempelai Wanita' }
	];
	for (const event of [
		{ id: 'akad', label: 'Akad Nikah', value: wedding.akad },
		{ id: 'reception', label: 'Resepsi', value: wedding.reception }
	]) {
		const date = formatEventDate(event.value);
		const remaining =
			bodyHeight -
			measure(date.date, titleFont, 1.15) -
			bodyFont * 1.6 -
			(geometry.height < 360 ? 50 : 90);
		const address = paginateBookText(wedding.address, remaining, bodyFont, 1.6, measure);
		pages.push({
			id: event.id,
			group: 'event',
			kind: 'event',
			label: event.label,
			date: date.date,
			time: date.time,
			text: address[0]
		});
		for (let i = 1; i < address.length; i++) {
			pages.push({
				id: `${event.id}-address-${i}`,
				group: 'event',
				kind: 'location',
				label: event.label,
				title: 'Lokasi',
				text: address[i]
			});
		}
	}
	if (wedding.quote.trim()) {
		const quotePages = paginateBookText(wedding.quote, bodyHeight - 88, quoteFont, 1.42, measure);
		quotePages.forEach((text, i) => {
			pages.push({
				id: `quote-${i}`,
				group: 'quote',
				kind: 'quote',
				label: 'Kutipan',
				text,
				quoteStart: i === 0,
				quoteEnd: i === quotePages.length - 1
			});
		});
	}
	for (const [index, story] of wedding.stories.entries()) {
		const title = story.title || `Cerita ${index + 1}`;
		const date = formatStoryDate(story.date);
		const headingHeight = measure(title, titleFont, 1.15) + (date ? 20 : 0) + 32;
		const imageHeight = story.image_url
			? Math.round(
					clamp(
						Math.min(bodyHeight * 0.22, 110),
						bodyHeight - headingHeight - measure(story.content, bodyFont, 1.65) - 8,
						Math.min(bodyHeight * 0.38, 200)
					)
				)
			: 0;
		const firstHeight = bodyHeight - headingHeight - imageHeight;
		const firstText = paginateBookText(story.content, firstHeight, bodyFont, 1.65, measure)[0];
		pages.push({
			id: `story-${story.id}-0`,
			group: `story-${story.id}`,
			kind: 'story',
			label: 'Cerita Kami',
			title,
			date,
			text: firstText,
			image: story.image_url,
			imageHeight
		});
		const remaining = story.content.trim().slice(firstText.length).trimStart();
		if (remaining) {
			paginateBookText(remaining, bodyHeight - headingHeight, bodyFont, 1.65, measure).forEach(
				(text, i) => {
					pages.push({
						id: `story-${story.id}-${i + 1}`,
						group: `story-${story.id}`,
						kind: 'story',
						label: 'Cerita Kami',
						title,
						date,
						text
					});
				}
			);
		}
	}
	for (let i = 0; i < wedding.gallery.length; i += 4) {
		pages.push({
			id: `gallery-${i / 4}`,
			group: 'gallery',
			kind: 'gallery',
			label: 'Galeri',
			galleryImages: wedding.gallery.slice(i, i + 4).map((photo, offset) => ({
				url: photo.url,
				index: i + offset
			}))
		});
	}
	if (wedding.gift_enabled && (wedding.groom_payment_number || wedding.bride_payment_number))
		pages.push({ id: 'gift', group: 'gift', kind: 'gift', label: 'Hadiah' });
	// On a wide screen, RSVP and guest wishes form one facing spread.
	if (!geometry.single && pages.length % 2)
		pages.push({ id: 'rsvp-endpaper', group: 'rsvp', kind: 'endpaper', label: '' });
	pages.push(
		{ id: 'rsvp', group: 'rsvp', kind: 'rsvp', label: 'Konfirmasi Kehadiran' },
		{ id: 'wishes', group: 'wishes', kind: 'wishes', label: 'Ucapan Tamu' },
		{ id: 'closing', group: 'closing', kind: 'closing', label: 'Terima Kasih' }
	);
	if (!geometry.single && pages.length % 2)
		pages.push({ id: 'endpaper', group: 'closing', kind: 'endpaper', label: '' });
	return pages;
}
