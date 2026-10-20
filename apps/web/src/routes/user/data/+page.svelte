<script lang="ts">
	import { pushState } from '$app/navigation';
	import { page } from '$app/state';
	import { error } from '@sveltejs/kit';
	import { onDestroy, untrack } from 'svelte';
	import DataSectionSkeleton from '#lib/components/ui/DataSectionSkeleton.svelte';

	import {
		MusicDataError,
		requestMusicOptions,
		type MusicOption
	} from '#lib/features/musics/index.js';
	import {
		createWeddingDraft,
		getWeddingSection,
		saveCurrentWeddingStories,
		updateCurrentWedding
	} from '#lib/features/weddings/api/wedding.js';
	import { getWeddingSummary } from '#lib/features/weddings/api/summary.js';
	import CouplePhotoPicker from '#lib/features/weddings/components/CouplePhotoPicker.svelte';
	import WeddingEventForm from '#lib/features/weddings/components/WeddingEventForm.svelte';
	import {
		getWeddingInvitationBaseHost,
		getWeddingInvitationHost,
		WeddingDataError,
		type WeddingData,
		type WeddingSingleFileField,
		type WeddingStoryItem
	} from '#lib/features/weddings/index.js';
	import {
		ImageOptimizationError,
		OPTIMIZABLE_IMAGE_ACCEPT,
		optimizeImage,
		type ImageOptimizationOptions
	} from '#lib/shared/image/optimize-image.js';
	import { getToastContext } from '#lib/features/toast/index.js';
	import {
		THEME_CATEGORIES,
		WEDDING_THEME_CATALOG,
		type ThemeCategory
	} from '#lib/features/wedding-themes/model/theme-catalog.js';
	import { SvelteSet } from 'svelte/reactivity';

	const sections = [
		{ title: 'Domain', description: 'Atur subdomain unik undangan pernikahanmu.' },
		{ title: 'Mempelai', description: 'Lengkapi informasi dan foto kedua mempelai.' },
		{ title: 'Acara', description: 'Atur waktu dan alamat rangkaian acara.' },
		{ title: 'Media', description: 'Kelola cover dan galeri undangan.' },
		{ title: 'Story', description: 'Ceritakan perjalanan hubungan kalian.' },
		{ title: 'Quote', description: 'Tambahkan kutipan yang bermakna.' },
		{ title: 'Kado', description: 'Atur bank atau e-wallet kedua mempelai.' },
		{ title: 'Musik', description: 'Pilih musik pengiring untuk undangan pernikahanmu.' },
		{ title: 'Tema', description: 'Pilih tampilan visual untuk undangan pernikahanmu.' }
	] as const;
	const bankOptions = [
		'Bank Central Asia (BCA)',
		'Bank Mandiri',
		'Bank Negara Indonesia (BNI)',
		'Bank Rakyat Indonesia (BRI)',
		'Bank Tabungan Negara (BTN)',
		'CIMB Niaga',
		'Bank Permata',
		'Bank Danamon',
		'Bank Panin',
		'Maybank Indonesia',
		'Bank Mega',
		'OCBC NISP',
		'Bank Sinarmas',
		'UOB Indonesia',
		'Bank BTPN',
		'Bank Syariah Indonesia (BSI)',
		'Bank Muamalat',
		'Bank Jago'
	];
	const eWalletOptions = ['GoPay', 'DANA', 'OVO', 'ShopeePay', 'LinkAja'];
	function isListedPaymentProvider(provider: string): boolean {
		return [...bankOptions, ...eWalletOptions].includes(provider);
	}
	const singleImageFields = [
		'groom_photo',
		'bride_photo',
		'cover'
	] as const satisfies readonly WeddingSingleFileField[];
	const imageOptimizationPresets = {
		groom_photo: { maxHeight: 1200, maxWidth: 1200, quality: 0.82 },
		bride_photo: { maxHeight: 1200, maxWidth: 1200, quality: 0.82 },
		cover: { maxHeight: 1920, maxWidth: 1920, quality: 0.84 },
		gallery: { maxHeight: 1600, maxWidth: 1600, quality: 0.82 },
		story: { maxHeight: 1600, maxWidth: 1600, quality: 0.82 }
	} as const satisfies Record<
		WeddingSingleFileField | 'gallery' | 'story',
		ImageOptimizationOptions
	>;

	const themes = [
		{
			key: 'neubrutalism-1',
			name: 'Neobrutalism Romantic',
			description: 'Coral dan kuning hangat dengan hard shadow.'
		},
		{
			key: 'neubrutalism-2',
			name: 'Neobrutalism Elegant',
			description: 'Ungu formal dan pink dalam komposisi grafis berkelas.'
		},
		{
			key: 'neubrutalism-3',
			name: 'Neobrutalism Fresh',
			description: 'Toska dan orange segar dengan kontras tinggi.'
		},
		{
			key: 'playful-1',
			name: 'Playful Romantic',
			description: 'Pink romantis dan kuning hangat dengan bentuk organik.'
		},
		{
			key: 'playful-2',
			name: 'Playful Elegant',
			description: 'Lavender elegan dan cyan dalam suasana dreamy.'
		},
		{
			key: 'playful-3',
			name: 'Playful Fresh',
			description: 'Hijau mint dan coral dengan suasana segar yang ceria.'
		},
		{
			key: '3d-design-1',
			name: '3D Romantic',
			description: 'Pink hangat dan orange lembut dengan kedalaman tiga dimensi.'
		},
		{
			key: '3d-design-2',
			name: '3D Elegant',
			description: 'Ungu gelap dan biru bercahaya dalam komposisi mewah.'
		},
		{
			key: '3d-design-3',
			name: '3D Fresh',
			description: 'Biru cerah dan mint dengan kedalaman modern yang ringan.'
		},
		{
			key: 'nocturne',
			name: 'Nocturne',
			description: 'Romansa malam sinematik dengan cahaya emas dan animasi lembut.'
		},
		{
			key: 'kinetika',
			name: 'Buku Kita',
			description: 'Sampul buku yang terbuka dan halaman undangan yang dapat dibalik.'
		},
		{
			key: 'anomali',
			name: 'Anomali',
			description: 'Editorial ivory dan hijau dengan reveal sinematik serta animasi halus berlapis.'
		},
		{
			key: 'selaras',
			name: 'Selaras',
			description:
				'Stacked cards pada cerita dan galeri horizontal dalam nuansa ivory dan burgundy.'
		},
		{
			key: 'pramesti',
			name: 'Pramesti',
			description: 'Ivory dan emas dengan tipografi serif, galeri, dan timeline cerita yang elegan.'
		},
		{
			key: 'seruni',
			name: 'Seruni',
			description: 'Foto layar penuh, kaligrafi, cerita polaroid, dan galeri oval bernuansa pastel.'
		},
		{
			key: 'arsir',
			name: 'Arsir',
			description:
				'Gaya industrial hitam dan krem, aksen kuning, tipografi tegas, dan galeri monokrom.'
		},
		{
			key: 'kusuma',
			name: 'Kusuma',
			description:
				'Sage dan pink pastel, panel transparan, foto bulat, dan kelopak yang bergerak lembut.'
		},
		{
			key: 'aurelia',
			name: 'Aurelia',
			description: 'Champagne dan emas, sampul oval, kartu organik, dan transisi yang lembut.'
		},
		{
			key: 'arunika',
			name: 'Arunika',
			description: 'Beige lembut, foto lengkung, kaligrafi, dan cerita dalam kartu foto.'
		},
		{
			key: 'zamrud',
			name: 'Zamrud',
			description: 'Hijau zamrud gelap, bingkai emas, medali foto, dan cahaya yang lembut.'
		},
		{
			key: 'cendana',
			name: 'Cendana',
			description: 'Krem dan terakota, sampul gerbang, kartu miring, dan timeline organik.'
		},
		{
			key: 'lentera',
			name: 'Lentera',
			description: 'Lembaran perkamen, bingkai oval, hijau tua, dan kisah bergaya scrapbook.'
		},
		{
			key: 'safira',
			name: 'Safira',
			description: 'Biru kabut dan navy, potret besar, kaligrafi, dan kartu tanggal editorial.'
		},
		{
			key: 'renjana',
			name: 'Renjana',
			description: 'Layout ramping biru-abu, foto lengkung, dan transisi yang tenang.'
		},
		{
			key: 'monokrom',
			name: 'Monokrom',
			description: 'Hitam dan putih, layout ramping, potret lengkung, dan detail minimal.'
		},
		{
			key: 'swarna',
			name: 'Swarna',
			description: 'Hitam dan emas, potret lengkung, detail sudut, dan komposisi yang intim.'
		},
		{
			key: 'sonata',
			name: 'Sonata',
			description: 'Album vinil, tipografi tegas, dan aksen jingga.'
		},
		{
			key: 'jelajah',
			name: 'Jelajah',
			description: 'Tiket perjalanan dengan biru navy dan detail airmail.'
		},
		{
			key: 'folio',
			name: 'Folio',
			description: 'Editorial hitam putih dengan tipografi kontras.'
		},
		{
			key: 'pusaka',
			name: 'Pusaka',
			description: 'Galeri klasik dengan bingkai antik dan kuningan.'
		},
		{
			key: 'sinema',
			name: 'Sinema',
			description: 'Nuansa sinematik dengan bingkai film dan aksen merah.'
		},
		{
			key: 'adikara',
			name: 'Adikara',
			description: 'Undangan kerajaan burgundy dengan segel emas.'
		},
		{
			key: 'komika',
			name: 'Komika',
			description: 'Panel komik, halftone, dan warna pop yang ekspresif.'
		},
		{
			key: 'warta',
			name: 'Warta',
			description: 'Surat kabar klasik, tekstur perkamen, dan foto sepia.'
		},
		{
			key: 'retro',
			name: 'Retro',
			description: 'Polaroid retro, merah diner, dan pola kotak klasik.'
		},
		{
			key: 'kristal',
			name: 'Kristal',
			description: 'Bingkai kristal, lapisan kaca, dan kilau lembut.'
		},
		{
			key: 'amerta',
			name: 'Amerta',
			description: 'Potret sinematik hangat, detail tipis, dan cerita dalam album.'
		},
		{
			key: 'niskala',
			name: 'Niskala',
			description: 'Editorial gelap dengan potret penuh dan tipografi romantis.'
		},
		{
			key: 'sakura',
			name: 'Sakura',
			description: 'Lanskap cat air, bunga sakura, dan warna merah muda lembut.'
		},
		{
			key: 'lazuardi',
			name: 'Lazuardi',
			description: 'Ilustrasi taman biru, lampu hangat, dan bingkai lengkung.'
		},
		{
			key: 'melati',
			name: 'Floral Melati',
			description: 'Bunga putih dan sage dengan bingkai lengkung yang hangat.'
		},
		{
			key: 'eukaliptus',
			name: 'Floral Eukaliptus',
			description: 'Eukaliptus biru, bingkai heksagonal, dan aksen emas tipis.'
		},
		{
			key: 'jingga',
			name: 'Floral Jingga',
			description: 'Bunga peach, potret oval, dan lengkung aprikot yang lembut.'
		},
		{
			key: 'peony',
			name: 'Floral Peony',
			description: 'Peony merah muda, nuansa mauve, dan bingkai berlekuk.'
		},
		{
			key: 'gardenia',
			name: 'Floral Gardenia',
			description: 'Mawar ivory, bingkai geometris berlapis, dan potret berselang.'
		},
		{
			key: 'aster',
			name: 'Floral Aster',
			description: 'Dedaunan rustic, bunga kapas, dan tekstur linen bernuansa hangat.'
		},
		{
			key: 'minimalist-1',
			name: 'minimalist-1',
			description: 'Foto bersudut potong, nuansa biru lembut, dan tipografi kaligrafi.'
		},
		{
			key: 'minimalist-2',
			name: 'minimalist-2',
			description: 'Kertas ivory, dedaunan monstera, dan tipografi serif hijau sage.'
		},
		{
			key: 'minimalist-3',
			name: 'minimalist-3',
			description: 'Komposisi editorial putih, huruf tegas, dan aksen aprikot.'
		},
		{
			key: 'minimalist-4',
			name: 'minimalist-4',
			description: 'Bingkai lengkung asimetris, serif klasik, dan susunan tanggal vertikal.'
		},
		{
			key: 'minimalist-5',
			name: 'minimalist-5',
			description: 'Fotografi monokrom gelap, tipografi ringan, dan garis minimal.'
		},
		{
			key: 'minimalist-6',
			name: 'minimalist-6',
			description: 'Sampul foto hangat dengan potret besar yang disusun berselang.'
		},
		{
			key: 'minimalist-7',
			name: 'minimalist-7',
			description: 'Judul vertikal, foto asimetris, dan bidang hitam putih.'
		},
		{
			key: 'sumatera-utara',
			name: 'Sumatera Utara',
			description: 'Rumah Bolon, tenun ulos, dan nuansa merah marun dengan aksen emas.'
		},
		{
			key: 'sulawesi-selatan',
			name: 'Sulawesi Selatan',
			description: 'Rumah panggung Bugis, bingkai oval, dan warna hijau zamrud.'
		},
		{
			key: 'sumatera-barat',
			name: 'Sumatera Barat',
			description: 'Rumah Gadang dan bingkai lengkung dalam nuansa burgundy dan emas.'
		},
		{
			key: 'jakarta',
			name: 'Jakarta',
			description: 'Monas, ukiran klasik, dan palet terakota yang hangat.'
		},
		{
			key: 'jawa-barat',
			name: 'Jawa Barat',
			description: 'Rumah Julang Ngapak dan lanskap hijau dengan bingkai gading.'
		},
		{
			key: 'jawa-tengah',
			name: 'Jawa Tengah',
			description: 'Gunungan wayang, lanskap sepia, dan bingkai emas klasik.'
		},
		{
			key: 'jawa-timur',
			name: 'Jawa Timur',
			description: 'Foto penuh dengan gunungan di sisi dan nuansa merah marun.'
		},
		{
			key: 'bali',
			name: 'Bali',
			description: 'Meru, penjor, dan bingkai emas dalam nuansa biru porselen.'
		},
		{
			key: 'sunda',
			name: 'Sunda',
			description: 'Rumah Sunda, bingkai perak, dan gradasi biru dengan aksen merah muda.'
		},
		{
			key: 'dayak',
			name: 'Dayak',
			description: 'Talawang berornamen, potret oval, dan merah anggur dengan emas.'
		},
		{
			key: 'banjar',
			name: 'Banjar',
			description: 'Rumah Bubungan Tinggi, tekstur hangat, dan warna emas kecokelatan.'
		},
		{
			key: 'overlay-shadow-1',
			name: 'Overlay Shadow 1',
			description: 'Foto tetap, panel kertas berbayang, dan warna zaitun yang hangat.'
		},
		{
			key: 'overlay-shadow-2',
			name: 'Overlay Shadow 2',
			description: 'Album foto dengan bingkai kertas, jepitan, dan bidang warna oker.'
		},
		{
			key: 'overlay-shadow-3',
			name: 'Overlay Shadow 3',
			description: 'Bayangan daun palem, tepi kertas, dan warna terakota.'
		},
		{
			key: 'post-wedding-1',
			name: 'Post Wedding 1',
			description: 'Foto panorama, tipografi serif berjarak, dan bunga kering bernuansa hangat.'
		},
		{
			key: 'wedding-anniversary-1',
			name: 'Wedding Anniversary 1',
			description: 'Foto abu-abu lembut, potret melingkar, dan aksen bunga peach.'
		},
		{
			key: 'islamic-1',
			name: 'Islamic 1',
			description: 'Lentera emas, siluet kubah, dan bidang putih yang lapang.'
		},
		{
			key: 'islamic-2',
			name: 'Islamic 2',
			description: 'Geometri Islami, lengkung mihrab, dan warna hijau zamrud.'
		},
		{
			key: 'luxury-2',
			name: 'Luxury 2',
			description: 'Komposisi editorial krem, potret oval, dan aksen terakota.'
		},
		{
			key: 'luxury-1',
			name: 'Luxury 1',
			description: 'Garis emas mengalir, foto biru malam, dan potret lengkung klasik.'
		},
		{
			key: 'wedding-shower-1',
			name: 'Wedding Shower 1',
			description: 'Foto penuh, serif elegan, dan nuansa rose-beige yang lembut.'
		},
		{
			key: 'bachelorette-1',
			name: 'Bachelorette 1',
			description: 'Foto editorial, serif italic, dan perpaduan koral dengan hijau zaitun.'
		},
		{
			key: 'rehearsal-dinner-1',
			name: 'Rehearsal Dinner 1',
			description: 'Foto besar, tipografi serif italic, dan nuansa sage yang tenang.'
		}
	] as const;

	type ThemeKey = (typeof themes)[number]['key'];
	const reversedThemes = [...themes].reverse();
	const themeCategoryByKey = Object.fromEntries(
		WEDDING_THEME_CATALOG.map(({ key, category }) => [key, category])
	);
	let selectedThemeCategory = $state<ThemeCategory>('all');
	const filteredThemes = $derived(
		reversedThemes.filter(
			(theme) =>
				selectedThemeCategory === 'all' || themeCategoryByKey[theme.key] === selectedThemeCategory
		)
	);
	const quoteOptions = [
		{
			key: 'quote-1',
			label: 'Quote 1',
			reference: 'Ar-Rum: 21',
			text: 'Dan di antara tanda-tanda (kebesaran)-Nya ialah Dia menciptakan pasangan-pasangan untukmu dari jenismu sendiri, agar kamu cenderung dan merasa tenteram kepadanya, dan Dia menjadikan di antaramu rasa kasih dan sayang. Sungguh, pada yang demikian itu benar-benar terdapat tanda-tanda (kebesaran Allah) bagi kaum yang berpikir.'
		},
		{
			key: 'quote-2',
			label: 'Quote 2',
			reference: 'An-Nisa: 1',
			text: 'Wahai manusia! Bertakwalah kepada Tuhanmu yang telah menciptakan kamu dari diri yang satu (Adam), dan (Allah) menciptakan pasangannya (Hawa) dari (diri)-nya; dan dari keduanya Allah memperkembangbiakkan laki-laki dan perempuan yang banyak. Bertakwalah kepada Allah yang dengan nama-Nya kamu saling meminta, dan (peliharalah) hubungan kekeluargaan. Sesungguhnya Allah selalu menjaga dan mengawasimu.'
		},
		{
			key: 'quote-3',
			label: 'Quote 3',
			reference: 'An-Nahl: 72',
			text: 'Dan Allah menjadikan bagimu pasangan (suami atau istri) dari jenis kamu sendiri dan menjadikan anak dan cucu bagimu dari pasanganmu, serta memberimu rezeki dari yang baik. Mengapa mereka beriman kepada yang batil dan mengingkari nikmat Allah?'
		}
	] as const;
	type QuotePreset = (typeof quoteOptions)[number]['key'] | 'custom';

	function getQuotePreset(value: string): QuotePreset {
		return quoteOptions.find((option) => option.text === value)?.key ?? 'custom';
	}

	function normalizeTheme(value: string): ThemeKey {
		const legacyThemes: Record<string, ThemeKey> = {
			brutalism: 'neubrutalism-1',
			playful: 'playful-1'
		};
		const normalizedValue = legacyThemes[value] ?? value;

		return themes.some((theme) => theme.key === normalizedValue)
			? (normalizedValue as ThemeKey)
			: 'nocturne';
	}

	type SectionName = (typeof sections)[number]['title'];
	type DataPageState = App.PageState & {
		dataSection?: unknown;
	};
	type LocalGalleryPreview = {
		file: File;
		id: string;
		markedForRemoval: boolean;
		name: string;
		url: string;
	};
	type EditableWeddingStory = WeddingStoryItem & {
		imageFile?: File;
		localImagePreview: string;
		removeImage: boolean;
	};

	const toast = getToastContext();
	let musicOptions = $state<{
		options: MusicOption[];
		error: string;
		status: 'idle' | 'loading' | 'ready' | 'error';
	}>({ options: [], error: '', status: 'idle' });
	let summary = $state.raw(await getInitialSummary());
	const initialWedding = untrack(() => createWeddingDraft(summary.id));
	const initialQuotePreset = getQuotePreset(initialWedding.quote);
	let wedding = $state<WeddingData>({ ...initialWedding });
	let stories = $state<EditableWeddingStory[]>(toEditableStories(initialWedding.stories));
	let selectedTheme = $state<ThemeKey>(normalizeTheme(initialWedding.theme));
	let selectedThemeName = $derived(themes.find((theme) => theme.key === selectedTheme)?.name ?? '');
	let themeHasChanges = $derived(selectedTheme !== normalizeTheme(wedding.theme));
	let selectedMusic = $state(initialWedding.music);
	let musicEnabled = $state(initialWedding.music !== '');
	let giftEnabled = $state(initialWedding.gift_enabled);
	let groomGiftHidden = $state(initialWedding.groom_gift_hidden);
	let brideGiftHidden = $state(initialWedding.bride_gift_hidden);
	let lastSelectedMusic = initialWedding.music;
	let selectedQuotePreset = $state<QuotePreset>(initialQuotePreset);
	let customQuote = $state(initialQuotePreset === 'custom' ? initialWedding.quote : '');
	let selectedQuote = $derived(
		selectedQuotePreset === 'custom'
			? customQuote
			: (quoteOptions.find((option) => option.key === selectedQuotePreset)?.text ?? '')
	);
	let activeSection = $derived(getActiveSection(page.state));
	let loadedSection = $state<SectionName | null>(null);
	let sectionError = $state('');
	let sectionLoadAttempt = $state(0);
	let sectionGeneration = 0;
	let isSaving = $state(false);
	let localSingleImagePreviews = $state<Partial<Record<WeddingSingleFileField, string>>>({});
	let localSingleImageFiles = $state<Partial<Record<WeddingSingleFileField, File>>>({});
	let localGalleryPreviews = $state<LocalGalleryPreview[]>([]);
	let galleryInput = $state<HTMLInputElement>();
	let imageOptimizationsInProgress = $state(0);
	let pendingSingleFileDeletions = $state<WeddingSingleFileField[]>([]);
	let pendingGalleryDeletions = $state<string[]>([]);
	let imageOptimizationGeneration = 0;
	let nextImageOptimizationToken = 0;
	const activeImageOptimizationTokens = new SvelteSet<number>();
	const inputImageOptimizationTokens = new WeakMap<HTMLInputElement, number>();
	let activeSectionData = $derived(sections.find((section) => section.title === activeSection));
	let isOptimizingImages = $derived(imageOptimizationsInProgress > 0);
	let groomPhotoPreview = $derived(
		localSingleImagePreviews.groom_photo ??
			(pendingSingleFileDeletions.includes('groom_photo') ? '' : wedding.groom_photo_url)
	);
	let bridePhotoPreview = $derived(
		localSingleImagePreviews.bride_photo ??
			(pendingSingleFileDeletions.includes('bride_photo') ? '' : wedding.bride_photo_url)
	);
	let coverPreview = $derived(
		localSingleImagePreviews.cover ??
			(pendingSingleFileDeletions.includes('cover') ? '' : wedding.cover_url)
	);
	const invitationBaseHost = getWeddingInvitationBaseHost();
	let invitationHostPreview = $derived(getWeddingInvitationHost(wedding.slug || 'namamempelai'));

	async function getInitialSummary() {
		try {
			return await getWeddingSummary();
		} catch (cause) {
			throw error(500, {
				message: cause instanceof WeddingDataError ? cause.message : 'Data wedding gagal dimuat.'
			});
		}
	}

	$effect(() => {
		const section = activeSection;
		void sectionLoadAttempt;
		sectionGeneration += 1;
		let current = true;
		untrack(() => {
			resetActiveSectionChanges();
			refreshLocalData(createWeddingDraft(summary.id));
			lastSelectedMusic = '';
			loadedSection = null;
			sectionError = '';
			musicOptions = { options: [], error: '', status: section === 'Musik' ? 'loading' : 'idle' };
		});
		if (section !== null) {
			void getWeddingSection(section)
				.then((data) => {
					if (!current) return;
					refreshLocalData(data);
					loadedSection = section;
				})
				.catch((cause) => {
					if (current)
						sectionError = cause instanceof WeddingDataError ? cause.message : 'Data gagal dimuat.';
				});
		}
		if (section === 'Musik') {
			void requestMusicOptions()
				.then((options) => {
					if (current) musicOptions = { options, error: '', status: 'ready' };
				})
				.catch((cause) => {
					if (current)
						musicOptions = {
							options: [],
							status: 'error',
							error: cause instanceof MusicDataError ? cause.message : 'Daftar musik gagal dimuat.'
						};
				});
		}
		return () => {
			current = false;
		};
	});

	function getActiveSection(state: App.PageState): SectionName | null {
		const section = (state as DataPageState).dataSection;

		return sections.some((item) => item.title === section) ? (section as SectionName) : null;
	}

	function openSection(section: SectionName) {
		pushState('', { ...page.state, dataSection: section });
		window.scrollTo({ top: 0, behavior: 'instant' });
	}

	function isSectionComplete(section: SectionName): boolean {
		return summary.sections[section];
	}

	function refreshLocalData(updatedWedding: WeddingData) {
		clearStoryImagePreviews();
		wedding = updatedWedding;
		stories = toEditableStories(updatedWedding.stories);
		selectedTheme = normalizeTheme(updatedWedding.theme);
		selectedMusic = updatedWedding.music;
		musicEnabled = updatedWedding.music !== '';
		giftEnabled = updatedWedding.gift_enabled;
		groomGiftHidden = updatedWedding.groom_gift_hidden;
		brideGiftHidden = updatedWedding.bride_gift_hidden;
		selectedQuotePreset = getQuotePreset(updatedWedding.quote);
		customQuote = selectedQuotePreset === 'custom' ? updatedWedding.quote : '';
		if (updatedWedding.music) {
			lastSelectedMusic = updatedWedding.music;
		}
	}

	function revokePreview(url: string | undefined) {
		if (url) {
			URL.revokeObjectURL(url);
		}
	}

	type ImageOptimizationTask = {
		generation: number;
		token: number;
	};

	function beginImageOptimization(input: HTMLInputElement): ImageOptimizationTask {
		const previousToken = inputImageOptimizationTokens.get(input);
		if (previousToken !== undefined) {
			activeImageOptimizationTokens.delete(previousToken);
		}

		const token = ++nextImageOptimizationToken;
		activeImageOptimizationTokens.add(token);
		inputImageOptimizationTokens.set(input, token);
		imageOptimizationsInProgress = activeImageOptimizationTokens.size;

		return { generation: imageOptimizationGeneration, token };
	}

	function isCurrentImageOptimization(
		input: HTMLInputElement,
		task: ImageOptimizationTask
	): boolean {
		return (
			task.generation === imageOptimizationGeneration &&
			inputImageOptimizationTokens.get(input) === task.token
		);
	}

	function finishImageOptimization(input: HTMLInputElement, task: ImageOptimizationTask) {
		activeImageOptimizationTokens.delete(task.token);
		if (inputImageOptimizationTokens.get(input) === task.token) {
			inputImageOptimizationTokens.delete(input);
		}
		imageOptimizationsInProgress = activeImageOptimizationTokens.size;
	}

	function invalidateImageOptimizations() {
		imageOptimizationGeneration += 1;
		activeImageOptimizationTokens.clear();
		imageOptimizationsInProgress = 0;
	}

	function replaceInputFiles(input: HTMLInputElement, files: File[]) {
		const transfer = new DataTransfer();
		files.forEach((file) => transfer.items.add(file));
		input.files = transfer.files;
	}

	async function optimizeInputImages(
		input: HTMLInputElement,
		files: File[],
		options: ImageOptimizationOptions
	): Promise<File[] | null> {
		const task = beginImageOptimization(input);

		try {
			const optimizedFiles: File[] = [];
			for (const file of files) {
				optimizedFiles.push(await optimizeImage(file, options));
			}

			if (!isCurrentImageOptimization(input, task)) {
				return null;
			}

			replaceInputFiles(input, optimizedFiles);
			return optimizedFiles;
		} catch (error) {
			if (isCurrentImageOptimization(input, task)) {
				input.value = '';
				toast.error(
					error instanceof ImageOptimizationError ? error.message : 'Gambar gagal dioptimalkan.'
				);
			}

			return null;
		} finally {
			finishImageOptimization(input, task);
		}
	}

	function clearLocalImagePreviews() {
		invalidateImageOptimizations();
		Object.values(localSingleImagePreviews).forEach(revokePreview);
		localGalleryPreviews.forEach((preview) => URL.revokeObjectURL(preview.url));
		localSingleImagePreviews = {};
		localSingleImageFiles = {};
		localGalleryPreviews = [];

		if (galleryInput) {
			galleryInput.value = '';
		}
	}

	function toEditableStories(items: WeddingStoryItem[]): EditableWeddingStory[] {
		return items.map((story) => ({
			...story,
			date: story.date.slice(0, 10),
			localImagePreview: '',
			removeImage: false
		}));
	}

	function clearStoryImagePreviews() {
		stories.forEach((story) => revokePreview(story.localImagePreview));
	}

	function getStoryImagePreview(story: EditableWeddingStory): string {
		return story.localImagePreview || (story.removeImage ? '' : story.image_url);
	}

	async function previewStoryImage(event: Event, storyId: string) {
		if (!(event.currentTarget instanceof HTMLInputElement)) {
			return;
		}

		const input = event.currentTarget;
		const sourceFile = input.files?.[0];
		if (!sourceFile || !stories.some((item) => item.id === storyId)) {
			return;
		}
		const [file] =
			(await optimizeInputImages(input, [sourceFile], imageOptimizationPresets.story)) ?? [];
		const story = stories.find((item) => item.id === storyId);
		if (!story || !file) {
			return;
		}

		revokePreview(story.localImagePreview);
		story.imageFile = file;
		story.localImagePreview = URL.createObjectURL(file);
		story.removeImage = false;
		input.value = '';
	}

	function removeStoryImage(storyId: string) {
		const story = stories.find((item) => item.id === storyId);
		if (!story) {
			return;
		}

		revokePreview(story.localImagePreview);
		story.imageFile = undefined;
		story.localImagePreview = '';
		story.removeImage = true;
	}

	function clearPendingFileChanges() {
		clearLocalImagePreviews();
		pendingSingleFileDeletions = [];
		pendingGalleryDeletions = [];
	}

	function resetActiveSectionChanges() {
		clearPendingFileChanges();
		clearStoryImagePreviews();
		stories = toEditableStories(wedding.stories);
		selectedTheme = normalizeTheme(wedding.theme);
		selectedMusic = wedding.music;
		musicEnabled = wedding.music !== '';
		giftEnabled = wedding.gift_enabled;
		groomGiftHidden = wedding.groom_gift_hidden;
		brideGiftHidden = wedding.bride_gift_hidden;
		selectedQuotePreset = getQuotePreset(wedding.quote);
		customQuote = selectedQuotePreset === 'custom' ? wedding.quote : '';
		if (wedding.music) {
			lastSelectedMusic = wedding.music;
		}
	}

	function pauseAllMusicPreviews() {
		document.querySelectorAll<HTMLAudioElement>('[data-music-preview]').forEach((audio) => {
			audio.pause();
		});
	}

	function toggleMusic() {
		if (musicEnabled) {
			if (selectedMusic) {
				lastSelectedMusic = selectedMusic;
			}
			selectedMusic = '';
			musicEnabled = false;
			pauseAllMusicPreviews();
			return;
		}

		const nextMusic = lastSelectedMusic || musicOptions.options[0]?.id || '';
		if (!nextMusic) {
			return;
		}

		selectedMusic = nextMusic;
		lastSelectedMusic = nextMusic;
		musicEnabled = true;
	}

	function pauseOtherMusicPreviews(event: Event) {
		if (!(event.currentTarget instanceof HTMLAudioElement)) {
			return;
		}

		const currentAudio = event.currentTarget;
		document.querySelectorAll<HTMLAudioElement>('[data-music-preview]').forEach((audio) => {
			if (audio !== currentAudio) {
				audio.pause();
			}
		});
	}

	function closeActiveSection() {
		history.back();
	}

	async function previewSingleImage(event: Event, field: WeddingSingleFileField) {
		if (!(event.currentTarget instanceof HTMLInputElement)) {
			return;
		}

		const input = event.currentTarget;
		const sourceFile = input.files?.[0];
		if (!sourceFile) {
			revokePreview(localSingleImagePreviews[field]);
			localSingleImagePreviews = { ...localSingleImagePreviews, [field]: undefined };
			localSingleImageFiles = { ...localSingleImageFiles, [field]: undefined };
			return;
		}
		const [file] =
			(await optimizeInputImages(input, [sourceFile], imageOptimizationPresets[field])) ?? [];
		if (!file) {
			return;
		}

		revokePreview(localSingleImagePreviews[field]);
		localSingleImagePreviews = {
			...localSingleImagePreviews,
			[field]: URL.createObjectURL(file)
		};
		localSingleImageFiles = { ...localSingleImageFiles, [field]: file };
		pendingSingleFileDeletions = pendingSingleFileDeletions.filter(
			(pendingField) => pendingField !== field
		);
	}

	async function previewGallery(event: Event) {
		if (!(event.currentTarget instanceof HTMLInputElement)) {
			return;
		}

		const input = event.currentTarget;
		const sourceFiles = Array.from(input.files ?? []);
		if (sourceFiles.length === 0) {
			localGalleryPreviews.forEach((preview) => URL.revokeObjectURL(preview.url));
			localGalleryPreviews = [];
			return;
		}
		const files = await optimizeInputImages(input, sourceFiles, imageOptimizationPresets.gallery);
		if (!files) {
			return;
		}

		localGalleryPreviews.forEach((preview) => URL.revokeObjectURL(preview.url));
		localGalleryPreviews = files.map((file) => ({
			file,
			id: crypto.randomUUID(),
			markedForRemoval: false,
			name: file.name,
			url: URL.createObjectURL(file)
		}));
	}

	function syncLocalGalleryFiles() {
		if (!galleryInput) {
			return;
		}

		const files = new DataTransfer();
		localGalleryPreviews
			.filter((preview) => !preview.markedForRemoval)
			.forEach((preview) => files.items.add(preview.file));
		galleryInput.files = files.files;
	}

	function removeLocalGalleryPreview(id: string) {
		localGalleryPreviews = localGalleryPreviews.map((preview) =>
			preview.id === id ? { ...preview, markedForRemoval: true } : preview
		);
		syncLocalGalleryFiles();
	}

	function restoreLocalGalleryPreview(id: string) {
		localGalleryPreviews = localGalleryPreviews.map((preview) =>
			preview.id === id ? { ...preview, markedForRemoval: false } : preview
		);
		syncLocalGalleryFiles();
	}

	function queueFileRemoval(field: WeddingSingleFileField | 'gallery', filename?: string) {
		if (isSaving) {
			return;
		}

		if (field === 'gallery') {
			if (filename && !pendingGalleryDeletions.includes(filename)) {
				pendingGalleryDeletions = [...pendingGalleryDeletions, filename];
			}
		} else if (!pendingSingleFileDeletions.includes(field)) {
			pendingSingleFileDeletions = [...pendingSingleFileDeletions, field];
		}
	}

	function removeCouplePhoto(field: 'groom_photo' | 'bride_photo') {
		if (isSaving || isOptimizingImages) return;

		revokePreview(localSingleImagePreviews[field]);
		localSingleImagePreviews = { ...localSingleImagePreviews, [field]: undefined };
		localSingleImageFiles = { ...localSingleImageFiles, [field]: undefined };
		queueFileRemoval(field);
	}

	function restoreQueuedGalleryRemoval(filename: string) {
		pendingGalleryDeletions = pendingGalleryDeletions.filter(
			(pendingFilename) => pendingFilename !== filename
		);
	}

	onDestroy(() => {
		clearLocalImagePreviews();
		clearStoryImagePreviews();
	});

	function normalizeSlug(event: Event) {
		if (!(event.currentTarget instanceof HTMLInputElement)) {
			return;
		}

		wedding.slug = event.currentTarget.value
			.toLowerCase()
			.trim()
			.replace(/[^a-z0-9-]+/g, '-')
			.replace(/-{2,}/g, '-')
			.replace(/^-|-$/g, '');
	}

	function addStory() {
		stories = [
			...stories,
			{
				id: crypto.randomUUID(),
				title: '',
				date: '',
				content: '',
				image: '',
				image_url: '',
				sort_order: stories.length,
				localImagePreview: '',
				removeImage: false
			}
		];
	}

	function removeStory(id: string) {
		const story = stories.find((item) => item.id === id);
		revokePreview(story?.localImagePreview);
		stories = stories.filter((story) => story.id !== id);
	}

	function removeEmptyFiles(formData: FormData) {
		for (const [field, value] of Array.from(formData.entries())) {
			if (value instanceof File && value.size === 0) {
				formData.delete(field);
			}
		}
	}

	function normalizeDateField(formData: FormData, field: 'akad' | 'reception') {
		const value = formData.get(field);

		if (typeof value === 'string' && value.length > 0) {
			formData.set(field, new Date(value).toISOString());
		}
	}

	async function saveActiveSection(event: SubmitEvent) {
		event.preventDefault();

		if (
			isSaving ||
			isOptimizingImages ||
			activeSection === null ||
			loadedSection !== activeSection
		) {
			return;
		}

		const form = event.currentTarget;
		if (!(form instanceof HTMLFormElement)) {
			return;
		}

		isSaving = true;
		const section = activeSection;
		const generation = sectionGeneration;

		try {
			if (section === 'Story') {
				const updatedStories = await saveCurrentWeddingStories(
					stories.map((story) => ({
						id: story.id,
						title: story.title,
						date: story.date,
						content: story.content,
						imageFile: story.imageFile,
						removeImage: story.removeImage
					}))
				);
				if (generation !== sectionGeneration) return;
				clearStoryImagePreviews();
				wedding = { ...wedding, stories: updatedStories };
				stories = toEditableStories(updatedStories);
			} else {
				const formData = new FormData(form);
				if (activeSection === 'Tema') {
					// Filtering can unmount the selected radio without changing the selected theme.
					formData.set('theme', selectedTheme);
				}
				formData.delete('event-layout');
				formData.delete('music-option');
				formData.delete('quote-preset');
				removeEmptyFiles(formData);
				for (const field of singleImageFields) {
					const file = localSingleImageFiles[field];
					if (file) {
						formData.set(field, file);
					}
				}
				formData.delete('gallery+');
				for (const preview of localGalleryPreviews) {
					if (!preview.markedForRemoval) {
						formData.append('gallery+', preview.file);
					}
				}

				for (const field of pendingSingleFileDeletions) {
					formData.set(field, '');
				}

				for (const filename of pendingGalleryDeletions) {
					formData.append('gallery-', filename);
				}

				if (activeSection === 'Acara') {
					normalizeDateField(formData, 'akad');
					normalizeDateField(formData, 'reception');
				}

				const updatedWedding = await updateCurrentWedding(formData, section);
				if (generation !== sectionGeneration) return;
				if (
					activeSection === 'Kado' &&
					(updatedWedding.gift_enabled !== giftEnabled ||
						updatedWedding.groom_gift_hidden !== groomGiftHidden ||
						updatedWedding.bride_gift_hidden !== brideGiftHidden)
				) {
					throw new WeddingDataError(
						'Pengaturan tampilan rekening belum tersimpan. Silakan coba lagi.'
					);
				}
				if (
					activeSection === 'Acara' &&
					(updatedWedding.separate_events !== (formData.get('separate_events') === 'true') ||
						updatedWedding.reception_address !== formData.get('reception_address') ||
						updatedWedding.reception_maps !== formData.get('reception_maps'))
				) {
					throw new WeddingDataError('Detail lokasi resepsi belum tersimpan. Silakan coba lagi.');
				}
				refreshLocalData(updatedWedding);
			}

			clearPendingFileChanges();
			form.querySelectorAll<HTMLInputElement>('input[type="file"]').forEach((input) => {
				input.value = '';
			});
			toast.success(`${activeSection} berhasil disimpan.`);
			try {
				summary = await getWeddingSummary();
			} catch {
				toast.error('Perubahan tersimpan, tetapi status kelengkapan belum dapat diperbarui.');
			}
		} catch (error) {
			toast.error(error instanceof WeddingDataError ? error.message : 'Perubahan gagal disimpan.');
		} finally {
			isSaving = false;
		}
	}
