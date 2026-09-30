import { WEDDING_THEME_KEYS, type WeddingThemeKey } from './wedding-theme.js';

export const THEME_CATEGORIES = [
	{ key: 'all', label: 'Semua' },
	{ key: 'minimalist', label: 'Minimalist' },
	{ key: 'neubrutalism', label: 'Neobrutalism' },
	{ key: 'playful', label: 'Playful' },
	{ key: '3d', label: '3D' },
	{ key: 'regional', label: 'Adat' },
	{ key: 'other', label: 'Lainnya' }
] as const;

export type ThemeCategory = (typeof THEME_CATEGORIES)[number]['key'];

type ThemeMetadata = {
	name: string;
	category: Exclude<ThemeCategory, 'all'>;
};

// Exhaustive by theme key, so new themes cannot silently disappear from the catalog.
const metadata = {
	'minimalist-1': { name: 'Minimalist Romantic', category: 'minimalist' },
	'minimalist-2': { name: 'Minimalist Elegant', category: 'minimalist' },
	'minimalist-3': { name: 'Minimalist Fresh', category: 'minimalist' },
	'neubrutalism-1': { name: 'Neobrutalism Romantic', category: 'neubrutalism' },
	'neubrutalism-2': { name: 'Neobrutalism Elegant', category: 'neubrutalism' },
	'neubrutalism-3': { name: 'Neobrutalism Fresh', category: 'neubrutalism' },
	'playful-1': { name: 'Playful Romantic', category: 'playful' },
	'playful-2': { name: 'Playful Elegant', category: 'playful' },
	'playful-3': { name: 'Playful Fresh', category: 'playful' },
	'3d-design-1': { name: '3D Romantic', category: '3d' },
	'3d-design-2': { name: '3D Elegant', category: '3d' },
	'3d-design-3': { name: '3D Fresh', category: '3d' },
	nocturne: { name: 'Nocturne', category: 'other' },
	'puspa-parahyangan': { name: 'Puspa Parahyangan', category: 'regional' },
	'pinto-aceh': { name: 'Pinto Aceh', category: 'regional' },
	'kawung-jawa': { name: 'Kawung Jawa', category: 'regional' },
	'gorga-batak': { name: 'Gorga Batak', category: 'regional' },
	'lipa-sabbe-bugis': { name: 'Lipa Sabbe Bugis', category: 'regional' },
	'gigi-balang-betawi': { name: 'Gigi Balang Betawi', category: 'regional' },
	'gonjong-minang': { name: 'Gonjong Minang', category: 'regional' },
	'tongkonan-toraja': { name: 'Tongkonan Toraja', category: 'regional' },
	kinetika: { name: 'Buku Kita', category: 'other' },
	anomali: { name: 'Anomali', category: 'other' },
	selaras: { name: 'Selaras', category: 'other' },
	pramesti: { name: 'Pramesti', category: 'other' },
	seruni: { name: 'Seruni', category: 'other' },
	arsir: { name: 'Arsir', category: 'other' },
	kusuma: { name: 'Kusuma', category: 'other' },
	aurelia: { name: 'Aurelia', category: 'other' },
	arunika: { name: 'Arunika', category: 'other' },
	zamrud: { name: 'Zamrud', category: 'other' },
	cendana: { name: 'Cendana', category: 'other' },
	lentera: { name: 'Lentera', category: 'other' },
	safira: { name: 'Safira', category: 'other' },
	renjana: { name: 'Renjana', category: 'other' },
	monokrom: { name: 'Monokrom', category: 'other' },
	swarna: { name: 'Swarna', category: 'other' },
	sonata: { name: 'Sonata', category: 'other' },
	jelajah: { name: 'Jelajah', category: 'other' },
	folio: { name: 'Folio', category: 'other' },
	pusaka: { name: 'Pusaka', category: 'other' },
	sinema: { name: 'Sinema', category: 'other' },
	adikara: { name: 'Adikara', category: 'other' },
	komika: { name: 'Komika', category: 'other' },
	warta: { name: 'Warta', category: 'other' },
	retro: { name: 'Retro', category: 'other' },
	kristal: { name: 'Kristal', category: 'other' },
	amerta: { name: 'Amerta', category: 'other' },
	niskala: { name: 'Niskala', category: 'other' },
	sakura: { name: 'Sakura', category: 'other' },
	lazuardi: { name: 'Lazuardi', category: 'other' }
} as const satisfies Record<WeddingThemeKey, ThemeMetadata>;

export const WEDDING_THEME_CATALOG = WEDDING_THEME_KEYS.map((key) => ({
	key,
	...metadata[key],
	thumbnail: `/images/theme-previews/${key}.webp`
}));

export type ThemeCatalogItem = (typeof WEDDING_THEME_CATALOG)[number];
