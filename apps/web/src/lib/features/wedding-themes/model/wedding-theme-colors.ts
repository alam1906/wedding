import type { WeddingThemeKey } from './wedding-theme.js';

export type WeddingThemeColors = {
	background: string;
	surface: string;
	text: string;
	primary: string;
	accent: string;
};

export const WEDDING_THEME_COLORS = {
	'minimalist-1': {
		background: '#FAF7F2',
		surface: '#FFFFFF',
		text: '#332D2A',
		primary: '#B77878',
		accent: '#D8B4A0'
	},
	'minimalist-2': {
		background: '#F4F1EA',
		surface: '#FFFFFF',
		text: '#252722',
		primary: '#66705A',
		accent: '#B49A68'
	},
	'minimalist-3': {
		background: '#F3F8F7',
		surface: '#FFFFFF',
		text: '#263332',
		primary: '#4F7C78',
		accent: '#A8C9C5'
	},
	'neubrutalism-1': {
		background: '#FFF1E6',
		surface: '#FFFFFF',
		text: '#181818',
		primary: '#FF6B6B',
		accent: '#FFD166'
	},
	'neubrutalism-2': {
		background: '#FFF8CC',
		surface: '#FFFFFF',
		text: '#111111',
		primary: '#5B5FEF',
		accent: '#FF8FAB'
	},
	'neubrutalism-3': {
		background: '#DFF7FF',
		surface: '#FFFFFF',
		text: '#151515',
		primary: '#00B894',
		accent: '#FF9F1C'
	},
	'playful-1': {
		background: '#FFF0F5',
		surface: '#FFFFFF',
		text: '#4A3041',
		primary: '#F472B6',
		accent: '#FBBF24'
	},
	'playful-2': {
		background: '#F2ECFF',
		surface: '#FFFFFF',
		text: '#352B4A',
		primary: '#8B5CF6',
		accent: '#22D3EE'
	},
	'playful-3': {
		background: '#E9FFF6',
		surface: '#FFFFFF',
		text: '#234037',
		primary: '#34D399',
		accent: '#FB7185'
	},
	'3d-design-1': {
		background: '#FFF1F4',
		surface: '#FFFFFF',
		text: '#382B36',
		primary: '#E879A9',
		accent: '#FFB86B'
	},
	'3d-design-2': {
		background: '#141225',
		surface: '#24203D',
		text: '#F8F7FF',
		primary: '#8B5CF6',
		accent: '#38BDF8'
	},
	'3d-design-3': {
		background: '#EAF7FF',
		surface: '#FFFFFF',
		text: '#24344A',
		primary: '#4C8DFF',
		accent: '#43D3B5'
	},
	nocturne: {
		background: '#101D23',
		surface: '#192A30',
		text: '#F7F0E1',
		primary: '#D9B77B',
		accent: '#8EADAA'
	}
} as const satisfies Record<WeddingThemeKey, WeddingThemeColors>;
