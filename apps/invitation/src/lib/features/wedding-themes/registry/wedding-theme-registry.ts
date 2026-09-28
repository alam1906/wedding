import type { WeddingThemeDefinition, WeddingThemeKey } from '../model/wedding-theme.js';

export const DEFAULT_WEDDING_THEME: WeddingThemeKey = 'minimalist-1';

export const weddingThemes = [
	{
		key: 'minimalist-1',
		name: 'Minimalist Romantic',
		description: 'Romantis hangat dengan ruang lapang dan detail lembut.',
		load: () => import('../themes/minimalist/Minimalist1Theme.svelte')
	},
	{
		key: 'minimalist-2',
		name: 'Minimalist Elegant',
		description: 'Hijau zaitun dan emas matang dalam komposisi formal yang bersih.',
		load: () => import('../themes/minimalist/Minimalist2Theme.svelte')
	},
	{
		key: 'minimalist-3',
		name: 'Minimalist Fresh',
		description: 'Hijau kebiruan yang segar, modern, dan ringan.',
		load: () => import('../themes/minimalist/Minimalist3Theme.svelte')
	},
	{
		key: 'neubrutalism-1',
		name: 'Neobrutalism Romantic',
		description: 'Coral dan kuning hangat dengan border serta hard shadow.',
		load: () => import('../themes/neubrutalism/Neubrutalism1Theme.svelte')
	},
	{
		key: 'neubrutalism-2',
		name: 'Neobrutalism Elegant',
		description: 'Ungu formal dan pink dalam komposisi grafis berkelas.',
		load: () => import('../themes/neubrutalism/Neubrutalism2Theme.svelte')
	},
	{
		key: 'neubrutalism-3',
		name: 'Neobrutalism Fresh',
		description: 'Toska dan orange yang segar dengan kontras tinggi.',
		load: () => import('../themes/neubrutalism/Neubrutalism3Theme.svelte')
	},
	{
		key: 'playful-1',
		name: 'Playful Romantic',
		description: 'Pink romantis dan kuning hangat dengan bentuk organik.',
		load: () => import('../themes/playful/Playful1Theme.svelte')
	},
	{
		key: 'playful-2',
		name: 'Playful Elegant',
		description: 'Lavender elegan dan cyan dalam tampilan dreamy yang matang.',
		load: () => import('../themes/playful/Playful2Theme.svelte')
	},
	{
		key: 'playful-3',
		name: 'Playful Fresh',
		description: 'Hijau mint dan coral dengan suasana segar yang ceria.',
		load: () => import('../themes/playful/Playful3Theme.svelte')
	},
	{
		key: '3d-design-1',
		name: '3D Romantic',
		description: 'Pink hangat dan orange lembut dengan kedalaman tiga dimensi.',
		load: () => import('../themes/3d-design/ThreeD1Theme.svelte')
	},
	{
		key: '3d-design-2',
		name: '3D Elegant',
		description: 'Ungu gelap dan biru bercahaya dalam komposisi mewah yang berkelas.',
		load: () => import('../themes/3d-design/ThreeD2Theme.svelte')
	},
	{
		key: '3d-design-3',
		name: '3D Fresh',
		description: 'Biru cerah dan mint dengan kedalaman modern yang ringan.',
		load: () => import('../themes/3d-design/ThreeD3Theme.svelte')
	},
	{
		key: 'nocturne',
		name: 'Nocturne',
		description: 'Romansa malam sinematik dengan cahaya emas dan gerak yang mengalir.',
		load: () => import('../themes/nocturne/NocturneTheme.svelte')
	},
	{
		key: 'puspa-parahyangan',
		name: 'Puspa Parahyangan',
		description: 'Keanggunan adat Sunda dengan siluet siger, sulur bunga, dan palet hijau-emas.',
		load: () => import('../themes/sunda/PuspaParahyanganTheme.svelte')
	},
	{
		key: 'pinto-aceh',
		name: 'Pinto Aceh',
		description: 'Gerbang berukir dan bungong jeumpa dalam nuansa merah-emas Aceh.',
		load: () => import('../themes/aceh/PintoAcehTheme.svelte')
	},
	{
		key: 'kawung-jawa',
		name: 'Kawung Jawa',
		description: 'Ritme batik kawung dan warna soga yang tenang.',
		load: () => import('../themes/jawa/KawungJawaTheme.svelte')
	},
	{
		key: 'gorga-batak',
		name: 'Gorga Batak',
		description: 'Geometri gorga dengan kontras merah, hitam, dan putih.',
		load: () => import('../themes/batak/GorgaBatakTheme.svelte')
	},
	{
		key: 'lipa-sabbe-bugis',
		name: 'Lipa Sabbe Bugis',
		description: 'Anyaman sutra berpola kotak dalam hijau zamrud dan emas.',
		load: () => import('../themes/bugis/LipaSabbeBugisTheme.svelte')
	},
	{
		key: 'gigi-balang-betawi',
		name: 'Gigi Balang Betawi',
		description: 'Lisplang bergerigi dan warna ceria khas rumah Betawi.',
		load: () => import('../themes/betawi/GigiBalangBetawiTheme.svelte')
	},
	{
		key: 'gonjong-minang',
		name: 'Gonjong Minang',
		description: 'Siluet atap Rumah Gadang dengan marun dan emas.',
		load: () => import('../themes/minang/GonjongMinangTheme.svelte')
	},
	{
		key: 'tongkonan-toraja',
		name: 'Tongkonan Toraja',
		description: 'Lengkung atap Tongkonan dan geometri tanah Toraja.',
		load: () => import('../themes/toraja/TongkonanTorajaTheme.svelte')
	},
	{
		key: 'kinetika',
		name: 'Buku Kita',
		description: 'Undangan bergaya buku dengan sampul dan halaman yang dapat dibalik.',
		load: () => import('../themes/kinetika/KinetikaTheme.svelte')
	},
	{
		key: 'anomali',
		name: 'Anomali',
		description:
			'Editorial sinematik bernuansa ivory dan hijau dengan animasi berlapis yang halus.',
		load: () => import('../themes/anomali/AnomaliTheme.svelte')
	},
	{
		key: 'selaras',
		name: 'Selaras',
		description:
			'Ivory dan burgundy dengan cerita berbentuk stacked cards, galeri horizontal, dan parallax sinematik.',
		load: () => import('../themes/selaras/SelarasTheme.svelte')
	}
] satisfies WeddingThemeDefinition[];

const weddingThemeMap = Object.fromEntries(
	weddingThemes.map((theme) => [theme.key, theme])
) as Record<WeddingThemeKey, WeddingThemeDefinition>;

export function getWeddingTheme(theme: string): WeddingThemeDefinition {
	const legacyAliases: Record<string, WeddingThemeKey> = {
		minimalist: 'minimalist-1',
		brutalism: 'neubrutalism-1',
		playful: 'playful-1'
	};
	const resolvedTheme = legacyAliases[theme] ?? theme;

	return (
		weddingThemeMap[resolvedTheme as WeddingThemeKey] ?? weddingThemeMap[DEFAULT_WEDDING_THEME]
	);
}
