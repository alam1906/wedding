// Numeric references: https://pixelmemori.id/preview.php?template=template{reference}
// Other providers use an explicit URL so their template numbers are not conflated.
// Shared data behavior, distinct compositions and styles in each theme directory.
export type EditionProfile = {
	reference: number | string;
	cover: 'arch' | 'gate' | 'cinematic' | 'photo' | 'album' | 'seal' | 'polaroid' | 'illustration';
	hero:
		| 'none'
		| 'landscape'
		| 'arch'
		| 'record'
		| 'ticket'
		| 'editorial'
		| 'framed'
		| 'film'
		| 'royal'
		| 'comic'
		| 'paper'
		| 'polaroid'
		| 'crystal'
		| 'vignette'
		| 'portrait';
	story: 'cards' | 'medallions' | 'timeline' | 'scrapbook' | 'timeline-cards' | 'filmstrip';
	quotePhoto?: boolean;
	particles?: boolean;
	calendar?: boolean;
	narrow?: boolean;
	concept?: boolean;
	backdropPhoto?: boolean;
	coverIllustration?: string;
	decoration?: 'petals' | 'lights';
	floral?: {
		frame: 'arch' | 'hexagon' | 'corners' | 'garland' | 'facets' | 'rustic';
		ornament: string;
		countdownAtEvents?: boolean;
	};
};
export const EDITION_PROFILES = {
	arunika: { reference: 8, cover: 'arch', hero: 'none', story: 'cards', quotePhoto: true },
	zamrud: { reference: 9, cover: 'arch', hero: 'landscape', story: 'medallions', particles: true },
	cendana: { reference: 7, cover: 'gate', hero: 'none', story: 'timeline' },
	lentera: {
		reference: 11,
		cover: 'cinematic',
		hero: 'landscape',
		story: 'scrapbook',
		particles: true
	},
	safira: { reference: 12, cover: 'arch', hero: 'none', story: 'timeline', calendar: true },
	renjana: { reference: 13, cover: 'photo', hero: 'arch', story: 'timeline-cards', narrow: true },
	monokrom: { reference: 14, cover: 'photo', hero: 'arch', story: 'timeline-cards', narrow: true },
	swarna: { reference: 15, cover: 'photo', hero: 'arch', story: 'timeline-cards', narrow: true },
	sonata: {
		reference: 16,
		cover: 'album',
		hero: 'record',
		story: 'timeline',
		narrow: true,
		concept: true
	},
	jelajah: {
		reference: 17,
		cover: 'photo',
		hero: 'ticket',
		story: 'scrapbook',
		narrow: true,
		concept: true
	},
	folio: {
		reference: 18,
		cover: 'photo',
		hero: 'editorial',
		story: 'cards',
		narrow: true,
		concept: true
	},
	pusaka: {
		reference: 19,
		cover: 'gate',
		hero: 'framed',
		story: 'scrapbook',
		narrow: true,
		concept: true
	},
	sinema: {
		reference: 20,
		cover: 'photo',
		hero: 'film',
		story: 'cards',
		narrow: true,
		concept: true
	},
	adikara: {
		reference: 21,
		cover: 'seal',
		hero: 'royal',
		story: 'cards',
		narrow: true,
		concept: true
	},
	komika: {
		reference: 22,
		cover: 'photo',
		hero: 'comic',
		story: 'scrapbook',
		narrow: true,
		concept: true
	},
	warta: {
		reference: 23,
		cover: 'photo',
		hero: 'paper',
		story: 'scrapbook',
		narrow: true,
		concept: true
	},
	retro: {
		reference: 24,
		cover: 'polaroid',
		hero: 'polaroid',
		story: 'scrapbook',
		narrow: true,
		concept: true
	},
	kristal: {
		reference: 25,
		cover: 'photo',
		hero: 'crystal',
		story: 'scrapbook',
		narrow: true,
		concept: true
	},
	amerta: {
		reference: 26,
		cover: 'photo',
		hero: 'vignette',
		story: 'filmstrip',
		narrow: true,
		concept: true,
		backdropPhoto: true
	},
	niskala: {
		reference: 27,
		cover: 'photo',
		hero: 'portrait',
		story: 'scrapbook',
		narrow: true,
		concept: true,
		calendar: true,
		backdropPhoto: true
	},
	sakura: {
		reference: 28,
		cover: 'arch',
		hero: 'none',
		story: 'cards',
		decoration: 'petals'
	},
	lazuardi: {
		reference: 29,
		cover: 'illustration',
		coverIllustration: '/images/themes/lazuardi/garden.webp',
		hero: 'none',
		story: 'timeline',
		decoration: 'lights'
	},
	melati: {
		reference: 'https://demo.invee.net/?template=floral-1&ui=true&cover=image',
		cover: 'photo',
		hero: 'landscape',
		story: 'cards',
		floral: { frame: 'arch', ornament: '/images/themes/floral/melati.webp' }
	},
	eukaliptus: {
		reference: 'https://demo.invee.net/?template=floral-2&ui=true&cover=image',
		cover: 'photo',
		hero: 'landscape',
		story: 'timeline-cards',
		floral: { frame: 'hexagon', ornament: '/images/themes/floral/eukaliptus.webp' }
	},
	jingga: {
		reference: 'https://demo.invee.net/?template=floral-3&ui=true&cover=image',
		cover: 'photo',
		hero: 'landscape',
		story: 'medallions',
		floral: { frame: 'corners', ornament: '/images/themes/floral/jingga.webp' }
	},
	peony: {
		reference: 'https://demo.invee.net/?template=floral-4&ui=true&cover=image',
		cover: 'photo',
		hero: 'landscape',
		story: 'timeline',
		floral: { frame: 'garland', ornament: '/images/themes/floral/peony.webp' }
	},
	gardenia: {
		reference: 'https://demo.invee.net/?template=floral-5&ui=true&cover=image',
		cover: 'photo',
		hero: 'landscape',
		story: 'scrapbook',
		floral: {
			frame: 'facets',
			ornament: '/images/themes/floral/gardenia.webp',
			countdownAtEvents: true
		}
	},
	aster: {
		reference: 'https://demo.invee.net/?template=floral-6&ui=true&cover=image',
		cover: 'photo',
		hero: 'landscape',
		story: 'timeline-cards',
		floral: {
			frame: 'rustic',
			ornament: '/images/themes/floral/aster.webp',
			countdownAtEvents: true
		}
	}
} satisfies Record<string, EditionProfile>;
export type EditionKey = keyof typeof EDITION_PROFILES;
