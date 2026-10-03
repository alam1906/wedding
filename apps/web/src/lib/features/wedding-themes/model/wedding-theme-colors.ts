import type { WeddingThemeKey } from './wedding-theme.js';

export type WeddingThemeColors = {
	background: string;
	surface: string;
	text: string;
	primary: string;
	accent: string;
};

export const WEDDING_THEME_COLORS = {
	'post-wedding-1': {
		background: '#FFFFFF',
		surface: '#F8F4EF',
		text: '#574433',
		primary: '#8C6C4A',
		accent: '#B29674'
	},
	'wedding-anniversary-1': {
		background: '#FFFFFF',
		surface: '#F3F3F2',
		text: '#424649',
		primary: '#7B868B',
		accent: '#C47770'
	},
	'islamic-1': {
		background: '#FFFFFF',
		surface: '#FFF9EB',
		text: '#574322',
		primary: '#AA741B',
		accent: '#CD9127'
	},
	'islamic-2': {
		background: '#FFFFFF',
		surface: '#F5F9F6',
		text: '#244C39',
		primary: '#2D7751',
		accent: '#B99143'
	},
	'luxury-2': {
		background: '#F2EDDA',
		surface: '#F8F3E5',
		text: '#59402E',
		primary: '#A7522E',
		accent: '#38685C'
	},
	'luxury-1': {
		background: '#FFFFFF',
		surface: '#F8F4EE',
		text: '#282F3D',
		primary: '#926728',
		accent: '#C7A467'
	},
	'wedding-shower-1': {
		background: '#FFFFFF',
		surface: '#F4F0ED',
		text: '#5C514C',
		primary: '#A56548',
		accent: '#CE8461'
	},
	'bachelorette-1': {
		background: '#FFFFFF',
		surface: '#FFF9F5',
		text: '#253D2D',
		primary: '#CE3931',
		accent: '#6F722F'
	},
	'rehearsal-dinner-1': {
		background: '#FFFFFF',
		surface: '#FAF6F2',
		text: '#263B2C',
		primary: '#626954',
		accent: '#929A84'
	},
	'overlay-shadow-1': {
		background: '#E7D7B7',
		surface: '#F6EEDC',
		text: '#424530',
		primary: '#51573B',
		accent: '#826343'
	},
	'overlay-shadow-2': {
		background: '#E9DAB7',
		surface: '#FFFDF7',
		text: '#29241B',
		primary: '#6E4933',
		accent: '#E4C379'
	},
	'overlay-shadow-3': {
		background: '#DEDCD7',
		surface: '#FAF9F5',
		text: '#4E3027',
		primary: '#794E39',
		accent: '#9E664B'
	},
	'sumatera-utara': {
		background: '#F2E4D0',
		surface: '#FBF2E5',
		text: '#541D20',
		primary: '#763039',
		accent: '#D2AE72'
	},
	'sulawesi-selatan': {
		background: '#EBF0E5',
		surface: '#F7F7EE',
		text: '#173F36',
		primary: '#245549',
		accent: '#A7AC62'
	},
	'sumatera-barat': {
		background: '#F6EDE7',
		surface: '#FFF8F0',
		text: '#511F32',
		primary: '#793348',
		accent: '#C09A51'
	},
	jakarta: {
		background: '#F5E8DA',
		surface: '#FFF6E9',
		text: '#5C2A20',
		primary: '#963E2F',
		accent: '#D0A578'
	},
	'jawa-barat': {
		background: '#EEF0E5',
		surface: '#FBF9EF',
		text: '#324433',
		primary: '#52634A',
		accent: '#A49467'
	},
	'jawa-tengah': {
		background: '#EFE5D6',
		surface: '#FAF2E4',
		text: '#503322',
		primary: '#765039',
		accent: '#B89B62'
	},
	'jawa-timur': {
		background: '#F9F4EF',
		surface: '#FFFCF7',
		text: '#490E1C',
		primary: '#791E35',
		accent: '#CBA274'
	},
	bali: {
		background: '#E4EFF5',
		surface: '#FDFAF2',
		text: '#27354C',
		primary: '#8A692F',
		accent: '#C49B54'
	},
	sunda: {
		background: '#E1EDF2',
		surface: '#F7F9F8',
		text: '#285873',
		primary: '#477F9B',
		accent: '#D45E82'
	},
	dayak: {
		background: '#3F0D14',
		surface: '#541720',
		text: '#F9E7C4',
		primary: '#E1BD78',
		accent: '#BA8583'
	},
	banjar: {
		background: '#EEE5D4',
		surface: '#FCF5E7',
		text: '#443322',
		primary: '#80683D',
		accent: '#BEA66D'
	},
	'minimalist-1': {
		background: '#FFFFFF',
		surface: '#FFFFFF',
		text: '#272927',
		primary: '#5B7783',
		accent: '#CCD9DE'
	},
	'minimalist-2': {
		background: '#F8F8F1',
		surface: '#FDFDF8',
		text: '#3C4E3C',
		primary: '#52654A',
		accent: '#CBD2C1'
	},
	'minimalist-3': {
		background: '#FFFFFF',
		surface: '#FFFFFF',
		text: '#222323',
		primary: '#AA5029',
		accent: '#FA9156'
	},
	'minimalist-4': {
		background: '#FFFFFF',
		surface: '#FFFFFF',
		text: '#252623',
		primary: '#5D625D',
		accent: '#DDD9CF'
	},
	'minimalist-5': {
		background: '#121313',
		surface: '#1D1E1E',
		text: '#F5F4EE',
		primary: '#E5C7A0',
		accent: '#BCBEB8'
	},
	'minimalist-6': {
		background: '#F0F0ED',
		surface: '#FFFFFF',
		text: '#242625',
		primary: '#4D514A',
		accent: '#CCCEC5'
	},
	'minimalist-7': {
		background: '#F5F6F5',
		surface: '#FFFFFF',
		text: '#161817',
		primary: '#363C37',
		accent: '#C6CDC6'
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
