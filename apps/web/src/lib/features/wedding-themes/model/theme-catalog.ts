import { WEDDING_THEME_KEYS, type WeddingThemeKey } from './wedding-theme.js';

export const THEME_CATEGORIES = [
	{ key: 'all', label: 'Semua' },
	{ key: 'minimalist', label: 'Minimalist' },
	{ key: 'neubrutalism', label: 'Neobrutalism' },
	{ key: 'playful', label: 'Playful' },
	{ key: '3d', label: '3D' },
	{ key: 'adat', label: 'Adat' },
	{ key: 'other', label: 'Lainnya' }
] as const;

export type ThemeCategory = (typeof THEME_CATEGORIES)[number]['key'];

type ThemeMetadata = {
	name: string;
	category: Exclude<ThemeCategory, 'all'>;
};

// Exhaustive by theme key, so new themes cannot silently disappear from the catalog.
const metadata = {
	'post-wedding-1': { name: 'Post Wedding 1', category: 'other' },
	'wedding-anniversary-1': { name: 'Wedding Anniversary 1', category: 'other' },
	'islamic-1': { name: 'Islamic 1', category: 'other' },
	'islamic-2': { name: 'Islamic 2', category: 'other' },
	'luxury-2': { name: 'Luxury 2', category: 'other' },
	'luxury-1': { name: 'Luxury 1', category: 'other' },
	'wedding-shower-1': { name: 'Wedding Shower 1', category: 'other' },
	'bachelorette-1': { name: 'Bachelorette 1', category: 'other' },
	'rehearsal-dinner-1': { name: 'Rehearsal Dinner 1', category: 'other' },
	'overlay-shadow-1': { name: 'Overlay Shadow 1', category: 'other' },
	'overlay-shadow-2': { name: 'Overlay Shadow 2', category: 'other' },
	'overlay-shadow-3': { name: 'Overlay Shadow 3', category: 'other' },
	'sumatera-utara': { name: 'Sumatera Utara', category: 'adat' },
	'sulawesi-selatan': { name: 'Sulawesi Selatan', category: 'adat' },
	'sumatera-barat': { name: 'Sumatera Barat', category: 'adat' },
	jakarta: { name: 'Jakarta', category: 'adat' },
	'jawa-barat': { name: 'Jawa Barat', category: 'adat' },
	'jawa-tengah': { name: 'Jawa Tengah', category: 'adat' },
	'jawa-timur': { name: 'Jawa Timur', category: 'adat' },
	bali: { name: 'Bali', category: 'adat' },
	sunda: { name: 'Sunda', category: 'adat' },
	dayak: { name: 'Dayak', category: 'adat' },
	banjar: { name: 'Banjar', category: 'adat' },
	'minimalist-1': { name: 'minimalist-1', category: 'minimalist' },
	'minimalist-2': { name: 'minimalist-2', category: 'minimalist' },
	'minimalist-3': { name: 'minimalist-3', category: 'minimalist' },
	'minimalist-4': { name: 'minimalist-4', category: 'minimalist' },
	'minimalist-5': { name: 'minimalist-5', category: 'minimalist' },
	'minimalist-6': { name: 'minimalist-6', category: 'minimalist' },
	'minimalist-7': { name: 'minimalist-7', category: 'minimalist' },
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
	lazuardi: { name: 'Lazuardi', category: 'other' },
	melati: { name: 'Floral Melati', category: 'other' },
	eukaliptus: { name: 'Floral Eukaliptus', category: 'other' },
	jingga: { name: 'Floral Jingga', category: 'other' },
	peony: { name: 'Floral Peony', category: 'other' },
	gardenia: { name: 'Floral Gardenia', category: 'other' },
	aster: { name: 'Floral Aster', category: 'other' }
} as const satisfies Record<WeddingThemeKey, ThemeMetadata>;

export const WEDDING_THEME_CATALOG = WEDDING_THEME_KEYS.map((key) => ({
	key,
	...metadata[key],
	thumbnail: `/images/theme-previews/${key}.webp`
}));

export type ThemeCatalogItem = (typeof WEDDING_THEME_CATALOG)[number];
