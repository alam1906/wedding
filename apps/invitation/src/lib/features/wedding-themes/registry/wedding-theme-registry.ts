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
	},
	{
		key: 'pramesti',
		name: 'Pramesti',
		description: 'Ivory dan emas dengan tipografi serif, galeri, dan timeline cerita yang elegan.',
		load: () => import('../themes/pramesti/PramestiTheme.svelte')
	},
	{
		key: 'seruni',
		name: 'Seruni',
		description: 'Foto layar penuh, kaligrafi, cerita polaroid, dan galeri oval bernuansa pastel.',
		load: () => import('../themes/seruni/SeruniTheme.svelte')
	},
	{
		key: 'arsir',
		name: 'Arsir',
		description:
			'Gaya industrial hitam dan krem, aksen kuning, tipografi tegas, dan galeri monokrom.',
		load: () => import('../themes/arsir/ArsirTheme.svelte')
	},
	{
		key: 'kusuma',
		name: 'Kusuma',
		description:
			'Sage dan pink pastel, panel transparan, foto bulat, dan kelopak yang bergerak lembut.',
		load: () => import('../themes/kusuma/KusumaTheme.svelte')
	},
	{
		key: 'aurelia',
		name: 'Aurelia',
		description: 'Champagne dan emas, sampul oval, kartu organik, dan transisi yang lembut.',
		load: () => import('../themes/aurelia/AureliaTheme.svelte')
	},
	{
		key: 'arunika',
		name: 'Arunika',
		description: 'Beige lembut, foto lengkung, kaligrafi, dan cerita dalam kartu foto.',
		load: () => import('../themes/arunika/ArunikaTheme.svelte')
	},
	{
		key: 'zamrud',
		name: 'Zamrud',
		description: 'Hijau zamrud gelap, bingkai emas, medali foto, dan cahaya yang lembut.',
		load: () => import('../themes/zamrud/ZamrudTheme.svelte')
	},
	{
		key: 'cendana',
		name: 'Cendana',
		description: 'Krem dan terakota, sampul gerbang, kartu miring, dan timeline organik.',
		load: () => import('../themes/cendana/CendanaTheme.svelte')
	},
	{
		key: 'lentera',
		name: 'Lentera',
		description: 'Lembaran perkamen, bingkai oval, hijau tua, dan kisah bergaya scrapbook.',
		load: () => import('../themes/lentera/LenteraTheme.svelte')
	},
	{
		key: 'safira',
		name: 'Safira',
		description: 'Biru kabut dan navy, potret besar, kaligrafi, dan kartu tanggal editorial.',
		load: () => import('../themes/safira/SafiraTheme.svelte')
	},
	{
		key: 'renjana',
		name: 'Renjana',
		description: 'Layout ramping biru-abu, foto lengkung, dan transisi yang tenang.',
		load: () => import('../themes/renjana/RenjanaTheme.svelte')
	},
	{
		key: 'monokrom',
		name: 'Monokrom',
		description: 'Hitam dan putih, layout ramping, potret lengkung, dan detail minimal.',
		load: () => import('../themes/monokrom/MonokromTheme.svelte')
	},
	{
		key: 'swarna',
		name: 'Swarna',
		description: 'Hitam dan emas, potret lengkung, detail sudut, dan komposisi yang intim.',
		load: () => import('../themes/swarna/SwarnaTheme.svelte')
	},
	{
		key: 'sonata',
		name: 'Sonata',
		description: 'Album vinil, tipografi tegas, dan aksen jingga.',
		load: () => import('../themes/sonata/SonataTheme.svelte')
	},
	{
		key: 'jelajah',
		name: 'Jelajah',
		description: 'Tiket perjalanan dengan biru navy dan detail airmail.',
		load: () => import('../themes/jelajah/JelajahTheme.svelte')
	},
	{
		key: 'folio',
		name: 'Folio',
		description: 'Editorial hitam putih dengan tipografi kontras.',
		load: () => import('../themes/folio/FolioTheme.svelte')
	},
	{
		key: 'pusaka',
		name: 'Pusaka',
		description: 'Galeri klasik dengan bingkai antik dan kuningan.',
		load: () => import('../themes/pusaka/PusakaTheme.svelte')
	},
	{
		key: 'sinema',
		name: 'Sinema',
		description: 'Nuansa sinematik dengan bingkai film dan aksen merah.',
		load: () => import('../themes/sinema/SinemaTheme.svelte')
	},
	{
		key: 'adikara',
		name: 'Adikara',
		description: 'Undangan kerajaan burgundy dengan segel emas.',
		load: () => import('../themes/adikara/AdikaraTheme.svelte')
	},
	{
		key: 'komika',
		name: 'Komika',
		description: 'Panel komik, halftone, dan warna pop yang ekspresif.',
		load: () => import('../themes/komika/KomikaTheme.svelte')
	},
	{
		key: 'warta',
		name: 'Warta',
		description: 'Surat kabar klasik, tekstur perkamen, dan foto sepia.',
		load: () => import('../themes/warta/WartaTheme.svelte')
	},
	{
		key: 'retro',
		name: 'Retro',
		description: 'Polaroid retro, merah diner, dan pola kotak klasik.',
		load: () => import('../themes/retro/RetroTheme.svelte')
	},
	{
		key: 'kristal',
		name: 'Kristal',
		description: 'Bingkai kristal, lapisan kaca, dan kilau lembut.',
		load: () => import('../themes/kristal/KristalTheme.svelte')
	},
	{
		key: 'amerta',
		name: 'Amerta',
		description: 'Potret sinematik hangat, detail tipis, dan cerita dalam album.',
		load: () => import('../themes/amerta/AmertaTheme.svelte')
	},
	{
		key: 'niskala',
		name: 'Niskala',
		description: 'Editorial gelap dengan potret penuh dan tipografi romantis.',
		load: () => import('../themes/niskala/NiskalaTheme.svelte')
	},
	{
		key: 'sakura',
		name: 'Sakura',
		description: 'Lanskap cat air, bunga sakura, dan warna merah muda lembut.',
		load: () => import('../themes/sakura/SakuraTheme.svelte')
	},
	{
		key: 'lazuardi',
		name: 'Lazuardi',
		description: 'Ilustrasi taman biru, lampu hangat, dan bingkai lengkung.',
		load: () => import('../themes/lazuardi/LazuardiTheme.svelte')
	},
	{
		key: 'melati',
		name: 'Floral Melati',
		description: 'Bunga putih dan sage dengan bingkai lengkung yang hangat.',
		load: () => import('../themes/floral/MelatiTheme.svelte')
	},
	{
		key: 'eukaliptus',
		name: 'Floral Eukaliptus',
		description: 'Eukaliptus biru, bingkai heksagonal, dan aksen emas tipis.',
		load: () => import('../themes/floral/EukaliptusTheme.svelte')
	},
	{
		key: 'jingga',
		name: 'Floral Jingga',
		description: 'Bunga peach, potret oval, dan lengkung aprikot yang lembut.',
		load: () => import('../themes/floral/JinggaTheme.svelte')
	},
	{
		key: 'peony',
		name: 'Floral Peony',
		description: 'Peony merah muda, nuansa mauve, dan bingkai berlekuk.',
		load: () => import('../themes/floral/PeonyTheme.svelte')
	},
	{
		key: 'gardenia',
		name: 'Floral Gardenia',
		description: 'Mawar ivory, bingkai geometris berlapis, dan potret berselang.',
		load: () => import('../themes/floral/GardeniaTheme.svelte')
	},
	{
		key: 'aster',
		name: 'Floral Aster',
		description: 'Dedaunan rustic, bunga kapas, dan tekstur linen bernuansa hangat.',
		load: () => import('../themes/floral/AsterTheme.svelte')
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
