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
	},
	'puspa-parahyangan': {
		background: '#F5F0E3',
		surface: '#FFFCF4',
		text: '#183C34',
		primary: '#B78A43',
		accent: '#8BA795'
	},
	'pinto-aceh': {
		background: '#F5EBDC',
		surface: '#FFF8EA',
		text: '#421E24',
		primary: '#A56A36',
		accent: '#B83C43'
	},
	'kawung-jawa': {
		background: '#F0E5D1',
		surface: '#FFF9EB',
		text: '#463126',
		primary: '#986543',
		accent: '#BCA27B'
	},
	'gorga-batak': {
		background: '#F1EDE4',
		surface: '#FFFCF4',
		text: '#201D1B',
		primary: '#A82424',
		accent: '#CEAD84'
	},
	'lipa-sabbe-bugis': {
		background: '#E8F1EA',
		surface: '#FCF9E9',
		text: '#143C36',
		primary: '#B58A42',
		accent: '#5B9384'
	},
	'gigi-balang-betawi': {
		background: '#F7F2DF',
		surface: '#FFFBEF',
		text: '#17483F',
		primary: '#C35A38',
		accent: '#81A863'
	},
	'gonjong-minang': {
		background: '#F6EFE4',
		surface: '#FFFAF0',
		text: '#4B1F2C',
		primary: '#B38838',
		accent: '#9E3441'
	},
	'tongkonan-toraja': {
		background: '#F1E8DB',
		surface: '#FFF9EB',
		text: '#382522',
		primary: '#B85F3B',
		accent: '#8B7956'
	},
	kinetika: {
		background: '#EEE6D8',
		surface: '#FFFDF7',
		text: '#382E28',
		primary: '#81634E',
		accent: '#C7AB88'
	},
	anomali: {
		background: '#F7F4EE',
		surface: '#FFFDF8',
		text: '#233B32',
		primary: '#365446',
		accent: '#A2875E'
	},
	selaras: {
		background: '#F5EFE6',
		surface: '#FFFCF7',
		text: '#39282A',
		primary: '#562F38',
		accent: '#B18565'
	}
} as const satisfies Record<WeddingThemeKey, WeddingThemeColors>;
