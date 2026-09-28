import type { Component } from 'svelte';

import type { WeddingData } from '#lib/features/weddings/index.js';

export const WEDDING_THEME_KEYS = [
	'minimalist-1',
	'minimalist-2',
	'minimalist-3',
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
	'puspa-parahyangan',
	'pinto-aceh',
	'kawung-jawa',
	'gorga-batak',
	'lipa-sabbe-bugis',
	'gigi-balang-betawi',
	'gonjong-minang',
	'tongkonan-toraja',
	'kinetika',
	'anomali',
	'selaras'
] as const;

export type WeddingThemeKey = (typeof WEDDING_THEME_KEYS)[number];

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
