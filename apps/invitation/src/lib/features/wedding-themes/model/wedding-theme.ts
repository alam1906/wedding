import type { Component } from 'svelte';

import type { WeddingData } from '#lib/features/weddings/index.js';

export const WEDDING_THEME_KEYS = [
	'neubrutalism-1',
	'neubrutalism-2',
	'neubrutalism-3',
	'playful-1',
	'playful-2',
	'playful-3',
	'3d-design-1',
	'3d-design-2',
	'3d-design-3',
	'nocturne',
	'kinetika',
	'anomali',
	'selaras',
	'pramesti',
	'seruni',
	'arsir',
	'kusuma',
	'aurelia',
	'arunika',
	'zamrud',
	'cendana',
	'lentera',
	'safira',
	'renjana',
	'monokrom',
	'swarna',
	'sonata',
	'jelajah',
	'folio',
	'pusaka',
	'sinema',
	'adikara',
	'komika',
	'warta',
	'retro',
	'kristal',
	'amerta',
	'niskala',
	'sakura',
	'lazuardi',
	'melati',
	'eukaliptus',
	'jingga',
	'peony',
	'gardenia',
	'aster',
	'minimalist-1',
	'minimalist-2',
	'minimalist-3',
	'minimalist-4',
	'minimalist-5',
	'minimalist-6',
	'minimalist-7',
	'sumatera-utara',
	'sulawesi-selatan',
	'sumatera-barat',
	'jakarta',
	'jawa-barat',
	'jawa-tengah',
	'jawa-timur',
	'bali',
	'sunda',
	'dayak',
	'banjar',
	'overlay-shadow-1',
	'overlay-shadow-2',
	'overlay-shadow-3',
	'post-wedding-1',
	'wedding-anniversary-1',
	'islamic-1',
	'islamic-2',
	'luxury-2',
	'luxury-1',
	'wedding-shower-1',
	'bachelorette-1',
	'rehearsal-dinner-1'
] as const;

export type WeddingThemeKey = (typeof WEDDING_THEME_KEYS)[number];

export type CanvasWeddingThemeKey = Extract<
	WeddingThemeKey,
	'nocturne' | `neubrutalism-${number}` | `playful-${number}` | `3d-design-${number}`
>;

export type WeddingThemeProps = {
	wedding: WeddingData;
};

export type WeddingThemeModule = {
	default: Component<WeddingThemeProps>;
};

export type WeddingThemeDefinition = {
	key: WeddingThemeKey;
	name: string;
	description: string;
	load: () => Promise<WeddingThemeModule>;
};

export function isWeddingThemeKey(value: unknown): value is WeddingThemeKey {
	return typeof value === 'string' && WEDDING_THEME_KEYS.includes(value as WeddingThemeKey);
}
