<script lang="ts">
	import { pushState } from '$app/navigation';
	import { page } from '$app/state';
	import { error } from '@sveltejs/kit';
	import { onDestroy, onMount, untrack } from 'svelte';

	import { getMusicOptionsContext } from '#lib/features/musics/index.js';
	import {
		getWeddingContext,
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
	import { WEDDING_THEME_COLORS } from '#lib/features/wedding-themes/index.js';
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
			key: 'minimalist-1',
			family: 'minimalist',
			name: 'Minimalist Romantic',
			description: 'Romantis hangat dengan ruang lapang dan detail lembut.',
			colors: WEDDING_THEME_COLORS['minimalist-1']
		},
		{
			key: 'minimalist-2',
			family: 'minimalist',
			name: 'Minimalist Elegant',
			description: 'Hijau zaitun dan emas matang dalam komposisi formal.',
			colors: WEDDING_THEME_COLORS['minimalist-2']
		},
		{
			key: 'minimalist-3',
			family: 'minimalist',
			name: 'Minimalist Fresh',
			description: 'Hijau kebiruan yang segar, modern, dan ringan.',
			colors: WEDDING_THEME_COLORS['minimalist-3']
		},
		{
			key: 'neubrutalism-1',
			family: 'neubrutalism',
			name: 'Neobrutalism Romantic',
			description: 'Coral dan kuning hangat dengan hard shadow.',
			colors: WEDDING_THEME_COLORS['neubrutalism-1']
		},
		{
			key: 'neubrutalism-2',
			family: 'neubrutalism',
			name: 'Neobrutalism Elegant',
			description: 'Ungu formal dan pink dalam komposisi grafis berkelas.',
			colors: WEDDING_THEME_COLORS['neubrutalism-2']
		},
		{
			key: 'neubrutalism-3',
			family: 'neubrutalism',
			name: 'Neobrutalism Fresh',
			description: 'Toska dan orange segar dengan kontras tinggi.',
			colors: WEDDING_THEME_COLORS['neubrutalism-3']
		},
		{
			key: 'playful-1',
			family: 'playful',
			name: 'Playful Romantic',
			description: 'Pink romantis dan kuning hangat dengan bentuk organik.',
			colors: WEDDING_THEME_COLORS['playful-1']
		},
		{
			key: 'playful-2',
			family: 'playful',
			name: 'Playful Elegant',
			description: 'Lavender elegan dan cyan dalam suasana dreamy.',
			colors: WEDDING_THEME_COLORS['playful-2']
		},
		{
			key: 'playful-3',
			family: 'playful',
			name: 'Playful Fresh',
			description: 'Hijau mint dan coral dengan suasana segar yang ceria.',
			colors: WEDDING_THEME_COLORS['playful-3']
		},
		{
			key: '3d-design-1',
			family: '3d-design',
			name: '3D Romantic',
			description: 'Pink hangat dan orange lembut dengan kedalaman tiga dimensi.',
			colors: WEDDING_THEME_COLORS['3d-design-1']
		},
		{
			key: '3d-design-2',
			family: '3d-design',
			name: '3D Elegant',
			description: 'Ungu gelap dan biru bercahaya dalam komposisi mewah.',
			colors: WEDDING_THEME_COLORS['3d-design-2']
		},
		{
			key: '3d-design-3',
			family: '3d-design',
			name: '3D Fresh',
			description: 'Biru cerah dan mint dengan kedalaman modern yang ringan.',
			colors: WEDDING_THEME_COLORS['3d-design-3']
		}
	] as const;

	type ThemeKey = (typeof themes)[number]['key'];
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
			minimalist: 'minimalist-1',
			brutalism: 'neubrutalism-1',
			playful: 'playful-1'
		};
		const normalizedValue = legacyThemes[value] ?? value;

		return themes.some((theme) => theme.key === normalizedValue)
			? (normalizedValue as ThemeKey)
			: 'minimalist-1';
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
	const musicOptions = getMusicOptionsContext();
	const weddingState = getWeddingContext();
	const initialWedding = await getInitialWedding();
	const initialQuotePreset = getQuotePreset(initialWedding.quote);
	let wedding = $state<WeddingData>({ ...initialWedding });
	let stories = $state<EditableWeddingStory[]>(toEditableStories(initialWedding.stories));
	let akadValue = $state(toDateTimeLocal(initialWedding.akad));
	let receptionValue = $state(toDateTimeLocal(initialWedding.reception));
	let selectedTheme = $state<ThemeKey>(normalizeTheme(initialWedding.theme));
	let selectedMusic = $state(initialWedding.music);
	let musicEnabled = $state(initialWedding.music !== '');
	let lastSelectedMusic = initialWedding.music;
	let selectedQuotePreset = $state<QuotePreset>(initialQuotePreset);
	let customQuote = $state(initialQuotePreset === 'custom' ? initialWedding.quote : '');
	let selectedQuote = $derived(
		selectedQuotePreset === 'custom'
			? customQuote
			: (quoteOptions.find((option) => option.key === selectedQuotePreset)?.text ?? '')
	);
	let activeSection = $derived(getActiveSection(page.state));
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

	async function getInitialWedding(): Promise<WeddingData> {
		try {
			return await weddingState.getCurrentWedding();
		} catch (cause) {
			throw error(500, {
				message: cause instanceof WeddingDataError ? cause.message : 'Data wedding gagal dimuat.'
			});
		}
	}

	onMount(() => {
		void musicOptions.load();
	});

	$effect(() => {
		if (activeSection === null) {
			untrack(resetActiveSectionChanges);
		}
	});

	function getActiveSection(state: App.PageState): SectionName | null {
		const section = (state as DataPageState).dataSection;

		return sections.some((item) => item.title === section) ? (section as SectionName) : null;
	}

	function openSection(section: SectionName) {
		pushState('', { ...page.state, dataSection: section });
	}

	function hasValues(...values: string[]): boolean {
		return values.every((value) => value.trim().length > 0);
	}

	function isSectionComplete(section: SectionName): boolean {
		switch (section) {
			case 'Domain':
				return wedding.slug.trim().length >= 3;
			case 'Mempelai':
				return hasValues(
					wedding.groom_name,
					wedding.groom_father_name,
					wedding.groom_mother_name,
					wedding.groom_photo,
					wedding.bride_name,
					wedding.bride_father_name,
					wedding.bride_mother_name,
					wedding.bride_photo
				);
			case 'Acara':
				return hasValues(wedding.akad, wedding.reception, wedding.address, wedding.maps);
			case 'Media':
				return hasValues(wedding.cover) && wedding.gallery.length > 0;
			case 'Story':
				return (
					stories.length > 0 &&
					stories.every((story) => hasValues(story.title, story.date, story.content, story.image))
				);
			case 'Quote':
				return hasValues(wedding.quote);
			case 'Kado':
				return hasValues(
					wedding.groom_payment_provider,
					wedding.groom_payment_number,
					wedding.bride_payment_provider,
					wedding.bride_payment_number
				);
			case 'Musik':
				return musicEnabled && selectedMusic.length > 0;
			case 'Tema':
				return selectedTheme.length > 0;
		}
	}

	function toDateTimeLocal(value: string): string {
		if (!value) {
			return '';
		}

		const date = new Date(value.replace(' ', 'T'));
		if (Number.isNaN(date.getTime())) {
			return value.slice(0, 16).replace(' ', 'T');
		}

		const offset = date.getTimezoneOffset() * 60_000;
		return new Date(date.getTime() - offset).toISOString().slice(0, 16);
	}

	function refreshLocalData(updatedWedding: WeddingData) {
		clearStoryImagePreviews();
		wedding = updatedWedding;
		stories = toEditableStories(updatedWedding.stories);
		akadValue = toDateTimeLocal(updatedWedding.akad);
		receptionValue = toDateTimeLocal(updatedWedding.reception);
		selectedTheme = normalizeTheme(updatedWedding.theme);
		selectedMusic = updatedWedding.music;
		musicEnabled = updatedWedding.music !== '';
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

		if (isSaving || isOptimizingImages || activeSection === null) {
			return;
		}

		const form = event.currentTarget;
		if (!(form instanceof HTMLFormElement)) {
			return;
		}

		isSaving = true;

		try {
			if (activeSection === 'Story') {
				const updatedStories = await weddingState.saveCurrentWeddingStories(
					stories.map((story) => ({
						id: story.id,
						title: story.title,
						date: story.date,
						content: story.content,
						imageFile: story.imageFile,
						removeImage: story.removeImage
					}))
				);
				clearStoryImagePreviews();
				wedding = { ...wedding, stories: updatedStories };
				stories = toEditableStories(updatedStories);
			} else {
				const formData = new FormData(form);
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

				refreshLocalData(await weddingState.updateCurrentWedding(formData));
			}

			clearPendingFileChanges();
			form.querySelectorAll<HTMLInputElement>('input[type="file"]').forEach((input) => {
				input.value = '';
			});
			toast.success(`${activeSection} berhasil disimpan.`);
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

<section class="px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
	<div class="mx-auto w-full max-w-6xl">
		{#if activeSection === null}
			<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
				{#each sections as section, index (section.title)}
					{@const sectionComplete = isSectionComplete(section.title)}
					<button
						type="button"
						onclick={() => openSection(section.title)}
						class="group rounded-2xl border border-gray-200 bg-white p-5 text-left transition hover:-translate-y-0.5 hover:border-gray-300"
					>
						<div class="flex items-start justify-between gap-4">
							<span
								class="grid size-10 place-items-center rounded-xl bg-gray-100 text-xs font-bold text-gray-500"
							>
								{String(index + 1).padStart(2, '0')}
							</span>
							<span class="flex items-center gap-2">
								{#if !sectionComplete}
									<span
										class="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700"
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
						<h2 class="mt-5 text-lg font-bold text-gray-900">{section.title}</h2>
						<p class="mt-2 text-sm leading-6 text-gray-500">{section.description}</p>
					</button>
				{/each}
			</div>
		{:else}
			<form
				class="rounded-2xl border border-gray-200 bg-white p-5 sm:p-7"
				onsubmit={saveActiveSection}
			>
				<header class="border-b border-gray-200 pb-5">
					<button
						type="button"
						onclick={closeActiveSection}
						class="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-gray-500 transition hover:text-gray-900"
					>
						<span aria-hidden="true">←</span>
						Back
					</button>
					<h1 class="text-2xl font-bold tracking-tight text-gray-900">{activeSection}</h1>
					<p class="mt-2 text-sm text-gray-500">{activeSectionData?.description}</p>
				</header>

				<div class="mt-6">
					{#if activeSection === 'Musik'}
						<fieldset>
							<legend class="sr-only">Pilih musik undangan</legend>
							<input type="hidden" name="music" value={musicEnabled ? selectedMusic : ''} />

							{#if musicOptions.error}
								<p
									class="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
								>
									{musicOptions.error}
								</p>
							{/if}

							<div class="flex items-center justify-between gap-5 border-b border-gray-200 pb-5">
								<div>
									<p class="text-sm font-semibold text-gray-900">Gunakan musik</p>
									<p class="mt-1 text-sm text-gray-500">Putar musik saat undangan dibuka.</p>
								</div>
								<button
									type="button"
									role="switch"
									aria-label="Gunakan musik pada undangan"
									aria-checked={musicEnabled}
									disabled={!musicEnabled && musicOptions.options.length === 0}
									onclick={toggleMusic}
									class={[
										'relative h-6 w-11 shrink-0 rounded-full transition disabled:cursor-not-allowed disabled:opacity-50',
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
							</div>

							{#if musicOptions.status === 'loading'}
								<p class="mt-4 text-sm text-gray-500">Memuat daftar musik...</p>
							{:else if musicOptions.options.length > 0}
								<div class="mt-5 overflow-hidden rounded-xl border border-gray-200 bg-white">
									{#each musicOptions.options as music (music.id)}
										<div
											class="flex flex-col gap-3 border-b border-gray-200 px-4 py-4 transition last:border-b-0 sm:flex-row sm:items-center {musicEnabled &&
											selectedMusic === music.id
												? 'bg-gray-50'
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
													class="grid size-10 shrink-0 place-items-center rounded-full bg-gray-100 text-gray-500"
													aria-hidden="true"
												>
													♪
												</span>
												<span class="truncate text-sm font-semibold text-gray-900"
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
							{/if}

							{#if musicOptions.status === 'ready' && musicOptions.options.length === 0}
								<p class="mt-4 text-sm text-gray-500">Belum ada musik yang dapat dipilih.</p>
							{/if}
						</fieldset>
					{:else if activeSection === 'Tema'}
						<fieldset>
							<legend class="sr-only">Pilih tema undangan</legend>
							<div
								class="grid auto-rows-fr content-start items-stretch justify-start gap-3 sm:grid-cols-2 lg:grid-cols-4"
							>
								{#each themes as theme (theme.key)}
									<label
										class="relative flex h-full w-full cursor-pointer flex-col overflow-hidden rounded-xl border-2 transition duration-200 {selectedTheme ===
										theme.key
											? 'border-gray-900 bg-white'
											: 'border-gray-200 bg-white hover:-translate-y-0.5 hover:border-gray-400'}"
									>
										<input
											type="radio"
											name="theme"
											value={theme.key}
											bind:group={selectedTheme}
											class="sr-only"
										/>

										<div
											class="aspect-16/7 shrink-0 overflow-hidden border-b-2 {selectedTheme ===
											theme.key
												? 'border-gray-900'
												: 'border-gray-200'}"
										>
											{#if theme.family === 'minimalist'}
												<div
													class="grid size-full grid-cols-[1fr_42%] p-3"
													style:background={theme.colors.background}
												>
													<div class="flex flex-col justify-center">
														<span
															class="h-1.5 w-12 rounded-full"
															style:background={theme.colors.accent}
														></span>
														<span
															class="mt-3 h-4 w-4/5 rounded"
															style:background={theme.colors.text}
														></span>
														<span
															class="mt-1.5 h-4 w-3/5 rounded"
															style:background={theme.colors.primary}
														></span>
														<span
															class="mt-4 h-1.5 w-1/2 rounded"
															style:background={theme.colors.accent}
														></span>
													</div>
													<div
														class="overflow-hidden rounded-t-full"
														style:background={theme.colors.surface}
													></div>
												</div>
											{:else if theme.family === 'neubrutalism'}
												<div
													class="relative size-full overflow-hidden p-3"
													style:background={theme.colors.background}
												>
													<div
														class="absolute -top-6 -right-6 size-20 rotate-12 border-[3px]"
														style:background={theme.colors.primary}
														style:border-color={theme.colors.text}
													></div>
													<div
														class="relative mt-3 w-4/5 -rotate-2 border-[3px] p-2.5"
														style:background={theme.colors.surface}
														style:border-color={theme.colors.text}
														style:box-shadow={'5px 5px 0 ' + theme.colors.text}
													>
														<span class="block h-3.5 w-full" style:background={theme.colors.text}
														></span>
														<span
															class="mt-1.5 block h-3.5 w-3/4"
															style:background={theme.colors.text}
														></span>
													</div>
													<div
														class="absolute right-5 bottom-4 h-9 w-24 border-[3px]"
														style:background={theme.colors.accent}
														style:border-color={theme.colors.text}
														style:box-shadow={'4px 4px 0 ' + theme.colors.text}
													></div>
												</div>
											{:else if theme.family === 'playful'}
												<div
													class="relative size-full overflow-hidden p-3"
													style:background={theme.colors.background}
												>
													<div
														class="absolute -top-5 -left-5 size-20 rounded-full"
														style:background={theme.colors.primary}
													></div>
													<div
														class="absolute -right-5 -bottom-6 size-24 rounded-[42%_58%_68%_32%]"
														style:background={theme.colors.accent}
													></div>
													<div
														class="relative mx-auto mt-2 flex h-[78%] w-[72%] rotate-2 flex-col items-center justify-center rounded-4xl border-2"
														style:background={theme.colors.surface}
														style:border-color={theme.colors.text}
														style:box-shadow={'5px 5px 0 ' + theme.colors.accent}
													>
														<span
															class="h-3 w-3/5 rounded-full"
															style:background={theme.colors.text}
														></span>
														<span
															class="mt-2 h-2 w-2/5 rounded-full"
															style:background={theme.colors.primary}
														></span>
														<div class="mt-3 flex gap-1.5">
															<span
																class="size-3 rounded-full"
																style:background={theme.colors.accent}
															></span>
															<span
																class="size-3 rounded-full opacity-70"
																style:background={theme.colors.primary}
															></span>
															<span
																class="size-3 rounded-full opacity-40"
																style:background={theme.colors.accent}
															></span>
														</div>
													</div>
												</div>
											{:else}
												<div
													class="relative size-full overflow-hidden p-3"
													style:background={theme.colors.background}
												>
													<div
														class="absolute -top-6 -left-5 size-20 rounded-full blur-sm"
														style:background={theme.colors.accent}
													></div>
													<div
														class="absolute -right-4 -bottom-7 size-24 rounded-[38%_62%_68%_32%]"
														style:background={theme.colors.primary}
													></div>
													<div
														class="relative mx-auto mt-2 flex h-[78%] w-[72%] flex-col items-center justify-center rounded-[1.75rem]"
														style:background={theme.colors.surface}
														style:box-shadow={'6px 8px 0 ' +
															theme.colors.accent +
															', 12px 15px 0 ' +
															theme.colors.primary}
													>
														<span
															class="h-3 w-3/5 rounded-full"
															style:background={theme.colors.text}
														></span>
														<span
															class="mt-2 h-2 w-2/5 rounded-full"
															style:background={theme.colors.primary}
														></span>
													</div>
												</div>
											{/if}
										</div>

										<div class="flex-1 p-3.5">
											<div>
												<h2 class="font-bold text-gray-900">{theme.name}</h2>
												<p class="mt-1.5 text-xs leading-5 text-gray-500">{theme.description}</p>
											</div>
										</div>
									</label>
								{/each}
							</div>
						</fieldset>
					{:else if activeSection === 'Domain'}
						<label class="block text-sm font-medium text-gray-700">
							Nama subdomain
							<div
								data-form-control
								class="mt-2 flex overflow-hidden rounded-xl border border-gray-700 bg-white"
							>
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
									class="field min-w-0 flex-1 border-0 px-4 py-3 text-sm"
									required
								/>
								<span
									title={'.' + invitationBaseHost}
									class="flex max-w-[58%] shrink-0 items-center border-l border-gray-200 bg-gray-50 px-3 text-xs text-gray-500 sm:max-w-none sm:px-4 sm:text-sm"
								>
									<span class="truncate">.{invitationBaseHost}</span>
								</span>
							</div>
							<p id="domain-preview" class="mt-2 text-xs font-normal text-gray-500">
								Alamat undangan:
								<span class="font-semibold break-all text-gray-700">{invitationHostPreview}</span>
							</p>
						</label>
					{:else if activeSection === 'Mempelai'}
						<div class="grid gap-6 lg:grid-cols-2">
							<section class="rounded-xl border border-gray-200 p-4 sm:p-5">
								<h2 class="text-lg font-bold text-gray-950">Mempelai Wanita</h2>
								<div class="mt-4 min-h-44 rounded-xl bg-gray-50 p-6">
									<p class="text-sm font-medium text-gray-900">Foto Mempelai</p>
									<div class="relative mt-4 w-fit">
										{#if bridePhotoPreview}
											<img
												src={bridePhotoPreview}
												alt="Preview mempelai wanita"
												class="size-22 rounded-full object-cover"
											/>
										{:else}
											<div
												class="grid size-22 place-items-center rounded-full border-2 border-dashed border-gray-300 text-gray-400"
											>
												<svg
													aria-hidden="true"
													class="size-9"
													viewBox="0 0 24 24"
													fill="none"
													stroke="currentColor"
													stroke-width="1.7"
													stroke-linecap="round"
													stroke-linejoin="round"
												>
													<circle cx="12" cy="8" r="3.5"></circle>
													<path d="M5.5 21v-2.5a6.5 6.5 0 0 1 13 0V21"></path>
												</svg>
											</div>
										{/if}
										{#if bridePhotoPreview && !localSingleImagePreviews.bride_photo}
											<button
												type="button"
												onclick={() => queueFileRemoval('bride_photo')}
												aria-label="Hapus foto mempelai wanita"
												class="absolute -top-1 -right-1 grid size-8 cursor-pointer place-items-center rounded-full bg-red-500 text-white"
											>
												<svg
													aria-hidden="true"
													class="size-4"
													viewBox="0 0 24 24"
													fill="none"
													stroke="currentColor"
													stroke-width="2"
													stroke-linecap="round"
													stroke-linejoin="round"
												>
													<path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5"></path>
												</svg>
											</button>
										{:else}
											<label
												for="bride-photo"
												aria-label={bridePhotoPreview
													? 'Ganti foto mempelai wanita'
													: 'Pilih foto mempelai wanita'}
												class="absolute -top-1 -right-1 grid size-8 cursor-pointer place-items-center rounded-full bg-linear-to-r from-[#9400ff] to-[#7200e8] text-white"
											>
												<svg
													aria-hidden="true"
													class="size-4"
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
											</label>
										{/if}
										<input
											id="bride-photo"
											type="file"
											accept={OPTIMIZABLE_IMAGE_ACCEPT}
											onchange={(event) => previewSingleImage(event, 'bride_photo')}
											class="sr-only"
										/>
									</div>
								</div>
								<div class="mt-5 space-y-4">
									<label class="block text-sm font-medium text-gray-700"
										>Nama lengkap<input
											name="bride_name"
											value={wedding.bride_name}
											class="field mt-2 w-full rounded-xl border border-gray-700 bg-white px-4 py-3 text-sm"
										/></label
									>
									<label class="block text-sm font-medium text-gray-700"
										>Nama ayah<input
											name="bride_father_name"
											value={wedding.bride_father_name}
											class="field mt-2 w-full rounded-xl border border-gray-700 bg-white px-4 py-3 text-sm"
										/></label
									>
									<label class="block text-sm font-medium text-gray-700"
										>Nama ibu<input
											name="bride_mother_name"
											value={wedding.bride_mother_name}
											class="field mt-2 w-full rounded-xl border border-gray-700 bg-white px-4 py-3 text-sm"
										/></label
									>
								</div>
							</section>

							<section class="rounded-xl border border-gray-200 p-4 sm:p-5">
								<h2 class="text-lg font-bold text-gray-950">Mempelai Pria</h2>
								<div class="mt-4 min-h-44 rounded-xl bg-gray-50 p-6">
									<p class="text-sm font-medium text-gray-900">Foto Mempelai</p>
									<div class="relative mt-4 w-fit">
										{#if groomPhotoPreview}
											<img
												src={groomPhotoPreview}
												alt="Preview mempelai pria"
												class="size-22 rounded-full object-cover"
											/>
										{:else}
											<div
												class="grid size-22 place-items-center rounded-full border-2 border-dashed border-gray-300 text-gray-400"
											>
												<svg
													aria-hidden="true"
													class="size-9"
													viewBox="0 0 24 24"
													fill="none"
													stroke="currentColor"
													stroke-width="1.7"
													stroke-linecap="round"
													stroke-linejoin="round"
												>
													<circle cx="12" cy="8" r="3.5"></circle>
													<path d="M5.5 21v-2.5a6.5 6.5 0 0 1 13 0V21"></path>
												</svg>
											</div>
										{/if}
										{#if groomPhotoPreview && !localSingleImagePreviews.groom_photo}
											<button
												type="button"
												onclick={() => queueFileRemoval('groom_photo')}
												aria-label="Hapus foto mempelai pria"
												class="absolute -top-1 -right-1 grid size-8 cursor-pointer place-items-center rounded-full bg-red-500 text-white"
											>
												<svg
													aria-hidden="true"
													class="size-4"
													viewBox="0 0 24 24"
													fill="none"
													stroke="currentColor"
													stroke-width="2"
													stroke-linecap="round"
													stroke-linejoin="round"
												>
													<path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5"></path>
												</svg>
											</button>
										{:else}
											<label
												for="groom-photo"
												aria-label={groomPhotoPreview
													? 'Ganti foto mempelai pria'
													: 'Pilih foto mempelai pria'}
												class="absolute -top-1 -right-1 grid size-8 cursor-pointer place-items-center rounded-full bg-linear-to-r from-[#9400ff] to-[#7200e8] text-white"
											>
												<svg
													aria-hidden="true"
													class="size-4"
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
											</label>
										{/if}
										<input
											id="groom-photo"
											type="file"
											accept={OPTIMIZABLE_IMAGE_ACCEPT}
											onchange={(event) => previewSingleImage(event, 'groom_photo')}
											class="sr-only"
										/>
									</div>
								</div>
								<div class="mt-5 space-y-4">
									<label class="block text-sm font-medium text-gray-700"
										>Nama lengkap<input
											name="groom_name"
											value={wedding.groom_name}
											class="field mt-2 w-full rounded-xl border border-gray-700 bg-white px-4 py-3 text-sm"
										/></label
									>
									<label class="block text-sm font-medium text-gray-700"
										>Nama ayah<input
											name="groom_father_name"
											value={wedding.groom_father_name}
											class="field mt-2 w-full rounded-xl border border-gray-700 bg-white px-4 py-3 text-sm"
										/></label
									>
									<label class="block text-sm font-medium text-gray-700"
										>Nama ibu<input
											name="groom_mother_name"
											value={wedding.groom_mother_name}
											class="field mt-2 w-full rounded-xl border border-gray-700 bg-white px-4 py-3 text-sm"
										/></label
									>
								</div>
							</section>
						</div>
					{:else if activeSection === 'Acara'}
						<div class="space-y-5">
							<div class="grid gap-5 sm:grid-cols-2">
								<label class="block text-sm font-medium text-gray-700"
									>Akad nikah<input
										name="akad"
										type="datetime-local"
										bind:value={akadValue}
										class="field mt-2 w-full rounded-xl border border-gray-700 bg-white! px-4 py-3 text-sm"
									/></label
								>
								<label class="block text-sm font-medium text-gray-700"
									>Resepsi<input
										name="reception"
										type="datetime-local"
										bind:value={receptionValue}
										class="field mt-2 w-full rounded-xl border border-gray-700 bg-white! px-4 py-3 text-sm"
									/></label
								>
							</div>
							<label class="block text-sm font-medium text-gray-700"
								>Alamat acara<textarea
									name="address"
									bind:value={wedding.address}
									class="field mt-2 min-h-32 w-full rounded-xl border border-gray-700 bg-white! px-4 py-3 text-sm"
									placeholder="Alamat lengkap"></textarea></label
							>
							<label class="block text-sm font-medium text-gray-700">
								Link Google Maps
								<input
									name="maps"
									type="url"
									value={wedding.maps}
									class="field mt-2 w-full rounded-xl border border-gray-700 bg-white! px-4 py-3 text-sm"
									placeholder="https://maps.app.goo.gl/..."
								/>
								<span class="mt-2 block text-xs font-normal text-gray-500"
									>Salin link lokasi melalui menu Bagikan di Google Maps.</span
								>
							</label>
						</div>
					{:else if activeSection === 'Media'}
						<div class="space-y-8">
							<section>
								<h2 class="font-semibold text-gray-900">Cover undangan</h2>
								<div
									class="relative mt-4 aspect-video overflow-hidden rounded-xl bg-gray-100 focus-within:ring-2 focus-within:ring-[#9400ff]/30"
									class:border-2={!coverPreview}
									class:border-dashed={!coverPreview}
									class:border-gray-300={!coverPreview}
								>
									{#if coverPreview}
										<img
											src={coverPreview}
											alt="Preview cover undangan"
											class="size-full object-cover"
										/>
										{#if localSingleImagePreviews.cover}
											<span
												class="absolute top-3 right-3 z-20 rounded-lg bg-white/90 px-3 py-2 text-xs font-semibold text-gray-700 shadow"
												>Belum disimpan</span
											>
										{:else}
											<button
												type="button"
												onclick={() => queueFileRemoval('cover')}
												class="absolute top-3 right-3 z-20 cursor-pointer rounded-lg bg-white/90 px-3 py-2 text-xs font-semibold text-red-600 shadow"
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
											class="pointer-events-none absolute inset-0 z-10 grid place-items-center"
											aria-hidden="true"
										>
											<span
												class="grid size-11 place-items-center rounded-full bg-gray-200 text-gray-600"
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
										</span>
									{/if}
								</div>
							</section>

							<section class="border-t border-gray-200 pt-6">
								<h2 class="font-semibold text-gray-900">Galeri</h2>
								{#if wedding.gallery.length > 0 || localGalleryPreviews.length > 0}
									<div class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
										{#each wedding.gallery as image (image.name)}
											<div class="group relative overflow-hidden rounded-xl bg-gray-100">
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
														class="absolute top-2 right-2 rounded-lg bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-700 shadow"
														>Kembalikan</button
													>
												{:else}
													<button
														type="button"
														onclick={() => queueFileRemoval('gallery', image.name)}
														aria-label="Hapus foto galeri"
														class="absolute top-2 right-2 rounded-lg bg-white/90 px-2.5 py-1.5 text-xs font-semibold text-red-600 shadow"
														>Hapus</button
													>
												{/if}
											</div>
										{/each}
										{#each localGalleryPreviews as preview (preview.id)}
											<div class="relative overflow-hidden rounded-xl bg-gray-100">
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
														class="absolute top-2 right-2 rounded-lg bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-700 shadow"
														>Kembalikan</button
													>
												{:else}
													<button
														type="button"
														onclick={() => removeLocalGalleryPreview(preview.id)}
														aria-label={`Hapus preview ${preview.name}`}
														class="absolute top-2 right-2 rounded-lg bg-white/90 px-2.5 py-1.5 text-xs font-semibold text-red-600 shadow"
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
									data-form-control
									class="mt-4 grid min-h-36 cursor-pointer place-items-center rounded-xl border-2 border-dashed border-gray-700 bg-gray-50 p-6 text-center hover:bg-gray-100"
								>
									<span class="text-sm font-semibold text-gray-700"
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
								<section class="rounded-xl py-5 sm:p-5">
									<div class="flex items-center justify-between gap-4">
										<h2 class="font-semibold text-gray-900">Cerita {index + 1}</h2>
										<button
											type="button"
											onclick={() => removeStory(story.id)}
											class="text-sm font-semibold text-red-600 hover:text-red-700">Hapus</button
										>
									</div>
									{#if storyImagePreview}
										<div class="relative mt-4 overflow-hidden rounded-xl bg-white">
											<img
												src={storyImagePreview}
												alt={`Gambar ${story.title || `cerita ${index + 1}`}`}
												class="aspect-video w-full object-cover"
											/>
											<button
												type="button"
												onclick={() => removeStoryImage(story.id)}
												class="absolute top-3 right-3 rounded-lg bg-white/90 px-3 py-2 text-xs font-semibold text-red-600 shadow"
												>Hapus gambar</button
											>
											{#if story.localImagePreview}<span
													class="absolute right-3 bottom-3 rounded-lg bg-gray-900/75 px-3 py-1.5 text-xs font-semibold text-white"
													>Belum disimpan</span
												>{/if}
										</div>
									{:else}
										<div
											class="mt-4 grid aspect-video place-items-center rounded-xl border border-dashed border-gray-300 bg-white px-5 text-center text-gray-400"
										>
											<div>
												<svg
													aria-hidden="true"
													class="mx-auto size-8"
													viewBox="0 0 24 24"
													fill="none"
													stroke="currentColor"
													stroke-width="1.6"
												>
													<rect x="3" y="4" width="18" height="16" rx="2"></rect>
													<circle cx="8.5" cy="9" r="1.5"></circle>
													<path d="m5 17 4.5-4.5 3 3 2-2L19 18"></path>
												</svg>
												<p class="mt-2 text-xs font-medium">Belum ada gambar cerita</p>
											</div>
										</div>
									{/if}
									<label class="mt-4 block text-sm font-medium text-gray-700">
										Gambar cerita
										<input
											type="file"
											accept={OPTIMIZABLE_IMAGE_ACCEPT}
											onchange={(event) => previewStoryImage(event, story.id)}
											class="mt-2 block w-full text-sm text-gray-500 file:mr-4 file:rounded-lg file:border-0 file:bg-white file:px-4 file:py-2 file:font-semibold file:text-gray-700"
										/>
									</label>
									<div class="mt-4 grid gap-4 sm:grid-cols-2">
										<label class="block text-sm font-medium text-gray-700"
											>Judul<input
												bind:value={story.title}
												maxlength="200"
												required
												class="field mt-2 w-full rounded-xl border border-gray-700 bg-white px-4 py-3 text-sm"
											/></label
										>
										<label class="block text-sm font-medium text-gray-700"
											>Tanggal<input
												type="date"
												bind:value={story.date}
												class="field mt-2 w-full rounded-xl border border-gray-700 bg-white px-4 py-3 text-sm"
											/></label
										>
									</div>
									<label class="mt-4 block text-sm font-medium text-gray-700"
										>Cerita<textarea
											bind:value={story.content}
											maxlength="5000"
											required
											class="field mt-2 min-h-32 w-full rounded-xl border border-gray-700 bg-white px-4 py-3 text-sm"
										></textarea></label
									>
								</section>
							{/each}
							<button
								type="button"
								onclick={addStory}
								class="w-full rounded-xl border-2 border-dashed border-gray-300 px-5 py-4 text-sm font-semibold text-gray-600 hover:border-gray-400 hover:bg-gray-50 lg:col-span-2"
								>Tambah kisah cinta</button
							>
						</div>
					{:else if activeSection === 'Quote'}
						<fieldset>
							<legend class="sr-only">Pilihan quote</legend>
							<div class="grid gap-3 sm:grid-cols-2">
								{#each quoteOptions as option (option.key)}
									<label
										class="flex cursor-pointer items-center justify-between gap-3 rounded-xl border px-4 py-3 transition"
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
										<span class="text-sm font-semibold text-gray-900">
											{option.label}: {option.reference}
										</span>
										<span
											class="grid size-5 shrink-0 place-items-center rounded-full border"
											class:border-violet-600={selectedQuotePreset === option.key}
											class:bg-violet-600={selectedQuotePreset === option.key}
											class:border-gray-300={selectedQuotePreset !== option.key}
										>
											{#if selectedQuotePreset === option.key}
												<span class="size-2 rounded-full bg-white"></span>
											{/if}
										</span>
									</label>
								{/each}

								<label
									class="flex cursor-pointer items-center justify-between gap-3 rounded-xl border px-4 py-3 transition"
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
									<span class="text-sm font-semibold text-gray-900">Custom</span>
									<span
										class="grid size-5 shrink-0 place-items-center rounded-full border"
										class:border-violet-600={selectedQuotePreset === 'custom'}
										class:bg-violet-600={selectedQuotePreset === 'custom'}
										class:border-gray-300={selectedQuotePreset !== 'custom'}
									>
										{#if selectedQuotePreset === 'custom'}
											<span class="size-2 rounded-full bg-white"></span>
										{/if}
									</span>
								</label>
							</div>

							{#if selectedQuotePreset === 'custom'}
								<label class="mt-5 block text-sm font-medium text-gray-700"
									>Isi quote<textarea
										name="quote"
										bind:value={customQuote}
										class="field mt-2 min-h-40 w-full rounded-xl border border-gray-700 bg-white px-4 py-3 text-sm"
										placeholder="Tuliskan quote yang bermakna"></textarea></label
								>
							{:else}
								<label class="mt-5 block text-sm font-medium text-gray-700"
									>Isi quote<textarea
										name="quote"
										value={selectedQuote}
										readonly
										class="field mt-2 min-h-40 w-full resize-none rounded-xl border border-gray-700 bg-gray-50 px-4 py-3 text-sm leading-6 text-gray-700"
									></textarea></label
								>
							{/if}
						</fieldset>
					{:else if activeSection === 'Kado'}
						<div class="grid gap-6 xl:grid-cols-2">
							<section class="rounded-xl py-5 sm:p-5">
								<h2 class="font-semibold text-gray-900">Mempelai pria</h2>
								<div class="mt-4 space-y-4">
									<label class="block text-sm font-medium text-gray-700"
										>Nama bank atau e-wallet<input
											name="groom_payment_provider"
											type="text"
											maxlength="100"
											value={wedding.groom_payment_provider}
											class="field mt-2 w-full rounded-xl border border-gray-700 bg-white px-4 py-3 text-sm"
											placeholder="Contoh: BCA atau GoPay"
										/></label
									>
									<label class="block text-sm font-medium text-gray-700"
										>Nomor rekening atau e-wallet<input
											name="groom_payment_number"
											type="text"
											maxlength="50"
											value={wedding.groom_payment_number}
											inputmode="numeric"
											class="field mt-2 w-full rounded-xl border border-gray-700 bg-white px-4 py-3 text-sm"
											placeholder="Masukkan nomor tanpa spasi"
										/></label
									>
								</div>
							</section>
							<section class="rounded-xl py-5 sm:p-5">
								<h2 class="font-semibold text-gray-900">Mempelai wanita</h2>
								<div class="mt-4 space-y-4">
									<label class="block text-sm font-medium text-gray-700"
										>Nama bank atau e-wallet<input
											name="bride_payment_provider"
											type="text"
											maxlength="100"
											value={wedding.bride_payment_provider}
											class="field mt-2 w-full rounded-xl border border-gray-700 bg-white px-4 py-3 text-sm"
											placeholder="Contoh: Mandiri atau DANA"
										/></label
									>
									<label class="block text-sm font-medium text-gray-700"
										>Nomor rekening atau e-wallet<input
											name="bride_payment_number"
											type="text"
											maxlength="50"
											value={wedding.bride_payment_number}
											inputmode="numeric"
											class="field mt-2 w-full rounded-xl border border-gray-700 bg-white px-4 py-3 text-sm"
											placeholder="Masukkan nomor tanpa spasi"
										/></label
									>
								</div>
							</section>
						</div>
					{/if}
				</div>

				<div class="mt-7 flex justify-end border-t border-gray-200 pt-5">
					<button
						type="submit"
						disabled={isSaving || isOptimizingImages}
						aria-busy={isSaving || isOptimizingImages}
						class="cursor-pointer rounded-xl bg-linear-to-r from-[#9400ff] to-[#7200e8] px-5 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
					>
						{isOptimizingImages
							? 'Mengoptimalkan gambar...'
							: isSaving
								? 'Sedang menyimpan...'
								: 'Simpan perubahan'}
					</button>
				</div>
			</form>
		{/if}
	</div>
</section>
