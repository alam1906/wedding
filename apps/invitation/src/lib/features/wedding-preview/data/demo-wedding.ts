import { DEMO_WEDDING_SLUG } from '#lib/features/guests/model/demo-rsvp.js';
import type { WeddingThemeKey } from '#lib/features/wedding-themes/model/wedding-theme.js';
import type { WeddingData } from '#lib/features/weddings/model/wedding.js';

const asset = (name: string) => `/images/demo/${name}.jpg`;

// One fictional dataset for every theme, independent of customer records.
const demoWedding: WeddingData = {
	id: 'theme-preview',
	slug: DEMO_WEDDING_SLUG,
	theme: 'nocturne',
	plan_tier: 'pro',
	gift_enabled: true,
	groom_gift_hidden: false,
	bride_gift_hidden: false,
	groom_name: 'Raka',
	groom_father_name: 'Budi Santoso',
	groom_mother_name: 'Ratna Sari',
	groom_photo: 'raka-laras-hero.jpg',
	groom_photo_url: asset('raka-laras-hero'),
	groom_payment_number: '0000000000',
	groom_payment_provider: 'Bank Contoh',
	groom_payment_account_name: 'Raka (Demo)',
	bride_name: 'Laras',
	bride_father_name: 'Hendra Wijaya',
	bride_mother_name: 'Dewi Lestari',
	bride_photo: 'raka-laras-hero.jpg',
	bride_photo_url: asset('raka-laras-hero'),
	bride_payment_number: '0000000000',
	bride_payment_provider: 'Bank Contoh',
	bride_payment_account_name: 'Laras (Demo)',
	cover: 'raka-laras-hero.jpg',
	cover_url: asset('raka-laras-hero'),
	quote:
		'Dan di antara tanda-tanda (kebesaran)-Nya ialah Dia menciptakan pasangan-pasangan untukmu dari jenismu sendiri, agar kamu cenderung dan merasa tenteram kepadanya, dan Dia menjadikan di antaramu rasa kasih dan sayang. Sungguh, pada yang demikian itu benar-benar terdapat tanda-tanda (kebesaran Allah) bagi kaum yang berpikir.',
	address: 'Gedung Taman Laras, Bandung, Jawa Barat (lokasi contoh)',
	maps: 'https://www.google.com/maps/search/?api=1&query=Bandung%2C%20Jawa%20Barat',
	separate_events: false,
	reception_address: '',
	reception_maps: '',
	akad: '2027-12-12T08:00:00+07:00',
	reception: '2027-12-12T11:00:00+07:00',
	// No licensed demo audio is bundled yet; keep the existing optional music behavior.
	music: '',
	music_title: '',
	music_url: '',
	gallery: [
		{ name: 'Raka dan Laras', url: asset('raka-laras-hero') },
		{ name: 'Tempat perayaan', url: asset('glasshouse-venue') },
		{ name: 'Cincin pernikahan', url: asset('wedding-rings') },
		{ name: 'Buket bunga', url: asset('coral-bouquet') }
	],
	stories: [
		{
			id: 'demo-story-1',
			title: 'Pertama Bertemu',
			date: '2022-06-18T12:00:00+07:00',
			content:
				'Kami bertemu melalui sahabat yang sama. Percakapan sederhana hari itu menjadi awal dari banyak cerita yang kami bagi bersama.',
			image: 'raka-laras-hero.jpg',
			image_url: asset('raka-laras-hero'),
			sort_order: 1
		},
		{
			id: 'demo-story-2',
			title: 'Tumbuh Bersama',
			date: '2024-08-24T12:00:00+07:00',
			content:
				'Seiring waktu, kami belajar saling mendengarkan dan mendukung. Dalam perjalanan kecil maupun rencana besar, kami menemukan rumah pada satu sama lain.',
			image: 'coral-bouquet.jpg',
			image_url: asset('coral-bouquet'),
			sort_order: 2
		},
		{
			id: 'demo-story-3',
			title: 'Melangkah Bersama',
			date: '2026-07-12T12:00:00+07:00',
			content:
				'Di hadapan keluarga, kami memutuskan untuk melanjutkan perjalanan ini bersama. Dengan doa dan restu mereka, kami bersiap menyambut hari pernikahan.',
			image: 'wedding-rings.jpg',
			image_url: asset('wedding-rings'),
			sort_order: 3
		}
	]
};

export function createDemoWedding(theme: WeddingThemeKey): WeddingData {
	return { ...structuredClone(demoWedding), theme };
}
