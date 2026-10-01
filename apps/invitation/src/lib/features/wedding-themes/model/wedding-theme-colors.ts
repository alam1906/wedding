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
	},
	pramesti: {
		background: '#FFF8E6',
		surface: '#FFFAEE',
		text: '#332719',
		primary: '#D4AF37',
		accent: '#F3D778'
	},
	seruni: {
		background: '#FBF6EE',
		surface: '#F7EFE2',
		text: '#3F2F38',
		primary: '#B69ACB',
		accent: '#E6A3A0'
	},
	arsir: {
		background: '#EAE6DC',
		surface: '#111214',
		text: '#1B1C1E',
		primary: '#E0B329',
		accent: '#A33F1D'
	},
	kusuma: {
		background: '#F3E9DF',
		surface: '#F7F7EC',
		text: '#2B3527',
		primary: '#5D7C4E',
		accent: '#ECB7BE'
	},
	aurelia: {
		background: '#F1E3BE',
		surface: '#FBEBCD',
		text: '#3B2F22',
		primary: '#A57935',
		accent: '#C99D99'
	},
	arunika: {
		background: '#FDFBF7',
		surface: '#F4EBE1',
		text: '#4A3F35',
		primary: '#907358',
		accent: '#BAC1A6'
	},
	zamrud: {
		background: '#07140F',
		surface: '#0E2118',
		text: '#F4ECD8',
		primary: '#D2B257',
		accent: '#2F7158'
	},
	cendana: {
		background: '#FBF6EC',
		surface: '#FFFFFF',
		text: '#4A3B2C',
		primary: '#B95F40',
		accent: '#87986C'
	},
	lentera: {
		background: '#F1E6C8',
		surface: '#F5EACB',
		text: '#3B2F1C',
		primary: '#96732C',
		accent: '#243D2C'
	},
	safira: {
		background: '#EDF0F6',
		surface: '#FFFFFF',
		text: '#203B5E',
		primary: '#A18244',
		accent: '#CAD3E2'
	},
	renjana: {
		background: '#E0E7E8',
		surface: '#F3F0E7',
		text: '#304B58',
		primary: '#557C8E',
		accent: '#CCDADF'
	},
	monokrom: {
		background: '#000000',
		surface: '#171717',
		text: '#F4F4F4',
		primary: '#D4D4D8',
		accent: '#77777D'
	},
	swarna: {
		background: '#090909',
		surface: '#131313',
		text: '#F3EDE0',
		primary: '#C0A574',
		accent: '#82745E'
	},
	sonata: {
		background: '#0D0D0B',
		surface: '#211F16',
		text: '#F4EFE2',
		primary: '#FF591C',
		accent: '#D1AE56'
	},
	jelajah: {
		background: '#F6F1E2',
		surface: '#FFF9EC',
		text: '#15213A',
		primary: '#BD932A',
		accent: '#BF2634'
	},
	folio: {
		background: '#F7F7F3',
		surface: '#F0EFE7',
		text: '#101010',
		primary: '#272727',
		accent: '#91999E'
	},
	pusaka: {
		background: '#F1E9D5',
		surface: '#E3CC96',
		text: '#2B2117',
		primary: '#886720',
		accent: '#B38A43'
	},
	sinema: {
		background: '#09090B',
		surface: '#19191E',
		text: '#F2EEE4',
		primary: '#E2162A',
		accent: '#CEAA59'
	},
	adikara: {
		background: '#FAF3DD',
		surface: '#EFE2BE',
		text: '#4F1020',
		primary: '#9E7925',
		accent: '#68152A'
	},
	komika: {
		background: '#FDF6E8',
		surface: '#FFFAEE',
		text: '#1B1B1F',
		primary: '#FF477E',
		accent: '#FFD83D'
	},
	warta: {
		background: '#EADDB9',
		surface: '#F7EDCF',
		text: '#241A0F',
		primary: '#671D24',
		accent: '#9C7D37'
	},
	retro: {
		background: '#FFF8EA',
		surface: '#FFFDF4',
		text: '#3A2418',
		primary: '#CF1234',
		accent: '#F7C650'
	},
	kristal: {
		background: '#181722',
		surface: '#272330',
		text: '#F3FBFF',
		primary: '#D8BB84',
		accent: '#A6D8E6'
	},
	amerta: {
		background: '#16130F',
		surface: '#29251E',
		text: '#F6F1E8',
		primary: '#C7B183',
		accent: '#E9DED0'
	},
	niskala: {
		background: '#1D1B16',
		surface: '#292720',
		text: '#F4F0E5',
		primary: '#B8B09C',
		accent: '#DED7C8'
	},
	sakura: {
		background: '#FCF4F7',
		surface: '#FFFFFF',
		text: '#51495D',
		primary: '#A73D60',
		accent: '#D788A1'
	},
	lazuardi: {
		background: '#EAF0FB',
		surface: '#FFFFFF',
		text: '#203781',
		primary: '#294495',
		accent: '#F9E8A4'
	},
	melati: {
		background: '#FFFDF9',
		surface: '#FFFFFF',
		text: '#534738',
		primary: '#926B40',
		accent: '#BCA47C'
	},
	eukaliptus: {
		background: '#FBFDFF',
		surface: '#FFFFFF',
		text: '#233C61',
		primary: '#2B4A78',
		accent: '#C6AB75'
	},
	jingga: {
		background: '#FFFDFB',
		surface: '#FFFFFF',
		text: '#4B3428',
		primary: '#A74929',
		accent: '#F39463'
	},
	peony: {
		background: '#FFFAFB',
		surface: '#FFFFFF',
		text: '#68324A',
		primary: '#793D59',
		accent: '#F2CA83'
	},
	gardenia: {
		background: '#FFFEFA',
		surface: '#FFFFFF',
		text: '#4C483C',
		primary: '#98694D',
		accent: '#D5A27F'
	},
	aster: {
		background: '#FCFAF5',
		surface: '#FFFFFF',
		text: '#63462F',
		primary: '#8D603B',
		accent: '#DCC17D'
	}
} as const satisfies Record<WeddingThemeKey, WeddingThemeColors>;