</script>

<svelte:head>
	<title>Data Pernikahan — Wedez</title>
	<meta name="description" content="Kelola data pernikahan dan detail acara di Wedez." />
</svelte:head>

<section
	class={activeSection === 'Tema'
		? 'px-4 pt-8 pb-48 sm:px-6 lg:px-10 lg:pt-10'
		: 'px-4 py-8 sm:px-6 lg:px-10 lg:py-10'}
>
	<div class="w-full">
		{#if activeSection === null}
			<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
				{#each sections as section, index (section.title)}
					{@const sectionComplete = isSectionComplete(section.title)}
					<button
						type="button"
						onclick={() => openSection(section.title)}
						class="ws-panel ws-section-card group p-5 text-left transition"
					>
						<div class="flex items-start justify-between gap-4">
							<span class="ws-icon grid size-10 place-items-center text-xs font-bold">
								{String(index + 1).padStart(2, '0')}
							</span>
							<span class="flex items-center gap-2">
								{#if !sectionComplete}
									<span
										class="ws-badge inline-flex items-center gap-1.5 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700"
									>
										<span class="size-1.5 rounded-full bg-amber-500" aria-hidden="true"></span>
										Belum lengkap
									</span>
								{/if}
								<span
									class="text-xl text-gray-300 transition group-hover:translate-x-1 group-hover:text-gray-700"
									aria-hidden="true">→</span
								>
							</span>
						</div>
						<h2 class="mt-5 text-lg font-extrabold text-[#191919]">{section.title}</h2>
						<p class="mt-2 text-sm leading-6 text-[#5c554e]">{section.description}</p>
					</button>
				{/each}
			</div>
		{:else if loadedSection !== activeSection}
			<div class="ws-panel p-5 sm:p-7">
				<button
					type="button"
					onclick={closeActiveSection}
					class="mb-5 cursor-pointer text-sm font-bold">← Back</button
				>
				<header class="border-b border-[#191919] pb-5">
					<h1 class="text-2xl font-extrabold text-[#191919]">{activeSection}</h1>
					<p class="mt-2 text-sm text-[#5c554e]">{activeSectionData?.description}</p>
				</header>
				{#if sectionError}
					<p role="alert" class="mt-4 text-sm text-red-700">{sectionError}</p>
					<button type="button" onclick={() => (sectionLoadAttempt += 1)} class="ws-button mt-4"
						>Coba lagi</button
					>
				{:else}
					<div class="mt-6"><DataSectionSkeleton section={activeSection} /></div>
				{/if}
			</div>
		{:else}
			<form class="ws-panel p-5 sm:p-7" onsubmit={saveActiveSection}>
				<header class="border-b border-[#191919] pb-5">
					<button
						type="button"
						onclick={closeActiveSection}
						class="ws-link mb-5 inline-flex items-center gap-2 text-sm font-semibold text-[#5c554e] transition hover:text-gray-900"
					>
						<span aria-hidden="true">←</span>
						Back
					</button>
					<div class="flex items-start justify-between gap-5 sm:items-center">
						<div>
							<h1 class="text-2xl font-extrabold tracking-tight text-[#191919]">{activeSection}</h1>
							<p class="mt-2 text-sm text-[#5c554e]">{activeSectionData?.description}</p>
						</div>
						{#if activeSection === 'Kado'}
							<button
								type="button"
								role="switch"
								aria-label="Tambahkan kado pada undangan"
								aria-checked={giftEnabled}
								onclick={() => (giftEnabled = !giftEnabled)}
								class={[
									'relative mt-1 h-6 w-11 shrink-0 cursor-pointer rounded-full transition sm:mt-0',
									giftEnabled ? 'bg-gray-900' : 'bg-gray-300'
								]}
							>
								<span
									aria-hidden="true"
									class={[
										'absolute top-1 size-4 rounded-full bg-white transition',
										giftEnabled ? 'left-6' : 'left-1'
									]}
								></span>
							</button>
						{:else if activeSection === 'Musik'}
							<button
								type="button"
								role="switch"
								aria-label="Gunakan musik pada undangan"
								aria-checked={musicEnabled}
								disabled={!musicEnabled && musicOptions.options.length === 0}
								onclick={toggleMusic}
								class={[
									'relative mt-1 h-6 w-11 shrink-0 cursor-pointer rounded-full transition disabled:cursor-not-allowed disabled:opacity-50 sm:mt-0',
									musicEnabled ? 'bg-gray-900' : 'bg-gray-300'
								]}
							>
								<span
									aria-hidden="true"
									class={[
										'absolute top-1 size-4 rounded-full bg-white transition',
										musicEnabled ? 'left-6' : 'left-1'
									]}
								></span>
							</button>
						{/if}
					</div>
				</header>

				<div class="mt-6">
					{#if activeSection === 'Musik'}
						<fieldset>
							<legend class="sr-only">Pilih musik undangan</legend>
							<input type="hidden" name="music" value={musicEnabled ? selectedMusic : ''} />

							{#if musicOptions.error}
								<p class="ws-inset mb-4 bg-red-50 px-4 py-3 text-sm text-red-700">
									{musicOptions.error}
								</p>
							{/if}

							{#if musicOptions.status === 'loading'}
								<DataSectionSkeleton section="Musik" footer={false} />
							{:else if musicOptions.options.length > 0}
								<div
									aria-hidden={!musicEnabled}
									inert={!musicEnabled}
									class={[
										'grid transition-[grid-template-rows,opacity] duration-300 ease-in-out motion-reduce:transition-none',
										musicEnabled ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
									]}
								>
									<div class="min-h-0 overflow-hidden">
										<div class="ws-inset mt-5 overflow-hidden">
											{#each musicOptions.options as music (music.id)}
												<div
													class="flex flex-col gap-3 border-b border-[#191919] px-4 py-4 transition last:border-b-0 sm:flex-row sm:items-center {musicEnabled &&
													selectedMusic === music.id
														? 'bg-[#fffaf1]'
														: 'bg-white'}"
												>
													<label
														class="flex min-w-0 flex-1 items-center gap-3 {musicEnabled
															? 'cursor-pointer'
															: 'cursor-not-allowed'}"
													>
														<input
															type="radio"
															name="music-option"
															value={music.id}
															disabled={!musicEnabled}
															bind:group={selectedMusic}
															onchange={() => (lastSelectedMusic = music.id)}
															class="size-4 shrink-0 border-[#cbd5e1] text-gray-900 focus:ring-[#9400ff] disabled:opacity-40"
														/>
														<span
															class="ws-icon grid size-10 shrink-0 place-items-center"
															aria-hidden="true"
														>
															♪
														</span>
														<span class="truncate text-sm font-semibold text-[#191919]"
															>{music.title}</span
														>
													</label>
													<audio
														controls
														preload="none"
														src={music.music_url}
														onplay={pauseOtherMusicPreviews}
														data-music-preview
														class="h-10 w-full sm:w-64"
													></audio>
												</div>
											{/each}
										</div>
									</div>
								</div>
							{/if}

							{#if musicOptions.status === 'ready' && musicOptions.options.length === 0}
								<p class="mt-4 text-sm text-[#5c554e]">Belum ada musik yang dapat dipilih.</p>
							{/if}
						</fieldset>
					{:else if activeSection === 'Tema'}
						<fieldset>
							<legend class="sr-only">Pilih tema undangan</legend>
							<div class="mb-6 flex flex-wrap gap-2" role="group" aria-label="Filter kategori tema">
								{#each THEME_CATEGORIES as category (category.key)}
									<button
										type="button"
										class={selectedThemeCategory === category.key
											? 'ws-button ws-button--primary px-4 py-2 sm:px-5'
											: 'ws-button px-4 py-2 sm:px-5'}
										aria-pressed={selectedThemeCategory === category.key}
										aria-controls="theme-picker-grid"
										onclick={() => (selectedThemeCategory = category.key)}>{category.label}</button
									>
								{/each}
							</div>
							<div
								id="theme-picker-grid"
								class="grid auto-rows-fr content-start items-stretch justify-start gap-3 sm:grid-cols-2 lg:grid-cols-4"
							>
								{#each filteredThemes as theme (theme.key)}
									<label
										class="ws-theme-option relative flex h-full w-full cursor-pointer flex-col overflow-hidden"
										class:ws-selected={selectedTheme === theme.key}
									>
										<input
											type="radio"
											name="theme"
											value={theme.key}
											bind:group={selectedTheme}
											class="sr-only"
										/>

										<div class="aspect-16/7 shrink-0 overflow-hidden border-b-2 border-[#191919]">
											<img
												class="size-full object-cover"
												src={`/images/theme-previews/${theme.key}.webp`}
												alt=""
												width="1200"
												height="900"
												loading="lazy"
												decoding="async"
											/>
										</div>

										<div class="flex-1 p-3.5">
											<div>
												<h2 class="font-extrabold text-[#191919]">{theme.name}</h2>
												<p class="mt-1.5 text-xs leading-5 text-[#5c554e]">{theme.description}</p>
											</div>
										</div>
									</label>
								{/each}
							</div>
						</fieldset>
					{:else if activeSection === 'Domain'}
						<label class="form-label block">
							Nama subdomain
							<div class="form-control-group mt-2 flex overflow-hidden">
								<input
									name="slug"
									value={wedding.slug}
									oninput={normalizeSlug}
									aria-describedby="domain-preview"
									autocapitalize="none"
									autocomplete="off"
									inputmode="url"
									minlength="3"
									maxlength="50"
									pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
									placeholder="namamempelai"
									spellcheck="false"
									class="form-control-group__input"
									required
								/>
								<span
									title={'.' + invitationBaseHost}
									class="flex max-w-[58%] shrink-0 items-center border-l border-[#191919] bg-[#fffaf1] px-3 text-xs text-[#5c554e] sm:max-w-none sm:px-4 sm:text-sm"
								>
									<span class="truncate">.{invitationBaseHost}</span>
								</span>
							</div>
							<p id="domain-preview" class="mt-2 text-xs font-normal text-[#5c554e]">
								Alamat undangan:
								<span class="font-semibold break-all text-[#191919]">{invitationHostPreview}</span>
							</p>
						</label>
					{:else if activeSection === 'Mempelai'}
						<div class="grid gap-6 lg:grid-cols-2">
							<section class="ws-inset p-4 sm:p-5">
								<h2 class="text-lg font-extrabold text-[#191919]">Mempelai Wanita</h2>
								<div class="mt-4 min-h-44 bg-[#fffaf1] p-6">
									<p class="text-sm font-medium text-[#191919]">Foto Mempelai</p>
									<CouplePhotoPicker
										preview={bridePhotoPreview}
										label="mempelai wanita"
										disabled={isSaving || isOptimizingImages}
										onchange={(event) => previewSingleImage(event, 'bride_photo')}
										onremove={() => removeCouplePhoto('bride_photo')}
									/>
								</div>
								<div class="mt-5 space-y-5">
									<label class="form-label block"
										>Nama lengkap<input
											name="bride_name"
											value={wedding.bride_name}
											class="form-control mt-2"
										/></label
									>
									<label class="form-label block"
										>Nama ayah<input
											name="bride_father_name"
											value={wedding.bride_father_name}
											class="form-control mt-2"
										/></label
									>
									<label class="form-label block"
										>Nama ibu<input
											name="bride_mother_name"
											value={wedding.bride_mother_name}
											class="form-control mt-2"
										/></label
									>
								</div>
							</section>

							<section class="ws-inset p-4 sm:p-5">
								<h2 class="text-lg font-extrabold text-[#191919]">Mempelai Pria</h2>
								<div class="mt-4 min-h-44 bg-[#fffaf1] p-6">
									<p class="text-sm font-medium text-[#191919]">Foto Mempelai</p>
									<CouplePhotoPicker
										preview={groomPhotoPreview}
										label="mempelai pria"
										disabled={isSaving || isOptimizingImages}
										onchange={(event) => previewSingleImage(event, 'groom_photo')}
										onremove={() => removeCouplePhoto('groom_photo')}
									/>
								</div>
								<div class="mt-5 space-y-5">
									<label class="form-label block"
										>Nama lengkap<input
											name="groom_name"
											value={wedding.groom_name}
											class="form-control mt-2"
										/></label
									>
									<label class="form-label block"
										>Nama ayah<input
											name="groom_father_name"
											value={wedding.groom_father_name}
											class="form-control mt-2"
										/></label
									>
									<label class="form-label block"
										>Nama ibu<input
											name="groom_mother_name"
											value={wedding.groom_mother_name}
											class="form-control mt-2"
										/></label
									>
								</div>
							</section>
						</div>
					{:else if activeSection === 'Acara'}
						{#key wedding}
							<WeddingEventForm {wedding} disabled={isSaving} />
						{/key}
					{:else if activeSection === 'Media'}
						<div class="space-y-8">
							<section>
								<h2 class="font-semibold text-[#191919]">Cover undangan</h2>
								<div
									class="form-control-group relative mt-4 aspect-video overflow-hidden"
									class:border-2={!coverPreview}
									class:border-dashed={!coverPreview}
									class:border-[#191919]={!coverPreview}
								>
									{#if coverPreview}
										<img
											src={coverPreview}
											alt="Preview cover undangan"
											class="size-full object-cover"
										/>
										{#if localSingleImagePreviews.cover}
											<span
												class="absolute top-3 right-3 z-20 rounded-lg bg-white/90 px-3 py-2 text-xs font-semibold text-[#191919] shadow"
												>Belum disimpan</span
											>
										{:else}
											<button
												type="button"
												onclick={() => queueFileRemoval('cover')}
												class="ws-button ws-button--small absolute top-3 right-3 z-20 cursor-pointer px-3 py-2 text-xs"
												>Hapus</button
											>
										{/if}
									{/if}

									<input
										type="file"
										accept={OPTIMIZABLE_IMAGE_ACCEPT}
										onchange={(event) => previewSingleImage(event, 'cover')}
										aria-label={coverPreview ? 'Ganti cover undangan' : 'Pilih cover undangan'}
										class="absolute inset-0 z-10 size-full cursor-pointer opacity-0"
									/>
									{#if !coverPreview}
										<span
											class="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-3"
											aria-hidden="true"
										>
											<span
												class="grid size-11 place-items-center rounded-full bg-gray-200 text-[#5c554e]"
											>
												<svg
													class="size-5"
													viewBox="0 0 24 24"
													fill="none"
													stroke="currentColor"
													stroke-width="2"
													stroke-linecap="round"
													stroke-linejoin="round"
												>
													<path d="m14 5 5 5M4 20l3.5-.7L19 7.8a2.1 2.1 0 0 0-3-3L4.7 16.5 4 20Z"
													></path>
												</svg>
											</span>
											<span class="text-sm font-medium text-[#5c554e]">Klik untuk pilih gambar</span
											>
										</span>
									{/if}
								</div>
							</section>

							<section class="border-t border-[#191919] pt-6">
								<h2 class="font-semibold text-[#191919]">Galeri</h2>
								{#if wedding.gallery.length > 0 || localGalleryPreviews.length > 0}
									<div class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
										{#each wedding.gallery as image (image.name)}
											<div class="group relative overflow-hidden bg-[#fffaf1]">
												<img
													src={image.url}
													alt="Galeri pernikahan"
													class:opacity-25={pendingGalleryDeletions.includes(image.name)}
													class="aspect-square w-full object-cover transition-opacity"
												/>
												{#if pendingGalleryDeletions.includes(image.name)}
													<button
														type="button"
														onclick={() => restoreQueuedGalleryRemoval(image.name)}
														aria-label="Kembalikan foto galeri"
														class="ws-button ws-button--small absolute top-2 right-2 px-2.5 py-1.5 text-xs"
														>Kembalikan</button
													>
												{:else}
													<button
														type="button"
														onclick={() => queueFileRemoval('gallery', image.name)}
														aria-label="Hapus foto galeri"
														class="ws-button ws-button--small absolute top-2 right-2 px-2.5 py-1.5 text-xs"
														>Hapus</button
													>
												{/if}
											</div>
										{/each}
										{#each localGalleryPreviews as preview (preview.id)}
											<div class="relative overflow-hidden bg-[#fffaf1]">
												<img
													src={preview.url}
													alt={`Preview ${preview.name}`}
													class:opacity-25={preview.markedForRemoval}
													class="aspect-square w-full object-cover transition-opacity"
												/>
												{#if preview.markedForRemoval}
													<button
														type="button"
														onclick={() => restoreLocalGalleryPreview(preview.id)}
														aria-label={`Kembalikan preview ${preview.name}`}
														class="ws-button ws-button--small absolute top-2 right-2 px-2.5 py-1.5 text-xs"
														>Kembalikan</button
													>
												{:else}
													<button
														type="button"
														onclick={() => removeLocalGalleryPreview(preview.id)}
														aria-label={`Hapus preview ${preview.name}`}
														class="ws-button ws-button--small absolute top-2 right-2 px-2.5 py-1.5 text-xs"
														>Hapus</button
													>
												{/if}
												<span
													class="absolute right-2 bottom-2 left-2 truncate rounded-md bg-gray-900/75 px-2 py-1 text-center text-[11px] font-semibold text-white"
													>Belum disimpan</span
												>
											</div>
										{/each}
									</div>
								{/if}
								<label
									class="form-control-group mt-4 grid min-h-36 cursor-pointer place-items-center border-dashed p-6 text-center shadow-none"
								>
									<span class="text-sm font-semibold text-[#191919]"
										>Tambah foto galeri, maksimal 10 file</span
									>
									<input
										bind:this={galleryInput}
										name="gallery+"
										type="file"
										accept={OPTIMIZABLE_IMAGE_ACCEPT}
										multiple
										onchange={previewGallery}
										class="sr-only"
									/>
								</label>
							</section>
						</div>
					{:else if activeSection === 'Story'}
						<div class="grid gap-5 lg:grid-cols-2">
							{#each stories as story, index (story.id)}
								{@const storyImagePreview = getStoryImagePreview(story)}
								<section class="py-5 sm:p-5">
									<div class="flex items-center justify-between gap-4">
										<h2 class="font-semibold text-[#191919]">Cerita {index + 1}</h2>
										<button
											type="button"
											onclick={() => removeStory(story.id)}
											class="ws-link text-sm font-semibold text-red-600 hover:text-red-700"
											>Hapus</button
										>
									</div>
									<div
										class="form-control-group relative mt-4 aspect-video overflow-hidden"
										class:border-2={!storyImagePreview}
										class:border-dashed={!storyImagePreview}
										class:border-[#191919]={!storyImagePreview}
									>
										{#if storyImagePreview}
											<img
												src={storyImagePreview}
												alt={`Gambar ${story.title || `cerita ${index + 1}`}`}
												class="size-full object-cover"
											/>
											<button
												type="button"
												onclick={() => removeStoryImage(story.id)}
												class="ws-button ws-button--small absolute top-3 right-3 z-20 cursor-pointer px-3 py-2 text-xs"
												>Hapus gambar</button
											>
											{#if story.localImagePreview}<span
													class="absolute right-3 bottom-3 z-20 rounded-lg bg-gray-900/75 px-3 py-1.5 text-xs font-semibold text-white"
													>Belum disimpan</span
												>{/if}
										{/if}
										<input
											type="file"
											accept={OPTIMIZABLE_IMAGE_ACCEPT}
											onchange={(event) => previewStoryImage(event, story.id)}
											aria-label={storyImagePreview
												? `Ganti gambar cerita ${index + 1}`
												: `Pilih gambar cerita ${index + 1}`}
											class="absolute inset-0 z-10 size-full cursor-pointer opacity-0"
										/>
										{#if !storyImagePreview}
											<span
												class="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-3"
												aria-hidden="true"
											>
												<span
													class="grid size-11 place-items-center rounded-full bg-gray-200 text-[#5c554e]"
												>
													<svg
														class="size-5"
														viewBox="0 0 24 24"
														fill="none"
														stroke="currentColor"
														stroke-width="2"
														stroke-linecap="round"
														stroke-linejoin="round"
													>
														<path d="m14 5 5 5M4 20l3.5-.7L19 7.8a2.1 2.1 0 0 0-3-3L4.7 16.5 4 20Z"
														></path>
													</svg>
												</span>
												<span class="text-sm font-medium text-[#5c554e]"
													>Klik untuk pilih gambar</span
												>
											</span>
										{/if}
									</div>
									<div class="mt-5 grid gap-5 sm:grid-cols-2">
										<label class="form-label block"
											>Judul<input
												bind:value={story.title}
												maxlength="200"
												required
												class="form-control mt-2"
											/></label
										>
										<label class="form-label block"
											>Tanggal<input
												type="date"
												bind:value={story.date}
												class="form-control mt-2"
											/></label
										>
									</div>
									<label class="form-label mt-4 block"
										>Cerita<textarea
											bind:value={story.content}
											maxlength="5000"
											required
											class="form-control mt-2 min-h-32"></textarea></label
									>
								</section>
							{/each}
							<button
								type="button"
								onclick={addStory}
								class="ws-button w-full border-2 border-dashed px-5 py-4 text-sm shadow-none! lg:col-span-2"
								>Tambah kisah cinta</button
							>
						</div>
					{:else if activeSection === 'Quote'}
						<fieldset>
							<legend class="sr-only">Pilihan quote</legend>
							<div class="grid gap-3 sm:grid-cols-2">
								{#each quoteOptions as option (option.key)}
									<label
										class="ws-inset flex cursor-pointer items-center justify-between gap-3 px-4 py-3 transition"
										class:border-violet-600={selectedQuotePreset === option.key}
										class:bg-violet-50={selectedQuotePreset === option.key}
										class:border-gray-200={selectedQuotePreset !== option.key}
										class:bg-white={selectedQuotePreset !== option.key}
									>
										<input
											type="radio"
											name="quote-preset"
											value={option.key}
											bind:group={selectedQuotePreset}
											class="sr-only"
										/>
										<span class="text-sm font-semibold text-[#191919]">
											{option.label}: {option.reference}
										</span>
										<span
											class="grid size-5 shrink-0 place-items-center rounded-full border"
											class:border-violet-600={selectedQuotePreset === option.key}
											class:bg-violet-600={selectedQuotePreset === option.key}
											class:border-[#191919]={selectedQuotePreset !== option.key}
										>
											{#if selectedQuotePreset === option.key}
												<span class="size-2 rounded-full bg-white"></span>
											{/if}
										</span>
									</label>
								{/each}

								<label
									class="ws-inset flex cursor-pointer items-center justify-between gap-3 px-4 py-3 transition"
									class:border-violet-600={selectedQuotePreset === 'custom'}
									class:bg-violet-50={selectedQuotePreset === 'custom'}
									class:border-gray-200={selectedQuotePreset !== 'custom'}
									class:bg-white={selectedQuotePreset !== 'custom'}
								>
									<input
										type="radio"
										name="quote-preset"
										value="custom"
										bind:group={selectedQuotePreset}
										onchange={() => (customQuote = '')}
										class="sr-only"
									/>
									<span class="text-sm font-semibold text-[#191919]">Custom</span>
									<span
										class="grid size-5 shrink-0 place-items-center rounded-full border"
										class:border-violet-600={selectedQuotePreset === 'custom'}
										class:bg-violet-600={selectedQuotePreset === 'custom'}
										class:border-[#191919]={selectedQuotePreset !== 'custom'}
									>
										{#if selectedQuotePreset === 'custom'}
											<span class="size-2 rounded-full bg-white"></span>
										{/if}
									</span>
								</label>
							</div>

							{#if selectedQuotePreset === 'custom'}
								<label class="form-label mt-5 block"
									>Isi quote<textarea
										name="quote"
										bind:value={customQuote}
										class="form-control mt-2 min-h-40"
										placeholder="Tuliskan quote yang bermakna"></textarea></label
								>
							{:else}
								<label class="form-label mt-5 block"
									>Isi quote<textarea
										name="quote"
										value={selectedQuote}
										readonly
										class="form-control mt-2 min-h-40 resize-none leading-6"></textarea></label
								>
							{/if}
						</fieldset>
					{:else if activeSection === 'Kado'}
						<input type="hidden" name="gift_enabled" value={giftEnabled ? 'true' : 'false'} />
						<input type="hidden" name="groom_gift_hidden" value={String(groomGiftHidden)} />
						<input type="hidden" name="bride_gift_hidden" value={String(brideGiftHidden)} />
						<div
							aria-hidden={!giftEnabled}
							class={[
								'grid transition-[grid-template-rows,opacity] duration-300 ease-in-out motion-reduce:transition-none',
								giftEnabled ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
							]}
						>
							<div class="-mx-1 min-h-0 overflow-hidden px-1">
								<fieldset disabled={!giftEnabled} class="min-w-0 border-0 p-0">
									<legend class="sr-only">Informasi kado</legend>
									<div class="grid items-start gap-6 xl:grid-cols-2">
										<section class="ws-inset p-4 sm:p-5">
											<div class="flex min-h-11 items-center justify-between gap-5">
												<label
													id="groom-gift-label"
													for="groom-gift-switch"
													class="form-label cursor-pointer">Tampilkan rekening mempelai pria</label
												>
												<button
													id="groom-gift-switch"
													type="button"
													role="switch"
													aria-labelledby="groom-gift-label"
													aria-checked={!groomGiftHidden}
													onclick={() => (groomGiftHidden = !groomGiftHidden)}
													class="relative shrink-0 cursor-pointer before:absolute before:inset-x-0 before:-inset-y-2 focus-visible:shadow-none! focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#191919]!"
													><span aria-hidden="true" class="absolute"></span></button
												>
											</div>
											<fieldset
												disabled={groomGiftHidden}
												hidden={groomGiftHidden}
												class="min-w-0 border-0 p-0"
											>
												<legend class="sr-only">Rekening mempelai pria</legend>
												<div class="mt-5 space-y-5">
													<label class="form-label block">
														Nama Pemilik Rekening / Akun <span class="text-red-500">*</span>
														<input
															name="groom_payment_account_name"
															type="text"
															maxlength="100"
															required
															value={wedding.groom_payment_account_name}
															class="form-control mt-2"
														/>
													</label>
													<label class="form-label block">
														Bank / eWallet <span class="text-red-500">*</span>
														<select
															name="groom_payment_provider"
															required
															value={wedding.groom_payment_provider}
															class="form-control payment-provider mt-2 pr-10"
														>
															<option value="" disabled>Pilih bank / eWallet</option>
															{#if wedding.groom_payment_provider && !isListedPaymentProvider(wedding.groom_payment_provider)}
																<option value={wedding.groom_payment_provider}
																	>{wedding.groom_payment_provider}</option
																>
															{/if}
															<optgroup label="Bank">
																{#each bankOptions as bank (bank)}<option value={bank}
																		>{bank}</option
																	>{/each}
															</optgroup>
															<optgroup label="eWallet">
																{#each eWalletOptions as wallet (wallet)}<option value={wallet}
																		>{wallet}</option
																	>{/each}
															</optgroup>
														</select>
													</label>
													<label class="form-label block">
														Nomor Rekening / Akun <span class="text-red-500">*</span>
														<input
															name="groom_payment_number"
															type="text"
															maxlength="50"
															required
															value={wedding.groom_payment_number}
															inputmode="numeric"
															class="form-control mt-2"
														/>
													</label>
												</div>
											</fieldset>
											{#if groomGiftHidden}<p class="mt-3 text-xs leading-5 text-[#5c554e]">
													Rekening ini tidak ditampilkan pada undangan. Data tetap tersimpan.
												</p>{/if}
										</section>
										<section class="ws-inset p-4 sm:p-5">
											<div class="flex min-h-11 items-center justify-between gap-5">
												<label
													id="bride-gift-label"
													for="bride-gift-switch"
													class="form-label cursor-pointer"
													>Tampilkan rekening mempelai wanita</label
												>
												<button
													id="bride-gift-switch"
													type="button"
													role="switch"
													aria-labelledby="bride-gift-label"
													aria-checked={!brideGiftHidden}
													onclick={() => (brideGiftHidden = !brideGiftHidden)}
													class="relative shrink-0 cursor-pointer before:absolute before:inset-x-0 before:-inset-y-2 focus-visible:shadow-none! focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#191919]!"
													><span aria-hidden="true" class="absolute"></span></button
												>
											</div>
											<fieldset
												disabled={brideGiftHidden}
												hidden={brideGiftHidden}
												class="min-w-0 border-0 p-0"
											>
												<legend class="sr-only">Rekening mempelai wanita</legend>
												<div class="mt-5 space-y-5">
													<label class="form-label block">
														Nama Pemilik Rekening / Akun <span class="text-red-500">*</span>
														<input
															name="bride_payment_account_name"
															type="text"
															maxlength="100"
															required
															value={wedding.bride_payment_account_name}
															class="form-control mt-2"
														/>
													</label>
													<label class="form-label block">
														Bank / eWallet <span class="text-red-500">*</span>
														<select
															name="bride_payment_provider"
															required
															value={wedding.bride_payment_provider}
															class="form-control payment-provider mt-2 pr-10"
														>
															<option value="" disabled>Pilih bank / eWallet</option>
															{#if wedding.bride_payment_provider && !isListedPaymentProvider(wedding.bride_payment_provider)}
																<option value={wedding.bride_payment_provider}
																	>{wedding.bride_payment_provider}</option
																>
															{/if}
															<optgroup label="Bank">
																{#each bankOptions as bank (bank)}<option value={bank}
																		>{bank}</option
																	>{/each}
															</optgroup>
															<optgroup label="eWallet">
																{#each eWalletOptions as wallet (wallet)}<option value={wallet}
																		>{wallet}</option
																	>{/each}
															</optgroup>
														</select>
													</label>
													<label class="form-label block">
														Nomor Rekening / Akun <span class="text-red-500">*</span>
														<input
															name="bride_payment_number"
															type="text"
															maxlength="50"
															required
															value={wedding.bride_payment_number}
															inputmode="numeric"
															class="form-control mt-2"
														/>
													</label>
												</div>
											</fieldset>
											{#if brideGiftHidden}<p class="mt-3 text-xs leading-5 text-[#5c554e]">
													Rekening ini tidak ditampilkan pada undangan. Data tetap tersimpan.
												</p>{/if}
										</section>
									</div>
								</fieldset>
							</div>
						</div>
					{/if}
				</div>

				<div
					class={activeSection === 'Tema'
						? 'ws-panel fixed inset-x-4 bottom-0 z-20 px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:inset-x-6 sm:px-7 md:left-[calc(16rem+1.5rem)] lg:right-10 lg:left-[calc(16rem+2.5rem)]'
						: 'mt-7 border-t border-[#191919] pt-5'}
				>
					<div
						class={activeSection === 'Tema'
							? 'flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'
							: 'flex justify-end'}
					>
						{#if activeSection === 'Tema'}
							<p aria-live="polite" class="min-w-0 text-sm text-[#5c554e]">
								Tema terpilih:
								<strong class="font-extrabold text-[#191919]">{selectedThemeName}</strong>
							</p>
						{/if}
						<button
							type="submit"
							disabled={isSaving ||
								isOptimizingImages ||
								(activeSection === 'Tema' && !themeHasChanges)}
							aria-busy={isSaving || isOptimizingImages}
							class="ws-button ws-button--primary shrink-0 cursor-pointer px-5 py-3 text-sm transition disabled:cursor-not-allowed disabled:opacity-60"
						>
							{isOptimizingImages
								? 'Mengoptimalkan gambar...'
								: isSaving
									? 'Sedang menyimpan...'
									: 'Simpan perubahan'}
						</button>
					</div>
				</div>
			</form>
		{/if}
	</div>
</section>

<style>
	select.payment-provider:focus {
		box-shadow: 3px 3px 0 #191919;
	}

	select.payment-provider:open {
		box-shadow: none;
	}
</style>
