<script lang="ts">
	import { page } from '$app/state';
	import { onMount, untrack } from 'svelte';

	import { PublicRsvpForm } from '#lib/features/guests/index.js';
	import type { WeddingThemeKey, WeddingThemeProps } from '../../model/wedding-theme.js';
	import { WEDDING_THEME_COLORS } from '../../model/wedding-theme-colors.js';
	import { fitCoupleHeading } from '../../shared/fit-couple-heading.js';
	import {
		mountWeddingThemeAnimations,
		type WeddingThemeAnimationController
	} from '../../shared/theme-animations.js';
	import {
		calculateCountdown,
		formatEventDate,
		formatPersonName,
		formatStoryDate,
		safeExternalURL
	} from '../../shared/theme-utils.js';

	type ThemeProfile = {
		family:
			| '3d-design'
			| 'minimalist'
			| 'neubrutalism'
			| 'nocturne'
			| 'playful'
			| 'sunda'
			| 'aceh'
			| 'jawa'
			| 'batak'
			| 'bugis'
			| 'betawi'
			| 'minang'
			| 'toraja';
		name: string;
		variant: 1 | 2 | 3;
	};

	type CanvasThemeKey = Exclude<
		WeddingThemeKey,
		| 'kinetika'
		| 'anomali'
		| 'selaras'
		| 'pramesti'
		| 'seruni'
		| 'arsir'
		| 'kusuma'
		| 'aurelia'
		| 'arunika'
		| 'zamrud'
		| 'cendana'
		| 'lentera'
		| 'safira'
		| 'renjana'
		| 'monokrom'
		| 'swarna'
		| 'sonata'
		| 'jelajah'
		| 'folio'
		| 'pusaka'
		| 'sinema'
		| 'adikara'
		| 'komika'
		| 'warta'
		| 'retro'
		| 'kristal'
		| 'amerta'
		| 'niskala'
		| 'sakura'
		| 'lazuardi'
		| 'melati'
		| 'eukaliptus'
		| 'jingga'
		| 'peony'
		| 'gardenia'
		| 'aster'
	>;
	type Props = WeddingThemeProps & {
		theme: CanvasThemeKey;
	};

	const themeProfiles: Record<CanvasThemeKey, ThemeProfile> = {
		'minimalist-1': { family: 'minimalist', name: 'Romantic Warm', variant: 1 },
		'minimalist-2': { family: 'minimalist', name: 'Elegant', variant: 2 },
		'minimalist-3': { family: 'minimalist', name: 'Fresh', variant: 3 },
		'neubrutalism-1': { family: 'neubrutalism', name: 'Romantic Warm', variant: 1 },
		'neubrutalism-2': { family: 'neubrutalism', name: 'Elegant', variant: 2 },
		'neubrutalism-3': { family: 'neubrutalism', name: 'Fresh', variant: 3 },
		'playful-1': { family: 'playful', name: 'Romantic Warm', variant: 1 },
		'playful-2': { family: 'playful', name: 'Elegant', variant: 2 },
		'playful-3': { family: 'playful', name: 'Fresh', variant: 3 },
		'3d-design-1': { family: '3d-design', name: 'Romantic Warm', variant: 1 },
		'3d-design-2': { family: '3d-design', name: 'Elegant', variant: 2 },
		'3d-design-3': { family: '3d-design', name: 'Fresh', variant: 3 },
		nocturne: { family: 'nocturne', name: 'Nocturne', variant: 1 },
		'puspa-parahyangan': { family: 'sunda', name: 'Puspa Parahyangan', variant: 1 },
		'pinto-aceh': { family: 'aceh', name: 'Pinto Aceh', variant: 1 },
		'kawung-jawa': { family: 'jawa', name: 'Kawung Jawa', variant: 1 },
		'gorga-batak': { family: 'batak', name: 'Gorga Batak', variant: 1 },
		'lipa-sabbe-bugis': { family: 'bugis', name: 'Lipa Sabbe Bugis', variant: 1 },
		'gigi-balang-betawi': { family: 'betawi', name: 'Gigi Balang Betawi', variant: 1 },
		'gonjong-minang': { family: 'minang', name: 'Gonjong Minang', variant: 1 },
		'tongkonan-toraja': { family: 'toraja', name: 'Tongkonan Toraja', variant: 1 }
	};
	const regionalOrnaments: Partial<Record<WeddingThemeKey, string>> = {
		'pinto-aceh': '/images/themes/pinto-aceh-ornament.svg',
		'kawung-jawa': '/images/themes/kawung-jawa-ornament.svg',
		'gorga-batak': '/images/themes/gorga-batak-ornament.svg',
		'lipa-sabbe-bugis': '/images/themes/lipa-sabbe-bugis-ornament.svg',
		'gigi-balang-betawi': '/images/themes/gigi-balang-betawi-ornament.svg',
		'gonjong-minang': '/images/themes/gonjong-minang-ornament.svg',
		'tongkonan-toraja': '/images/themes/tongkonan-toraja-ornament.svg'
	};

	let { wedding, theme }: Props = $props();
	const profile = $derived(themeProfiles[theme]);
	const colors = $derived(WEDDING_THEME_COLORS[theme]);
	const regionalOrnament = $derived(regionalOrnaments[theme]);
	const isRegional = $derived(Boolean(regionalOrnament));
	const groomName = $derived(formatPersonName(wedding.groom_name) || 'Mempelai Pria');
	const brideName = $derived(formatPersonName(wedding.bride_name) || 'Mempelai Wanita');
	const coupleName = $derived(groomName + ' & ' + brideName);
	const akad = $derived(formatEventDate(wedding.akad));
	const reception = $derived(formatEventDate(wedding.reception));
	const mapsURL = $derived(safeExternalURL(wedding.maps));
	const countdownTarget = $derived(wedding.akad || wedding.reception || '');
	const rsvpToken = $derived(page.url.searchParams.get('rsvp')?.trim() ?? '');
	let countdown = $state(calculateCountdown(untrack(() => countdownTarget)));
	const scrollLock: { release?: () => void } = {};
	const themeAnimations: { controller?: WeddingThemeAnimationController } = {};
	let musicPlayer = $state<HTMLAudioElement>();
	let isMusicPlaying = $state(false);
	let isInvitationOpened = $state(false);

	async function playMusic(): Promise<void> {
		if (!musicPlayer || !wedding.music_url) return;

		try {
			await musicPlayer.play();
		} catch {
			isMusicPlaying = false;
		}
	}

	function toggleMusic(): void {
		if (!musicPlayer) return;

		if (musicPlayer.paused) {
			void playMusic();
			return;
		}

		musicPlayer.pause();
	}

	function openInvitation(): void {
		isInvitationOpened = true;
		void playMusic();

		const release = scrollLock.release;
		delete scrollLock.release;
		release?.();

		const content = document.querySelector<HTMLElement>('.theme-canvas .couple-section');
		if (!content) return;

		const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches
			? 'auto'
			: 'smooth';
		window.requestAnimationFrame(() => {
			themeAnimations.controller?.refresh();
			window.requestAnimationFrame(() => {
				const top = window.scrollY + content.getBoundingClientRect().top;
				window.scrollTo({ top, left: 0, behavior });
			});
		});
	}

	onMount(() => {
		const root = document.documentElement;
		const body = document.body;
		const previousScrollRestoration = window.history.scrollRestoration;
		const previousRootOverflow = root.style.overflow;
		const previousBodyOverflow = body.style.overflow;
		const resetNativeScroll = () => window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
		const releaseScrollLock = () => {
			root.style.overflow = previousRootOverflow;
			body.style.overflow = previousBodyOverflow;
		};

		window.history.scrollRestoration = 'manual';
		resetNativeScroll();
		root.style.overflow = 'hidden';
		body.style.overflow = 'hidden';
		scrollLock.release = releaseScrollLock;

		const animationController = mountWeddingThemeAnimations('.theme-canvas', theme);
		themeAnimations.controller = animationController;
		animationController.scrollToTop();
		const scrollResetFrame = window.requestAnimationFrame(() => {
			resetNativeScroll();
			animationController.scrollToTop();
		});
		const timer = countdownTarget
			? window.setInterval(() => {
					countdown = calculateCountdown(countdownTarget);
				}, 1_000)
			: undefined;

		return () => {
			musicPlayer?.pause();
			window.cancelAnimationFrame(scrollResetFrame);
			window.history.scrollRestoration = previousScrollRestoration;
			if (timer !== undefined) window.clearInterval(timer);
			animationController.destroy();
			if (themeAnimations.controller === animationController) {
				delete themeAnimations.controller;
			}
			if (scrollLock.release === releaseScrollLock) {
				delete scrollLock.release;
				releaseScrollLock();
			}
		};
	});
	let galleryDialog = $state<HTMLDialogElement>();
	let galleryPreviewImage = $state<HTMLImageElement>();
	let galleryIsClosing = false;
	let galleryPreviewRequest = 0;
	let galleryPreviewIndex = 0;

	function showGalleryImage(index: number) {
		if (galleryIsClosing || wedding.gallery.length === 0) return;

		const normalizedIndex =
			((index % wedding.gallery.length) + wedding.gallery.length) % wedding.gallery.length;
		const image = wedding.gallery[normalizedIndex];
		if (!image) return;

		galleryPreviewIndex = normalizedIndex;
		void openGalleryPreview(image.url, 'Galeri pernikahan ' + (normalizedIndex + 1));
	}

	async function openGalleryPreview(imageUrl: string, alt: string) {
		if (!galleryPreviewImage || !galleryDialog) return;

		const requestId = ++galleryPreviewRequest;
		const pendingImage = new Image();
		pendingImage.src = imageUrl;

		try {
			await pendingImage.decode();
		} catch {
			await new Promise<void>((resolve) => {
				if (pendingImage.complete) {
					resolve();
					return;
				}

				pendingImage.onload = () => resolve();
				pendingImage.onerror = () => resolve();
			});
		}

		if (requestId !== galleryPreviewRequest || !galleryPreviewImage || !galleryDialog) return;

		galleryPreviewImage.getAnimations().forEach((animation) => animation.cancel());
		galleryPreviewImage.src = imageUrl;
		galleryPreviewImage.alt = alt;
		galleryIsClosing = false;
		if (!galleryDialog.open) galleryDialog.showModal();

		if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
			galleryPreviewImage.animate(
				[
					{ opacity: 0, transform: 'translateY(1rem) scale(0.94)' },
					{ opacity: 1, transform: 'translateY(0) scale(1)' }
				],
				{ duration: 280, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'both' }
			);
		}
	}

	function closeGalleryPreview() {
		if (!galleryDialog || !galleryPreviewImage || !galleryDialog.open || galleryIsClosing) return;

		galleryPreviewRequest += 1;
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
			galleryDialog.close();
			galleryPreviewImage.removeAttribute('src');
			return;
		}

		galleryIsClosing = true;
		const animation = galleryPreviewImage.animate(
			[
				{ opacity: 1, transform: 'translateY(0) scale(1)' },
				{ opacity: 0, transform: 'translateY(0.75rem) scale(0.96)' }
			],
			{ duration: 180, easing: 'cubic-bezier(0.4, 0, 1, 1)', fill: 'forwards' }
		);

		void animation.finished
			.catch(() => undefined)
			.then(() => {
				galleryDialog?.close();
				galleryPreviewImage?.removeAttribute('src');
				galleryIsClosing = false;
			});
	}

	function closeGalleryPreviewFromKeyboard(event: Event) {
		event.preventDefault();
		closeGalleryPreview();
	}

	function navigateGalleryPreviewFromKeyboard(event: KeyboardEvent) {
		if (event.key === 'ArrowLeft') {
			event.preventDefault();
			showGalleryImage(galleryPreviewIndex - 1);
		} else if (event.key === 'ArrowRight') {
			event.preventDefault();
			showGalleryImage(galleryPreviewIndex + 1);
		}
	}

	function closeGalleryPreviewFromBackdrop(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			closeGalleryPreview();
		}
	}
</script>

<div class="theme-scroll-wrapper">
	<main
		class="theme-canvas family-{profile.family} variant-{profile.variant}"
		class:regional-theme={isRegional}
		style={'--color-background:' +
			colors.background +
			';--color-surface:' +
			colors.surface +
			';--color-text:' +
			colors.text +
			';--color-primary:' +
			colors.primary +
			';--color-accent:' +
			colors.accent}
	>
		<section class="hero section-shell">
			<div class="cover-frame">
				{#if wedding.cover_url}
					<img
						src={wedding.cover_url}
						alt={'Cover pernikahan ' + coupleName}
						decoding="async"
						fetchpriority="high"
					/>
				{:else}
					<div class="cover-placeholder">
						<span>{groomName.charAt(0)}</span><b>♥</b><span>{brideName.charAt(0)}</span>
					</div>
				{/if}
			</div>
			<div class="decoration decoration-one"></div>
			<div class="decoration decoration-two"></div>
			<div class="hero-grid">
				<div class="hero-copy" data-hero-content>
					{#if regionalOrnament}
						<img class="regional-ornament" src={regionalOrnament} alt="" />
					{/if}
					{#if theme === 'puspa-parahyangan'}
						<img
							class="sunda-ornament"
							src="/images/themes/puspa-parahyangan-ornament.svg"
							alt=""
						/>
					{/if}
					<p class="eyebrow">Kepada Bapak/Ibu/Saudara/i,</p>
					<h1 data-name-layout="stacked" aria-label={coupleName} {@attach fitCoupleHeading}>
						<span class="hero-name">{groomName}</span><span class="hero-ampersand">&</span><span
							class="hero-name">{brideName}</span
						>
					</h1>
					<p class="hero-intro">Akan melangsungkan resepsi pernikahan dalam:</p>
					{#if countdownTarget}
						<div class="hero-countdown" role="timer" aria-label="Hitung mundur hari pernikahan">
							{#each [[{ label: 'Hari', value: countdown.days }, { label: 'Jam', value: countdown.hours }], [{ label: 'Menit', value: countdown.minutes }, { label: 'Detik', value: countdown.seconds }]] as pair (pair[0].label)}
								<div class="countdown-pair">
									{#each pair as item (item.label)}
										<div class="countdown-card">
											<strong>{String(item.value).padStart(2, '0')}</strong><span>{item.label}</span
											>
										</div>
									{/each}
								</div>
							{/each}
						</div>
					{/if}
					<button type="button" class="primary-button" onclick={openInvitation}
						>Buka Undangan</button
					>
				</div>
			</div>
		</section>

		<section class="couple-section section-shell">
			<div class="content-width">
				<header class="section-heading" data-reveal>
					<p class="eyebrow">Mempelai</p>
					<h2>Dua insan, satu cerita</h2>
				</header>
				<div class="couple-grid">
					{#each [{ name: groomName, photo: wedding.groom_photo_url, label: 'Putra dari', father: wedding.groom_father_name, mother: wedding.groom_mother_name }, { name: brideName, photo: wedding.bride_photo_url, label: 'Putri dari', father: wedding.bride_father_name, mother: wedding.bride_mother_name }] as person (person.name)}
						<article class="person-card" data-reveal>
							{#if person.photo}<img
									src={person.photo}
									alt={person.name}
									loading="lazy"
									decoding="async"
								/>{:else}<div class="person-placeholder">
									{person.name.charAt(0)}
								</div>{/if}
							<h3>{person.name}</h3>
							{#if person.father || person.mother}<p>
									{person.label}<br /><b>{formatPersonName(person.father) || '-'}</b> &
									<b>{formatPersonName(person.mother) || '-'}</b>
								</p>{/if}
						</article>
					{/each}
				</div>
			</div>
		</section>

		<section id="acara" class="event-section section-shell">
			<div class="content-width">
				<header class="section-heading" data-reveal>
					<p class="eyebrow">Hari Bahagia</p>
					<h2>Waktu & tempat</h2>
				</header>
				<div class="event-grid">
					{#each [{ title: 'Akad Nikah', schedule: akad }, { title: 'Resepsi', schedule: reception }] as event (event.title)}
						<article class="event-card" data-reveal>
							<p class="eyebrow">{event.title}</p>
							<h3>{event.schedule.date}</h3>
							<strong>{event.schedule.time}</strong>{#if wedding.address}<div class="divider"></div>
								<p>{wedding.address}</p>{/if}
						</article>
					{/each}
				</div>
				{#if mapsURL}<div class="center-action">
						<a href={mapsURL} target="_blank" rel="noreferrer" class="primary-button"
							>Buka Google Maps →</a
						>
					</div>{/if}
			</div>
		</section>

		<section class="quote-section section-shell">
			<div
				class="narrow-content"
				data-reveal={theme === 'nocturne' || theme === 'puspa-parahyangan' || isRegional
					? undefined
					: ''}
			>
				<blockquote>
					<span class="quote-text"
						>“{wedding.quote || 'Dua hati, satu perjalanan, dan satu janji untuk selamanya.'}”</span
					>
				</blockquote>
			</div>
		</section>

		{#if wedding.stories.length > 0}
			<section class="story-section section-shell">
				<div class="narrow-content">
					<header class="section-heading" data-reveal>
						<h2>Our Love Story</h2>
					</header>
					<div class="story-list">
						{#each wedding.stories as story, index (story.id)}
							<article class="story-card" data-reveal>
								<span class="story-marker" aria-hidden="true"
									>{String(index + 1).padStart(2, '0')}</span
								>
								<div class="story-panel">
									{#if story.image_url}
										<img
											class="story-image"
											src={story.image_url}
											alt={'Gambar ' + (story.title || 'cerita ' + (index + 1))}
											loading="lazy"
											decoding="async"
										/>
									{/if}
									<div class="story-copy">
										<div class="story-meta">
											{#if story.date}<time datetime={story.date}
													>{formatStoryDate(story.date)}</time
												>{/if}
										</div>
										<h3>{story.title || 'Cerita ' + (index + 1)}</h3>
										{#if story.content}<p>{story.content}</p>{/if}
									</div>
								</div>
							</article>
						{/each}
					</div>
				</div>
			</section>
		{/if}

		{#if wedding.gallery.length > 0}
			<section class="gallery-section section-shell">
				<div class="content-width">
					<header class="section-heading" data-reveal>
						<p class="eyebrow">Momen Berharga</p>
						<h2>Galeri kami</h2>
					</header>
					<div class="gallery-grid">
						{#each wedding.gallery as image, index (image.name)}<figure data-gallery-item>
								<button
									type="button"
									class="gallery-trigger"
									aria-label={'Perbesar foto galeri ' + (index + 1)}
									onclick={() => showGalleryImage(index)}
								>
									<img
										src={image.url}
										alt={'Galeri pernikahan ' + (index + 1)}
										loading="lazy"
										decoding="async"
									/>
								</button>
							</figure>{/each}
					</div>
				</div>
			</section>
			<dialog
				bind:this={galleryDialog}
				class="gallery-lightbox"
				aria-label="Preview foto galeri"
				onclick={closeGalleryPreviewFromBackdrop}
				oncancel={closeGalleryPreviewFromKeyboard}
				onkeydown={navigateGalleryPreviewFromKeyboard}
			>
				<button
					type="button"
					class="gallery-lightbox-close"
					aria-label="Tutup preview"
					onclick={closeGalleryPreview}
				>
					<svg viewBox="0 0 24 24" aria-hidden="true">
						<path d="M6 6l12 12M18 6 6 18" />
					</svg>
				</button>
				<button
					type="button"
					class="gallery-lightbox-nav gallery-lightbox-prev"
					aria-label="Foto sebelumnya"
					disabled={wedding.gallery.length < 2}
					onclick={() => showGalleryImage(galleryPreviewIndex - 1)}
				>
					<svg viewBox="0 0 24 24" aria-hidden="true">
						<path d="m15 18-6-6 6-6" />
					</svg>
				</button>
				<img bind:this={galleryPreviewImage} alt="" />
				<button
					type="button"
					class="gallery-lightbox-nav gallery-lightbox-next"
					aria-label="Foto berikutnya"
					disabled={wedding.gallery.length < 2}
					onclick={() => showGalleryImage(galleryPreviewIndex + 1)}
				>
					<svg viewBox="0 0 24 24" aria-hidden="true">
						<path d="m9 18 6-6-6-6" />
					</svg>
				</button>
			</dialog>
		{/if}

		{#if wedding.gift_enabled && (wedding.groom_payment_number || wedding.bride_payment_number)}
			<section class="gift-section section-shell">
				<div class="narrow-content">
					<header class="section-heading" data-reveal>
						<p class="eyebrow">Tanda Kasih</p>
						<h2>Kado pernikahan</h2>
						<p>Kehadiran dan doa Anda adalah hadiah terbaik bagi kami.</p>
					</header>
					<div class="gift-grid">
						{#if wedding.groom_payment_number}<article data-reveal>
								<small>Untuk {groomName}</small><span class="gift-provider"
									>{wedding.groom_payment_provider || 'Rekening / e-wallet'}</span
								><strong>{wedding.groom_payment_number}</strong>
								{#if wedding.groom_payment_account_name}<small
										>Atas nama {wedding.groom_payment_account_name}</small
									>{/if}
							</article>{/if}{#if wedding.bride_payment_number}<article data-reveal>
								<small>Untuk {brideName}</small><span class="gift-provider"
									>{wedding.bride_payment_provider || 'Rekening / e-wallet'}</span
								><strong>{wedding.bride_payment_number}</strong>
								{#if wedding.bride_payment_account_name}<small
										>Atas nama {wedding.bride_payment_account_name}</small
									>{/if}
							</article>{/if}
					</div>
				</div>
			</section>
		{/if}

		{#if isRegional}
			<div class="regional-rsvp">
				<PublicRsvpForm slug={wedding.slug} token={rsvpToken} />
			</div>
		{:else}
			<PublicRsvpForm slug={wedding.slug} token={rsvpToken} />
		{/if}

		<footer class="closing-section section-shell">
			<div class="cover-frame" aria-hidden="true">
				{#if wedding.cover_url}
					<img src={wedding.cover_url} alt="" loading="lazy" decoding="async" />
				{:else}
					<div class="cover-placeholder">
						<span>{groomName.charAt(0)}</span><b>♥</b><span>{brideName.charAt(0)}</span>
					</div>
				{/if}
			</div>
			<div class="narrow-content">
				<p>Terima kasih atas doa dan kehadiran Anda</p>
				<h2>{coupleName}</h2>
				<small>Dibuat dengan Wedez</small>
			</div>
		</footer>
	</main>
</div>

{#if wedding.music_url}
	<audio
		bind:this={musicPlayer}
		src={wedding.music_url}
		loop
		preload="metadata"
		onplay={() => (isMusicPlaying = true)}
		onpause={() => (isMusicPlaying = false)}
	></audio>
	{#if isInvitationOpened}
		<button
			type="button"
			class="music-control"
			style={'--music-control-surface:' +
				colors.surface +
				';--music-control-text:' +
				colors.text +
				';--music-control-primary:' +
				colors.primary}
			aria-label={isMusicPlaying ? 'Jeda musik undangan' : 'Putar musik undangan'}
			title={isMusicPlaying ? 'Jeda musik' : 'Putar musik'}
			onclick={toggleMusic}
		>
			{#if isMusicPlaying}
				<svg viewBox="0 0 24 24" aria-hidden="true">
					<path d="M9 5v14M15 5v14" />
				</svg>
			{:else}
				<svg class="play-icon" viewBox="0 0 24 24" aria-hidden="true">
					<path d="m8 5 11 7-11 7V5Z" />
				</svg>
			{/if}
		</button>
	{/if}
{/if}

<style>
	.theme-scroll-wrapper {
		min-height: 100vh;
		overflow: hidden;
	}
	.theme-canvas {
		--color-muted: color-mix(in srgb, var(--color-text) 68%, var(--color-background));
		min-height: 100vh;
		overflow: hidden;
		background: var(--color-background);
		color: var(--color-text);
		font-family: 'Avenir Next', Avenir, sans-serif;
	}
	.music-control {
		position: fixed;
		z-index: 20;
		right: max(1.5rem, env(safe-area-inset-right));
		bottom: max(1.5rem, calc(env(safe-area-inset-bottom) + 1rem));
		display: grid;
		width: 3.25rem;
		height: 3.25rem;
		place-items: center;
		border: 2px solid var(--music-control-text);
		border-radius: 999px;
		background: color-mix(in srgb, var(--music-control-surface) 92%, transparent);
		box-shadow: 0 0.65rem 1.8rem color-mix(in srgb, var(--music-control-text) 20%, transparent);
		color: var(--music-control-text);
		backdrop-filter: blur(0.5rem);
		cursor: pointer;
		transition:
			transform 180ms ease,
			box-shadow 180ms ease;
	}
	.music-control:hover {
		transform: translateY(-0.15rem);
		box-shadow: 0 0.85rem 2rem color-mix(in srgb, var(--music-control-text) 26%, transparent);
	}
	.music-control:focus-visible {
		outline: 3px solid var(--music-control-primary);
		outline-offset: 3px;
	}
	.music-control svg {
		width: 1.25rem;
		height: 1.25rem;
		fill: none;
		stroke: currentColor;
		stroke-linecap: round;
		stroke-linejoin: round;
		stroke-width: 2.25;
	}
	.music-control .play-icon {
		margin-left: 0.12rem;
		fill: currentColor;
		stroke: none;
	}
	.section-shell {
		position: relative;
		padding: 6rem 1.25rem;
	}
	.quote-section {
		display: flex;
		box-sizing: border-box;
		align-items: center;
		justify-content: center;
		padding-block: 60px;
		text-align: center;
	}
	.quote-section > .narrow-content {
		display: flex;
		width: 100%;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		margin-inline: auto;
	}
	.content-width {
		width: 100%;
		max-width: 70rem;
		margin-inline: auto;
	}
	.narrow-content {
		width: 100%;
		max-width: 50rem;
		margin-inline: auto;
		text-align: center;
	}
	.eyebrow {
		font-size: 0.72rem;
		font-weight: 900;
		letter-spacing: 0.2em;
		text-transform: uppercase;
	}
	.hero {
		display: grid;
		min-height: 100svh;
		place-items: center;
		background: var(--color-background);
	}
	.hero-grid {
		position: relative;
		z-index: 1;
		display: grid;
		width: 100%;
		max-width: 70rem;
		align-items: center;
		gap: 4rem;
	}
	.hero-copy {
		text-align: center;
	}
	.hero-copy h1 {
		margin-top: 2rem;
		font-size: clamp(3.5rem, 9vw, 7.5rem);
		line-height: 0.88;
		font-weight: 900;
		letter-spacing: -0.065em;
	}
	.hero-copy h1 .hero-ampersand {
		display: block;
		margin-block: 0.5rem;
		color: var(--color-primary);
		font-size: 0.6em;
	}
	.primary-button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		margin-top: 2rem;
		border: 2px solid var(--color-text);
		border-radius: 999px;
		background: color-mix(in srgb, var(--color-primary) 60%, var(--color-text));
		padding: 0.85rem 1.4rem;
		color: var(--color-surface);
		font-family: inherit;
		font-size: 0.85rem;
		font-weight: 900;
		line-height: normal;
		text-decoration: none;
		cursor: pointer;
	}
	.cover-frame {
		position: relative;
		margin-inline: auto;
		width: 100%;
		max-width: 27rem;
		border: 2px solid var(--color-text);
		background: var(--color-surface);
		padding: 0.65rem;
	}
	.cover-frame img,
	.cover-placeholder {
		width: 100%;
		aspect-ratio: 4/5;
		object-fit: cover;
	}
	.cover-placeholder {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		background: var(--color-accent);
		font-size: 4rem;
		font-weight: 900;
	}
	.cover-placeholder b {
		color: var(--color-primary);
	}
	.decoration {
		position: absolute;
		width: 7rem;
		aspect-ratio: 1;
		background: var(--color-accent);
	}
	.decoration-one {
		top: 8%;
		left: -2rem;
	}
	.decoration-two {
		right: -3rem;
		bottom: 8%;
		background: var(--color-primary);
	}
	.theme-canvas > section:nth-of-type(even) {
		background: color-mix(in srgb, var(--color-background) 84%, var(--color-accent));
	}
	.hero-countdown {
		--countdown-size: clamp(4.5rem, 12vw, 6.3rem);
		--countdown-gap: clamp(0.75rem, 1.5vw, 1rem);
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		width: min(100%, 36rem);
		margin: clamp(1.25rem, 3vh, 2rem) auto 0;
		gap: max(1rem, var(--countdown-gap)) var(--countdown-gap);
	}
	.countdown-pair {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		flex: 0 1 calc(2 * var(--countdown-size) + var(--countdown-gap));
		min-width: 0;
		gap: var(--countdown-gap);
	}
	.hero-countdown .countdown-card {
		border-color: #ff0a84;
		background: #ff0a84;
		color: #fff;
	}
	.countdown-card,
	.event-card,
	.person-card,
	.gift-grid article {
		border: 2px solid var(--color-text);
		background: var(--color-surface);
		padding: 1.5rem;
	}
	.countdown-card strong {
		display: block;
		font-size: clamp(2.25rem, 6vw, 4rem);
		line-height: 1;
	}
	.countdown-card span {
		display: block;
		margin-top: 0.5rem;
		font-size: 0.7rem;
		font-weight: 900;
		text-transform: uppercase;
	}
	blockquote {
		width: min(100%, 50rem);
		margin: 0;
		font-family: Georgia, serif;
		font-size: clamp(1rem, 2.5vw, 1.875rem);
		line-height: 1.15;
		font-weight: 700;
	}
	.quote-text {
		display: block;
	}
	.section-heading > p:last-child {
		margin-top: 1.5rem;
		color: var(--color-muted);
		line-height: 1.8;
	}
	.section-heading {
		text-align: center;
	}
	.section-heading h2 {
		margin-top: 1rem;
		font-size: clamp(2.75rem, 7vw, 5rem);
		line-height: 0.95;
		font-weight: 900;
		letter-spacing: -0.05em;
	}
	.couple-grid,
	.event-grid,
	.gift-grid {
		display: grid;
		gap: 2rem;
		margin-top: 3.5rem;
	}
	.couple-grid {
		grid-template-columns: minmax(0, 1fr);
		align-items: center;
	}
	.couple-grid::after {
		display: grid;
		grid-row: 2;
		place-items: center;
		align-self: center;
		justify-self: center;
		margin-block: 5px;
		color: var(--color-text);
		font-family: 'Iowan Old Style', Georgia, serif;
		font-size: clamp(4rem, 10vw, 7.5rem);
		font-weight: 500;
		line-height: 1;
		content: '&';
		filter: drop-shadow(0 0.2rem 0.35rem color-mix(in srgb, var(--color-text) 18%, transparent));
	}
	.couple-grid .person-card:first-child {
		grid-row: 1;
	}
	.couple-grid .person-card:last-child {
		grid-row: 3;
	}
	.person-card {
		text-align: center;
	}
	.person-card img,
	.person-placeholder {
		display: block;
		width: 50%;
		aspect-ratio: 1;
		margin-inline: auto;
		object-fit: cover;
	}
	.person-placeholder {
		display: grid;
		place-items: center;
		background: var(--color-primary);
		font-size: 6rem;
		font-weight: 900;
	}
	.person-card h3 {
		margin-top: 1.5rem;
		font-size: 2rem;
		font-weight: 900;
	}
	.person-card p,
	.event-card p,
	.story-card p {
		margin-top: 0.75rem;
		color: var(--color-muted);
		line-height: 1.7;
	}
	.event-card {
		text-align: center;
	}
	.event-card h3 {
		margin-top: 1.5rem;
		font-size: 1.8rem;
		font-weight: 900;
	}
	.event-card strong {
		display: block;
		margin-top: 0.75rem;
	}
	.divider {
		width: 4rem;
		height: 2px;
		margin: 1.5rem auto;
		background: var(--color-accent);
	}
	.center-action {
		text-align: center;
	}
	.story-list {
		position: relative;
		display: grid;
		gap: 2.5rem;
		margin-top: 3.5rem;
		text-align: left;
	}
	.story-list::before {
		position: absolute;
		top: 0;
		bottom: 0;
		left: 1rem;
		width: 2px;
		background: var(--color-accent);
		content: '';
		opacity: 0.45;
		translate: -50% 0;
	}
	.story-card {
		position: relative;
		display: grid;
		grid-template-columns: 2rem minmax(0, 1fr);
		align-items: start;
		gap: 1rem;
	}
	.story-marker {
		z-index: 1;
		display: grid;
		width: 2rem;
		aspect-ratio: 1;
		place-items: center;
		border: 0;
		border-radius: 999px;
		background: color-mix(in srgb, var(--color-primary) 60%, var(--color-text));
		box-shadow: 0 0.3rem 0.8rem color-mix(in srgb, var(--color-text) 16%, transparent);
		color: var(--color-surface);
		font-size: 0.65rem;
		font-weight: 900;
	}
	.story-panel {
		overflow: hidden;
		border: 0;
		background: var(--color-surface);
	}
	.story-image {
		display: block;
		width: 100%;
		aspect-ratio: 16/10;
		object-fit: cover;
	}
	.story-copy {
		padding: 1.5rem;
	}
	.story-meta {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.65rem;
		margin-bottom: 0.9rem;
	}
	.story-meta time,
	.gift-grid small {
		font-size: 0.68rem;
		font-weight: 900;
		letter-spacing: 0.12em;
		text-transform: uppercase;
	}
	.story-meta time {
		color: var(--color-muted);
	}
	.story-card h3 {
		font-size: 1.6rem;
		line-height: 1.1;
		font-weight: 900;
	}
	.gallery-grid {
		column-width: clamp(9.5rem, 26vw, 17rem);
		column-gap: 1rem;
		margin-top: 3.5rem;
	}
	.gallery-grid figure {
		width: 100%;
		margin: 0 0 1rem;
		break-inside: avoid;
		border: 2px solid var(--color-text);
		background: transparent;
		padding: 0;
	}
	.gallery-grid img {
		display: block;
		width: 100%;
		height: auto;
		object-fit: cover;
	}
	.gallery-trigger {
		display: block;
		width: 100%;
		border: 0;
		background: transparent;
		padding: 0;
		color: inherit;
		cursor: zoom-in;
	}
	.gallery-trigger:focus-visible {
		outline: 3px solid var(--color-accent);
		outline-offset: 4px;
	}
	.gallery-lightbox {
		position: fixed;
		inset: 0;
		display: none;
		place-items: center;
		width: 100vw;
		height: 100svh;
		max-width: none;
		max-height: none;
		margin: 0;
		border: 0;
		background: transparent;
		padding: clamp(1rem, 4vw, 3rem);
		overflow: visible;
	}
	.gallery-lightbox[open] {
		display: grid;
	}
	.gallery-lightbox::backdrop {
		background: color-mix(in srgb, #000 86%, transparent);
		backdrop-filter: blur(0.45rem);
	}
	.gallery-lightbox[open]::backdrop {
		animation: gallery-backdrop-in 220ms ease-out both;
	}
	.gallery-lightbox img {
		display: block;
		width: auto;
		max-width: min(86vw, 64rem);
		height: auto;
		max-height: 72svh;
		border-radius: 0.5rem;
		object-fit: contain;
		box-shadow: 0 1.5rem 5rem rgb(0 0 0 / 45%);
	}
	.gallery-lightbox-close {
		position: fixed;
		z-index: 2;
		top: max(1rem, env(safe-area-inset-top));
		right: max(1rem, env(safe-area-inset-right));
		display: grid;
		width: 2.75rem;
		height: 2.75rem;
		place-items: center;
		border: 0;
		background: transparent;
		padding: 0;
		color: #fff;
		cursor: pointer;
	}
	.gallery-lightbox-nav {
		position: fixed;
		z-index: 2;
		top: 50%;
		display: grid;
		width: 3rem;
		height: 3rem;
		place-items: center;
		translate: 0 -50%;
		border: 0;
		background: transparent;
		padding: 0;
		color: #fff;
		cursor: pointer;
	}
	.gallery-lightbox-prev {
		left: max(1rem, env(safe-area-inset-left));
	}
	.gallery-lightbox-next {
		right: max(1rem, env(safe-area-inset-right));
	}
	.gallery-lightbox-close svg {
		width: 2rem;
		height: 2rem;
		fill: none;
		stroke: currentColor;
		stroke-width: 2.25;
		stroke-linecap: round;
		stroke-linejoin: round;
	}
	.gallery-lightbox-nav svg {
		width: 2.5rem;
		height: 2.5rem;
		fill: none;
		stroke: currentColor;
		stroke-width: 2.25;
		stroke-linecap: round;
		stroke-linejoin: round;
	}
	.gallery-lightbox-nav:disabled {
		opacity: 0;
		pointer-events: none;
	}
	.gallery-lightbox-close:focus-visible,
	.gallery-lightbox-nav:focus-visible {
		outline: 2px solid #fff;
		outline-offset: 3px;
	}
	@media (min-width: 64rem) {
		.gallery-lightbox-prev {
			left: clamp(3rem, 10vw, 8rem);
		}
		.gallery-lightbox-next {
			right: clamp(3rem, 10vw, 8rem);
		}
	}
	@keyframes gallery-backdrop-in {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
	.gift-grid article {
		text-align: left;
	}
	.gift-provider {
		display: block;
		margin-top: 1rem;
		font-weight: 900;
	}
	.gift-grid strong {
		display: block;
		margin-top: 0.35rem;
		overflow-wrap: anywhere;
		font-size: 1.3rem;
	}
	.closing-section {
		display: grid;
		min-height: 60svh;
		place-items: center;
		isolation: isolate;
		overflow: hidden;
		background: var(--color-background);
		color: var(--color-surface);
	}
	.closing-section .narrow-content {
		z-index: 2;
		display: grid;
		place-items: center;
	}
	.closing-section p {
		font-size: clamp(2.25rem, 6vw, 4.5rem);
		line-height: 1;
		font-weight: 900;
	}
	.closing-section h2 {
		margin-top: 2rem;
		color: var(--color-primary);
		font-size: 2rem;
		font-weight: 900;
	}
	.closing-section small {
		position: absolute;
		right: 1.25rem;
		bottom: 2rem;
		left: 1.25rem;
		display: block;
		color: color-mix(in srgb, var(--color-surface) 68%, var(--color-text));
		font-weight: 700;
		text-align: center;
	}

	.family-minimalist .countdown-card,
	.family-minimalist .event-card,
	.family-minimalist .story-panel,
	.family-minimalist .gift-grid article,
	.family-minimalist .gallery-grid figure {
		border: 0;
		border-radius: 0.25rem;
		box-shadow: 0 0.75rem 2rem color-mix(in srgb, var(--color-text) 8%, transparent);
	}
	.family-minimalist .hero-copy h1,
	.family-minimalist .section-heading h2,
	.family-minimalist blockquote {
		font-family: 'Iowan Old Style', Georgia, serif;
		font-weight: 500;
	}
	.family-minimalist .decoration {
		border-radius: 999px;
		opacity: 0.45;
		filter: blur(1px);
	}
	.family-minimalist .cover-frame,
	.family-minimalist .person-card {
		border-radius: 1.75rem;
	}
	.family-minimalist .cover-frame img {
		border-radius: 1.25rem;
	}
	.family-minimalist .person-card img,
	.family-minimalist .person-placeholder {
		border: 0;
		border-radius: 1.25rem;
		box-shadow: 0 1rem 2.5rem color-mix(in srgb, var(--color-text) 12%, transparent);
	}
	.family-minimalist.variant-2 .cover-frame,
	.family-minimalist.variant-2 .person-card {
		border-radius: 0;
	}
	.family-minimalist.variant-2 .cover-frame img,
	.family-minimalist.variant-2 .person-card img,
	.family-minimalist.variant-2 .person-placeholder {
		border-radius: 0;
		filter: grayscale(1);
	}
	.family-minimalist.variant-3 .cover-frame,
	.family-minimalist.variant-3 .person-card {
		border-radius: 48% 48% 2rem 2rem;
	}
	.family-minimalist.variant-3 .person-card img,
	.family-minimalist.variant-3 .person-placeholder {
		border-radius: 50%;
	}

	.family-neubrutalism {
		font-family: Impact, Haettenschweiler, 'Arial Narrow Bold', sans-serif;
	}
	.family-neubrutalism > section:nth-of-type(even) {
		background: var(--color-accent);
	}
	.family-neubrutalism .cover-frame,
	.family-neubrutalism .countdown-card,
	.family-neubrutalism .person-card,
	.family-neubrutalism .event-card,
	.family-neubrutalism .story-panel,
	.family-neubrutalism .gift-grid article,
	.family-neubrutalism .gallery-grid figure {
		border: 3px solid var(--color-text);
		box-shadow: 6px 6px 0 var(--color-text);
	}
	.family-neubrutalism .story-marker {
		border: 3px solid var(--color-text);
		border-radius: 0;
		box-shadow: 4px 4px 0 var(--color-text);
	}
	.family-neubrutalism .story-list::before {
		width: 3px;
		background: var(--color-text);
		opacity: 1;
	}
	.family-neubrutalism .primary-button {
		border: 3px solid var(--color-text);
		border-radius: 0;
		background: var(--color-primary);
		box-shadow: 6px 6px 0 var(--color-text);
		color: var(--color-text);
		text-transform: uppercase;
	}
	.family-neubrutalism.variant-2 .primary-button {
		color: var(--color-surface);
	}
	.family-neubrutalism .person-card img,
	.family-neubrutalism .person-placeholder {
		border: 3px solid var(--color-text);
		border-radius: 0;
		box-shadow: 7px 7px 0 var(--color-text);
	}
	.family-neubrutalism .person-card:nth-child(odd) img,
	.family-neubrutalism .person-card:nth-child(odd) .person-placeholder {
		rotate: -2deg;
	}
	.family-neubrutalism .person-card:nth-child(even) img,
	.family-neubrutalism .person-card:nth-child(even) .person-placeholder {
		rotate: 2deg;
	}
	.family-neubrutalism .hero-copy h1,
	.family-neubrutalism .section-heading h2 {
		text-transform: uppercase;
	}
	.family-neubrutalism .decoration {
		border: 3px solid var(--color-text);
		rotate: 12deg;
	}
	.family-neubrutalism.variant-2 .cover-frame,
	.family-neubrutalism.variant-2 .event-card {
		rotate: -1.5deg;
	}
	.family-neubrutalism.variant-3 .hero {
		background-image:
			linear-gradient(
				45deg,
				color-mix(in srgb, var(--color-text) 8%, transparent) 25%,
				transparent 25%
			),
			linear-gradient(
				-45deg,
				color-mix(in srgb, var(--color-text) 8%, transparent) 25%,
				transparent 25%
			);
		background-size: 28px 28px;
	}

	.family-playful {
		font-family: 'Trebuchet MS', 'Arial Rounded MT Bold', sans-serif;
	}
	.family-playful .cover-frame,
	.family-playful .countdown-card,
	.family-playful .person-card,
	.family-playful .event-card,
	.family-playful .story-panel,
	.family-playful .gift-grid article {
		border-radius: 2rem;
		box-shadow: 6px 6px 0 var(--color-accent);
	}
	.family-playful .gallery-grid figure {
		border: 0;
		border-radius: 0.75rem;
		box-shadow: 6px 6px 0 var(--color-accent);
	}
	.family-playful .story-marker {
		border-radius: 42% 58% 68% 32%;
		box-shadow: 4px 4px 0 var(--color-accent);
		rotate: -7deg;
	}
	.family-playful .cover-frame img,
	.family-playful .person-card img,
	.family-playful .person-placeholder {
		border-radius: 42% 58% 54% 46%;
	}
	.family-playful .gallery-grid img {
		border-radius: 0.75rem;
	}
	.family-playful .person-card img,
	.family-playful .person-placeholder {
		border: 3px solid var(--color-surface);
		box-shadow:
			7px 8px 0 var(--color-primary),
			12px 14px 0 var(--color-accent);
	}
	.family-playful .decoration {
		border-radius: 42% 58% 68% 32%;
	}
	.family-playful.variant-2 .hero {
		background-image: radial-gradient(
			color-mix(in srgb, var(--color-accent) 30%, transparent) 2px,
			transparent 2px
		);
		background-size: 24px 24px;
	}
	.family-playful.variant-3 .hero {
		background-image: linear-gradient(
			180deg,
			var(--color-background) 0 72%,
			var(--color-accent) 72%
		);
	}
	.family-playful.variant-3 .decoration-one {
		border-radius: 999px;
		background: var(--color-accent);
	}
	.family-playful.variant-3 .primary-button,
	.family-playful.variant-3 .story-marker {
		background: var(--color-primary);
		color: var(--color-text);
	}

	.family-3d-design {
		background-image:
			radial-gradient(
				circle at 15% 10%,
				color-mix(in srgb, var(--color-surface) 90%, transparent),
				transparent 24%
			),
			linear-gradient(
				145deg,
				var(--color-background),
				color-mix(in srgb, var(--color-background) 78%, var(--color-primary))
			);
		font-family: 'Avenir Next', Avenir, sans-serif;
	}
	.family-3d-design .hero {
		background-image:
			radial-gradient(
				circle at 82% 18%,
				color-mix(in srgb, var(--color-accent) 65%, transparent),
				transparent 22%
			),
			radial-gradient(
				circle at 12% 78%,
				color-mix(in srgb, var(--color-primary) 20%, transparent),
				transparent 28%
			),
			linear-gradient(145deg, var(--color-surface), var(--color-background));
		perspective: 75rem;
	}
	.family-3d-design .hero-copy h1,
	.family-3d-design .section-heading h2,
	.family-3d-design blockquote {
		letter-spacing: -0.055em;
		text-shadow:
			0.025em 0.025em 0 var(--color-surface),
			0.07em 0.07em 0 color-mix(in srgb, var(--color-primary) 20%, transparent);
	}
	.family-3d-design .hero-copy h1 .hero-ampersand {
		text-shadow:
			0.04em 0.04em 0 var(--color-surface),
			0.1em 0.1em 0 color-mix(in srgb, var(--color-accent) 75%, transparent);
	}
	.family-3d-design .decoration {
		border: 1px solid color-mix(in srgb, var(--color-surface) 80%, transparent);
		border-radius: 38% 62% 68% 32%;
		background: linear-gradient(145deg, var(--color-surface), var(--color-accent));
		box-shadow:
			inset -0.8rem -0.8rem 1.4rem color-mix(in srgb, var(--color-primary) 16%, transparent),
			0.8rem 1rem 2rem color-mix(in srgb, var(--color-text) 16%, transparent);
		rotate: 18deg;
	}
	.family-3d-design .decoration-two {
		border-radius: 999px;
		background: radial-gradient(
			circle at 30% 25%,
			var(--color-surface) 0 5%,
			color-mix(in srgb, var(--color-primary) 50%, var(--color-surface)) 23%,
			var(--color-primary) 58%,
			color-mix(in srgb, var(--color-primary) 55%, var(--color-text)) 100%
		);
		box-shadow:
			inset -1rem -1.1rem 1.6rem color-mix(in srgb, var(--color-text) 35%, transparent),
			1rem 1.3rem 2.4rem color-mix(in srgb, var(--color-text) 20%, transparent);
	}
	.family-3d-design .cover-frame {
		border: 1px solid color-mix(in srgb, var(--color-surface) 90%, transparent);
		border-radius: 2.25rem;
		box-shadow:
			-0.8rem 0.9rem 0 var(--color-accent),
			-1.5rem 1.8rem 0 color-mix(in srgb, var(--color-primary) 82%, transparent),
			0 2.8rem 4rem color-mix(in srgb, var(--color-text) 22%, transparent);
		padding: 0.75rem;
		rotate: 2deg;
	}
	.family-3d-design .cover-frame img,
	.family-3d-design .cover-placeholder {
		border-radius: 1.65rem;
	}
	.family-3d-design .primary-button {
		border-color: color-mix(in srgb, var(--color-surface) 75%, transparent);
		background: linear-gradient(
			145deg,
			color-mix(in srgb, var(--color-primary) 72%, var(--color-surface)),
			var(--color-primary)
		);
		box-shadow:
			0 0.5rem 0 color-mix(in srgb, var(--color-primary) 65%, var(--color-text)),
			0 1.15rem 2rem color-mix(in srgb, var(--color-text) 22%, transparent);
		color: var(--color-text);
		transition:
			box-shadow 0.2s ease,
			translate 0.2s ease;
	}
	.family-3d-design .primary-button:hover,
	.family-3d-design .primary-button:focus-visible {
		box-shadow:
			0 0.25rem 0 color-mix(in srgb, var(--color-primary) 65%, var(--color-text)),
			0 0.75rem 1.4rem color-mix(in srgb, var(--color-text) 20%, transparent);
		translate: 0 0.25rem;
	}
	.family-3d-design > section:nth-of-type(even) {
		background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
	}
	.family-3d-design .countdown-card,
	.family-3d-design .event-card,
	.family-3d-design .person-card,
	.family-3d-design .story-panel,
	.family-3d-design .gift-grid article {
		border: 1px solid color-mix(in srgb, var(--color-surface) 85%, transparent);
		border-radius: 1.75rem;
		box-shadow:
			0.55rem 0.65rem 0 color-mix(in srgb, var(--color-primary) 88%, transparent),
			1.15rem 1.35rem 2.25rem color-mix(in srgb, var(--color-text) 17%, transparent);
	}
	.family-3d-design .story-marker {
		background: var(--color-primary);
		box-shadow:
			0.35rem 0.45rem 0 color-mix(in srgb, var(--color-primary) 65%, var(--color-text)),
			0.7rem 0.9rem 1.3rem color-mix(in srgb, var(--color-text) 20%, transparent);
		color: var(--color-text);
	}
	.family-3d-design .person-card img,
	.family-3d-design .person-placeholder,
	.family-3d-design .story-image {
		border-radius: 1.2rem;
	}
	.family-3d-design .person-card img,
	.family-3d-design .person-placeholder {
		border: 0.4rem solid var(--color-surface);
		box-shadow:
			-0.6rem 0.7rem 0 var(--color-accent),
			-1.1rem 1.35rem 0 color-mix(in srgb, var(--color-primary) 85%, transparent),
			0 2rem 3rem color-mix(in srgb, var(--color-text) 20%, transparent);
	}
	.family-3d-design .gallery-grid {
		perspective: 65rem;
	}
	.family-3d-design .gallery-grid figure {
		border: 0;
		border-radius: 1.25rem;
		box-shadow:
			0.55rem 0.65rem 0 var(--color-primary),
			1rem 1.2rem 2rem color-mix(in srgb, var(--color-text) 18%, transparent);
		rotate: -2deg;
	}
	.family-3d-design .gallery-grid figure:nth-child(even) {
		rotate: 2deg;
	}
	.family-3d-design .gallery-grid img {
		border-radius: 0.75rem;
	}
	.family-3d-design.variant-2 {
		background-image:
			radial-gradient(
				circle at 12% 8%,
				color-mix(in srgb, var(--color-primary) 22%, transparent),
				transparent 28%
			),
			radial-gradient(
				circle at 88% 34%,
				color-mix(in srgb, var(--color-accent) 16%, transparent),
				transparent 24%
			),
			linear-gradient(145deg, var(--color-background), var(--color-surface));
	}
	.family-3d-design.variant-2 .cover-frame {
		border-radius: 1rem;
		box-shadow:
			-0.55rem 0.65rem 0 color-mix(in srgb, var(--color-accent) 78%, transparent),
			-1.1rem 1.3rem 0 color-mix(in srgb, var(--color-primary) 82%, transparent),
			0 2.8rem 4.5rem color-mix(in srgb, var(--color-primary) 34%, transparent);
		rotate: -1deg;
	}
	.family-3d-design.variant-2 .cover-frame img,
	.family-3d-design.variant-2 .cover-placeholder,
	.family-3d-design.variant-2 .countdown-card,
	.family-3d-design.variant-2 .event-card,
	.family-3d-design.variant-2 .story-panel,
	.family-3d-design.variant-2 .gift-grid article {
		border-radius: 1rem;
	}
	.family-3d-design.variant-2 .countdown-card,
	.family-3d-design.variant-2 .event-card,
	.family-3d-design.variant-2 .story-panel,
	.family-3d-design.variant-2 .gift-grid article {
		box-shadow:
			0.35rem 0.45rem 0 color-mix(in srgb, var(--color-primary) 75%, transparent),
			0 1.4rem 3rem color-mix(in srgb, var(--color-accent) 16%, transparent),
			inset 0 1px 0 color-mix(in srgb, var(--color-text) 18%, transparent);
	}
	.family-3d-design.variant-2 .primary-button {
		background: linear-gradient(
			135deg,
			color-mix(in srgb, var(--color-primary) 62%, var(--color-background)),
			color-mix(in srgb, var(--color-accent) 55%, var(--color-background))
		);
		color: var(--color-text);
	}
	.family-3d-design.variant-2 > section:nth-of-type(even) {
		background: linear-gradient(
			135deg,
			color-mix(in srgb, var(--color-primary) 45%, var(--color-background)),
			color-mix(in srgb, var(--color-accent) 35%, var(--color-background))
		);
	}
	.family-3d-design.variant-2 .gallery-grid figure {
		border-radius: 0.85rem;
		box-shadow:
			0.4rem 0.5rem 0 color-mix(in srgb, var(--color-primary) 82%, transparent),
			0 1.4rem 2.8rem color-mix(in srgb, var(--color-accent) 18%, transparent);
		rotate: -1deg;
	}
	.family-3d-design.variant-2 .gallery-grid figure:nth-child(even) {
		rotate: 1deg;
	}
	.family-3d-design.variant-3 {
		background-image:
			radial-gradient(
				circle at 10% 12%,
				color-mix(in srgb, var(--color-accent) 26%, transparent),
				transparent 26%
			),
			radial-gradient(
				circle at 90% 42%,
				color-mix(in srgb, var(--color-primary) 18%, transparent),
				transparent 28%
			),
			linear-gradient(155deg, var(--color-background), var(--color-surface));
	}
	.family-3d-design.variant-3 .cover-frame {
		border-radius: 2.75rem 2.75rem 5rem 2.75rem;
		box-shadow:
			-0.65rem 0.75rem 0 var(--color-accent),
			-1.25rem 1.5rem 0 color-mix(in srgb, var(--color-primary) 78%, transparent),
			0 2.5rem 4rem color-mix(in srgb, var(--color-text) 16%, transparent);
		rotate: 1.5deg;
	}
	.family-3d-design.variant-3 .cover-frame img,
	.family-3d-design.variant-3 .cover-placeholder {
		border-radius: 2.15rem 2.15rem 4.35rem 2.15rem;
	}
	.family-3d-design.variant-3 .countdown-card,
	.family-3d-design.variant-3 .event-card,
	.family-3d-design.variant-3 .story-panel,
	.family-3d-design.variant-3 .gift-grid article {
		box-shadow:
			0.55rem 0.65rem 0 color-mix(in srgb, var(--color-accent) 84%, transparent),
			1.05rem 1.25rem 2.25rem color-mix(in srgb, var(--color-primary) 18%, transparent);
	}
	.family-3d-design.variant-3 .primary-button {
		background: linear-gradient(
			135deg,
			color-mix(in srgb, var(--color-primary) 70%, var(--color-surface)),
			color-mix(in srgb, var(--color-accent) 75%, var(--color-surface))
		);
		color: var(--color-text);
	}
	.family-3d-design.variant-3 > section:nth-of-type(even) {
		background: linear-gradient(
			135deg,
			color-mix(in srgb, var(--color-primary) 45%, var(--color-background)),
			color-mix(in srgb, var(--color-accent) 45%, var(--color-background))
		);
	}
	.family-3d-design.variant-3 .gallery-grid figure {
		box-shadow:
			0.55rem 0.65rem 0 var(--color-accent),
			1rem 1.2rem 2rem color-mix(in srgb, var(--color-primary) 18%, transparent);
	}
	.theme-canvas .person-card {
		border: 0;
		background: transparent;
		box-shadow: none;
		padding: 0;
	}
	.theme-canvas .countdown-card {
		display: flex;
		min-width: 0;
		width: min(100%, var(--countdown-size));
		height: auto;
		aspect-ratio: 1;
		box-sizing: border-box;
		flex-direction: column;
		flex: none;
		align-items: center;
		justify-content: center;
		justify-self: center;
		border-radius: 50%;
		padding: 12px;
	}
	.theme-canvas .countdown-card strong {
		font-size: clamp(1.615rem, 2.85vw, 2.185rem);
		line-height: 0.9;
	}
	.theme-canvas .countdown-card span {
		font-size: clamp(0.625rem, 1.5vw, 0.8rem);
		line-height: 1;
	}

	.theme-canvas .hero {
		isolation: isolate;
		overflow: hidden;
		padding-block: clamp(1.25rem, 4svh, 3rem);
	}
	.theme-canvas .hero::after,
	.theme-canvas .closing-section::after {
		position: absolute;
		z-index: 1;
		inset: 0;
		background: color-mix(in srgb, var(--color-text) 50%, transparent);
		content: '';
		pointer-events: none;
	}
	.theme-canvas .hero-grid {
		z-index: 2;
		grid-template-columns: minmax(0, 1fr);
		justify-items: center;
		max-width: 64rem;
	}
	.theme-canvas .hero-copy {
		width: 100%;
		min-width: 0;
		max-width: 60rem;
		color: #fff;
		text-align: center;
		text-shadow: 0 0.15rem 1.25rem color-mix(in srgb, var(--color-text) 45%, transparent);
	}
	.theme-canvas .hero .primary-button {
		border-color: #fff;
		background: #fff;
		color: #ff0a84;
	}
	.theme-canvas .hero-copy .eyebrow,
	.theme-canvas .hero-copy h1,
	.theme-canvas .hero-copy h1 span,
	.theme-canvas .hero-copy .hero-intro {
		color: #fff;
	}
	.theme-canvas .hero-copy h1 {
		font-size: clamp(2rem, 7vw, 4.5rem);
		text-align: center;
	}
	.theme-canvas .hero-copy h1[data-name-layout='stacked'] {
		display: grid;
		justify-items: center;
		width: 100%;
		font-size: var(--hero-stacked-font-size, clamp(2rem, 7vw, 4.5rem));
		white-space: normal;
		line-height: 0.98;
	}
	.theme-canvas .hero-copy h1[data-name-layout='stacked'] .hero-name {
		display: block;
		max-width: 100%;
		text-align: center;
		white-space: nowrap;
	}
	.theme-canvas .hero-copy h1[data-name-layout='stacked'] .hero-ampersand {
		display: block;
		margin: 0.24em 0;
		text-align: center;
	}
	.theme-canvas .hero-copy .hero-intro {
		margin-top: 1rem;
		font-size: clamp(0.75rem, 2.25vw, 1rem);
		line-height: 1.5;
	}
	.theme-canvas .hero > .cover-frame {
		position: absolute;
		z-index: 0;
		inset: 0;
		width: 100%;
		max-width: none;
		margin: 0;
		border: 0;
		border-radius: 0;
		background: var(--color-background);
		box-shadow: none;
		padding: 0;
		rotate: none;
	}
	.theme-canvas .hero > .cover-frame img,
	.theme-canvas .hero > .cover-frame .cover-placeholder {
		width: 100%;
		height: 100%;
		border-radius: 0;
		aspect-ratio: auto;
		object-fit: cover;
	}
	.theme-canvas .closing-section > .cover-frame {
		position: absolute;
		z-index: 0;
		inset: 0;
		width: 100%;
		max-width: none;
		margin: 0;
		border: 0;
		border-radius: 0;
		background: var(--color-background);
		box-shadow: none;
		padding: 0;
		rotate: none;
	}
	.theme-canvas .closing-section > .cover-frame img,
	.theme-canvas .closing-section > .cover-frame .cover-placeholder {
		width: 100%;
		height: 100%;
		border-radius: 0;
		aspect-ratio: auto;
		object-fit: cover;
	}
	.theme-canvas .closing-section > .cover-frame img {
		filter: brightness(0.55);
	}
	.theme-canvas .hero > .decoration {
		display: none;
	}
	.family-3d-design.variant-2 .hero::after,
	.family-3d-design.variant-2 .closing-section::after {
		background:
			radial-gradient(
				circle at 78% 18%,
				color-mix(in srgb, var(--color-accent) 18%, transparent),
				transparent 36%
			),
			linear-gradient(
				135deg,
				color-mix(in srgb, var(--color-background) 88%, transparent),
				color-mix(in srgb, var(--color-primary) 58%, transparent)
			);
	}
	.family-3d-design.variant-2 .hero-copy {
		color: var(--color-text);
		text-shadow: 0 0.2rem 1.4rem color-mix(in srgb, var(--color-background) 72%, transparent);
	}
	.family-3d-design.variant-2 .hero-copy .eyebrow,
	.family-3d-design.variant-2 .hero-copy h1,
	.family-3d-design.variant-2 .hero-copy h1 span,
	.family-3d-design.variant-2 .hero-copy .hero-intro {
		color: var(--color-text);
	}
	.family-3d-design.variant-2 .hero .primary-button {
		border-color: color-mix(in srgb, var(--color-text) 38%, transparent);
		background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
		box-shadow:
			0 0.45rem 0 color-mix(in srgb, var(--color-primary) 62%, var(--color-background)),
			0 1.1rem 2.6rem color-mix(in srgb, var(--color-accent) 24%, transparent);
		color: var(--color-text);
	}
	.family-3d-design.variant-3 .hero::after,
	.family-3d-design.variant-3 .closing-section::after {
		background:
			radial-gradient(
				circle at 20% 16%,
				color-mix(in srgb, var(--color-accent) 28%, transparent),
				transparent 38%
			),
			linear-gradient(
				135deg,
				color-mix(in srgb, var(--color-text) 72%, transparent),
				color-mix(in srgb, var(--color-primary) 58%, transparent)
			);
	}
	.family-3d-design.variant-3 .hero-copy {
		text-shadow: 0 0.2rem 1.4rem color-mix(in srgb, var(--color-text) 72%, transparent);
	}
	.family-3d-design.variant-3 .hero .primary-button {
		border-color: color-mix(in srgb, var(--color-surface) 72%, transparent);
		background: linear-gradient(
			135deg,
			color-mix(in srgb, var(--color-primary) 70%, var(--color-surface)),
			color-mix(in srgb, var(--color-accent) 75%, var(--color-surface))
		);
		box-shadow:
			0 0.45rem 0 color-mix(in srgb, var(--color-primary) 66%, var(--color-text)),
			0 1.1rem 2.4rem color-mix(in srgb, var(--color-accent) 34%, transparent);
		color: var(--color-text);
	}

	.family-nocturne {
		--color-muted: #c5c7bd;
		background: var(--color-background);
		font-family: 'Avenir Next', Avenir, sans-serif;
	}
	.family-nocturne > section:not(.hero),
	.family-nocturne > section:nth-of-type(even) {
		background:
			radial-gradient(circle at 8% 5%, #d9b77b16 0, transparent 30rem),
			linear-gradient(155deg, #101d23, #16282d 56%, #101d23);
	}
	.family-nocturne .section-shell:not(.hero):not(.closing-section) {
		padding-block: clamp(5.5rem, 10vw, 9rem);
	}
	.family-nocturne .hero {
		min-height: 100svh;
		background: #0b171d;
	}
	.family-nocturne .hero::after {
		background: #071318a6;
	}
	.family-nocturne .closing-section::after {
		background:
			linear-gradient(90deg, #071318b8, #08151a75 50%, #071318b8),
			linear-gradient(0deg, #0b171de8, transparent 34%, #0b171d80),
			radial-gradient(circle at center, transparent, #0b171d75);
	}
	.family-nocturne .hero > .cover-frame img {
		filter: none;
	}
	.family-nocturne .hero > .cover-frame .cover-placeholder {
		background: radial-gradient(circle, #566d68, #15272d 58%, #0b171d);
		color: #e9d6b7;
	}
	.family-nocturne .hero .decoration {
		z-index: 1;
		display: block;
		width: min(25vw, 16rem);
		border: 1px solid #f7f0e126;
		border-radius: 50%;
		background: transparent;
		box-shadow:
			0 0 0 1.5rem #d9b77b12,
			0 0 0 3rem #d9b77b0b;
		pointer-events: none;
	}
	.family-nocturne .decoration-one {
		top: 8%;
		left: 5%;
	}
	.family-nocturne .decoration-two {
		right: 5%;
		bottom: 8%;
	}
	.family-nocturne .hero-grid {
		padding-block: clamp(2rem, 8svh, 6rem);
	}
	.family-nocturne .hero-copy {
		max-width: 56rem;
		text-shadow: 0 2px 24px #071318;
	}
	.family-nocturne .hero-copy .eyebrow,
	.family-nocturne .section-heading .eyebrow {
		color: #e9c991;
		font-weight: 600;
		letter-spacing: 0.32em;
		text-transform: uppercase;
	}
	.family-nocturne .hero-copy .eyebrow {
		color: #f7f0e1;
		letter-spacing: 0.12em;
		text-transform: none;
	}
	.family-nocturne .hero-copy h1,
	.family-nocturne .section-heading h2,
	.family-nocturne blockquote,
	.family-nocturne .closing-section h2 {
		font-family: 'Iowan Old Style', 'Baskerville', Georgia, serif;
		font-weight: 400;
		letter-spacing: -0.045em;
	}
	.family-nocturne .hero-copy h1 {
		margin-top: 1.1rem;
		line-height: 0.94;
	}
	.family-nocturne .hero-copy h1 .hero-ampersand {
		margin-block: 0.05em;
		color: #e9c991;
		font-size: 0.56em;
		font-style: italic;
	}
	.family-nocturne .hero-copy .hero-intro {
		margin-top: 2rem;
		letter-spacing: 0.07em;
	}
	.family-nocturne .hero-countdown {
		width: min(100%, 32rem);
		margin-top: 1.5rem;
	}
	.family-nocturne .hero-countdown .countdown-card {
		border: 1px solid #f7f0e14d;
		background: #0b171d99;
		box-shadow:
			inset 0 0 0 4px #0b171d80,
			0 0 24px #d9b77b22;
		color: #f7f0e1;
		backdrop-filter: blur(8px);
	}
	.family-nocturne .countdown-card strong {
		font-family: 'Iowan Old Style', Georgia, serif;
		font-weight: 400;
	}
	.family-nocturne .countdown-card span {
		color: #e9c991;
		font-weight: 600;
		letter-spacing: 0.14em;
	}
	.family-nocturne .primary-button,
	.family-nocturne .hero .primary-button {
		border: 0;
		border-radius: 0;
		background: #d9b77b;
		padding: 0.95rem 2rem;
		box-shadow: none;
		color: #101d23;
		font-size: 0.85rem;
		font-weight: 700;
		letter-spacing: 0.18em;
		text-shadow: none;
		text-transform: uppercase;
		transition: background 200ms ease;
	}
	.family-nocturne .primary-button:hover,
	.family-nocturne .primary-button:focus-visible {
		background: #f0d5a3;
	}
	.family-nocturne .primary-button:focus-visible {
		outline: 2px solid #f7f0e1;
		outline-offset: 4px;
	}
	.family-nocturne .section-heading h2 {
		color: #f7f0e1;
		font-size: clamp(3.1rem, 7vw, 6rem);
		line-height: 1.02;
	}
	.family-nocturne .section-heading::after {
		display: block;
		width: 5rem;
		height: 1px;
		margin: 2rem auto 0;
		background: #d9b77b;
		content: '';
	}
	.family-nocturne .couple-grid {
		gap: clamp(2rem, 5vw, 5rem);
		margin-top: 4.5rem;
	}
	.family-nocturne .couple-grid::after {
		color: #d9b77b;
		font-style: italic;
		font-weight: 400;
		filter: none;
	}
	.family-nocturne .person-card img,
	.family-nocturne .person-placeholder {
		width: min(75%, 17rem);
		aspect-ratio: 4 / 5;
		border: 1px solid #d9b77b;
		border-radius: 50% 50% 0 0;
		box-shadow:
			0 0 0 8px #d9b77b16,
			0 24px 65px #050e12a8;
	}
	.family-nocturne .person-placeholder {
		background: radial-gradient(circle at 30% 25%, #516a67, #192a30);
		color: #e9c991;
		font-family: 'Iowan Old Style', Georgia, serif;
	}
	.family-nocturne .person-card h3,
	.family-nocturne .event-card h3,
	.family-nocturne .story-card h3 {
		color: #f7f0e1;
		font-family: 'Iowan Old Style', Georgia, serif;
		font-size: clamp(2rem, 3vw, 2.75rem);
		font-weight: 400;
	}
	.family-nocturne .person-card p,
	.family-nocturne .event-card p,
	.family-nocturne .story-card p {
		color: #c5c7bd;
	}
	.family-nocturne .event-card,
	.family-nocturne .story-panel,
	.family-nocturne .gift-grid article {
		border: 1px solid #d9b77b61;
		background: #1b2c31;
		box-shadow:
			0 22px 60px #07131880,
			inset 0 1px #f7f0e118;
	}
	.family-nocturne .event-card {
		padding: clamp(2rem, 5vw, 4rem);
	}
	.family-nocturne .event-card .eyebrow,
	.family-nocturne .gift-grid small {
		color: #d9b77b;
	}
	.family-nocturne .event-card strong {
		font-size: 1.1rem;
		font-weight: 500;
	}
	.family-nocturne .divider {
		height: 1px;
		background: #d9b77b80;
	}
	.family-nocturne > .quote-section {
		min-height: clamp(16rem, 32svh, 22rem);
		color: #f7f0e1;
	}
	.family-nocturne .section-shell.event-section:not(.hero):not(.closing-section) {
		padding-bottom: clamp(3.5rem, 6vw, 5rem);
	}
	.family-nocturne .section-shell.quote-section:not(.hero):not(.closing-section) {
		padding-block: clamp(3rem, 5vw, 4.5rem);
	}
	.family-nocturne .section-shell.story-section:not(.hero):not(.closing-section) {
		padding-top: clamp(3.5rem, 6vw, 5rem);
	}
	.family-nocturne .quote-section blockquote {
		line-height: 1.28;
	}
	.family-nocturne .story-list::before {
		width: 2px;
		background: #d9b77b;
		box-shadow: 0 0 12px #d9b77b80;
		opacity: 1;
	}
	.family-nocturne .story-marker {
		background: #d9b77b;
		color: #101d23;
	}
	.family-nocturne .story-image {
		filter: saturate(0.8);
	}
	.family-nocturne .story-copy {
		padding: clamp(1.5rem, 4vw, 2.5rem);
	}
	.family-nocturne .story-meta time {
		color: #d9b77b;
	}
	.family-nocturne .gallery-grid figure {
		border: 1px solid #d9b77b8c;
		padding: 0.4rem;
		box-shadow: 0 18px 40px #050e1280;
	}
	.family-nocturne .gallery-grid img {
		filter: saturate(0.8);
		transition:
			filter 250ms ease,
			scale 350ms ease;
	}
	.family-nocturne .gallery-grid button:hover img,
	.family-nocturne .gallery-grid button:focus-visible img {
		filter: saturate(1);
		scale: 1.035;
	}
	.family-nocturne .gift-grid article {
		padding: 2rem;
	}
	.family-nocturne .gift-provider {
		font-family: 'Iowan Old Style', Georgia, serif;
		font-size: 1.7rem;
		font-weight: 400;
	}
	.family-nocturne .closing-section {
		min-height: 70svh;
	}
	.family-nocturne .closing-section p {
		color: #f7f0e1;
		font-family: 'Iowan Old Style', Georgia, serif;
		font-size: clamp(2rem, 5vw, 4rem);
		font-weight: 400;
	}
	.family-nocturne .closing-section h2 {
		color: #e9c991;
		font-size: clamp(2.5rem, 6vw, 5rem);
	}

	.family-sunda {
		--color-muted: #597168;
		font-family: 'Avenir Next', Avenir, sans-serif;
	}
	.family-sunda .hero {
		box-sizing: border-box;
		height: 100dvh;
		min-height: 100dvh;
		background: #12392f;
		padding-block: clamp(0.75rem, 2dvh, 1.25rem);
	}
	.family-sunda .hero::after {
		background: #102e29a3;
	}
	.family-sunda .hero > .cover-frame img {
		filter: saturate(0.88);
	}
	.family-sunda .hero > .cover-frame .cover-placeholder {
		background: radial-gradient(circle at 50% 35%, #5e8171, #14392e 72%);
		color: #f9eed5;
	}
	.family-sunda .hero-grid {
		padding-block: clamp(1.25rem, 3dvh, 2.5rem);
		translate: 0 -3dvh;
	}
	.family-sunda .hero-copy {
		max-width: 54rem;
		text-shadow: 0 2px 18px #061a17a8;
	}
	.family-sunda .sunda-ornament {
		display: block;
		width: min(60%, 15rem);
		height: auto;
		margin: 0.25rem auto 0.5rem;
		filter: drop-shadow(0 4px 10px #071e1aa8);
	}
	.family-sunda .hero-copy .eyebrow {
		color: #f9eed5;
		letter-spacing: 0.14em;
	}
	.family-sunda .hero-copy h1,
	.family-sunda .section-heading h2,
	.family-sunda .person-card h3,
	.family-sunda .event-card h3,
	.family-sunda .story-card h3,
	.family-sunda blockquote,
	.family-sunda .closing-section h2 {
		font-family: 'Iowan Old Style', 'Baskerville', Georgia, serif;
		font-weight: 400;
		letter-spacing: -0.045em;
	}
	.family-sunda .hero-copy h1[data-name-layout='stacked'] {
		margin-top: 0.4rem;
		font-size: var(--hero-stacked-font-size, clamp(2.85rem, 7.6vw, 6.175rem));
		line-height: 0.97;
	}
	.family-sunda .hero-copy h1 .hero-ampersand {
		color: #e4c782;
		font-size: 0.5em;
		margin-block: 0.12em;
	}
	.family-sunda .hero-copy .hero-intro {
		margin-top: 0.5rem;
		color: #fff8e9;
	}
	.family-sunda .hero-countdown {
		--countdown-gap: 0.5rem;
		margin-top: 0.75rem;
	}
	.family-sunda .hero-countdown .countdown-card {
		border: 1px solid #e5ca8fa3;
		background: #10392fc7;
		box-shadow:
			0 10px 30px #051d1980,
			inset 0 0 0 4px #ebd9ae1c;
		color: #fff9ed;
		backdrop-filter: blur(0.35rem);
	}
	.family-sunda .hero-countdown .countdown-card span {
		color: #e8d19e;
	}
	.family-sunda .primary-button,
	.family-sunda .hero .primary-button {
		margin-top: 1rem;
		border: 1px solid #b78a43;
		border-radius: 0.3rem;
		background: #f7eed9;
		box-shadow: 0 5px 0 #b78a43;
		padding: 0.95rem 1.8rem;
		color: #173b31;
		font-size: 0.85rem;
		font-weight: 800;
		letter-spacing: 0.15em;
		text-transform: uppercase;
		transition:
			transform 180ms ease,
			box-shadow 180ms ease;
	}
	.family-sunda .primary-button:hover {
		transform: translateY(-3px);
		box-shadow: 0 8px 0 #b78a43;
	}
	.family-sunda .primary-button:focus-visible {
		outline: 3px solid #183c34;
		outline-offset: 4px;
	}
	.family-sunda .hero .primary-button:focus-visible {
		outline-color: #fff8e9;
	}
	.family-sunda > section.couple-section,
	.family-sunda > section.story-section,
	.family-sunda > section.gift-section {
		background:
			radial-gradient(circle at 8% 16%, #b2c6ac3b, transparent 27rem),
			radial-gradient(circle at 94% 82%, #d6bc7b33, transparent 29rem), #f5f0e3;
	}
	.family-sunda > section.event-section,
	.family-sunda > section.gallery-section {
		background:
			repeating-linear-gradient(130deg, transparent 0 32px, #d3b87209 32px 33px),
			linear-gradient(145deg, #103b32, #1f4e3d 54%, #103b32);
		color: #fff8e9;
	}
	.family-sunda > section.quote-section {
		background: #e4e9db;
		color: #183c34;
	}
	.family-sunda .section-heading::before {
		display: block;
		width: min(48vw, 14rem);
		height: 2.8rem;
		margin: 0 auto 1.25rem;
		background: url('/images/themes/puspa-parahyangan-ornament.svg') center / contain no-repeat;
		content: '';
	}
	.family-sunda .section-heading .eyebrow {
		color: #9a713b;
		letter-spacing: 0.27em;
	}
	.family-sunda .event-section .section-heading .eyebrow,
	.family-sunda .gallery-section .section-heading .eyebrow {
		color: #dfc887;
	}
	.family-sunda .section-heading h2 {
		font-size: clamp(2.8rem, 6vw, 5.5rem);
	}
	.family-sunda .couple-grid {
		gap: clamp(2rem, 5vw, 4rem);
	}
	.family-sunda .couple-grid::after {
		color: #b78a43;
		filter: none;
	}
	.family-sunda .person-card img,
	.family-sunda .person-placeholder {
		width: min(72%, 18rem);
		aspect-ratio: 4 / 5;
		border: 6px solid #fffaf0;
		border-radius: 48% 48% 0.5rem 0.5rem;
		box-shadow:
			0 0 0 1px #b78a43,
			0 20px 40px #27453930;
	}
	.family-sunda .person-placeholder {
		background: #9db5a2;
		color: #183c34;
	}
	.family-sunda .person-card h3 {
		color: #183c34;
		font-size: clamp(2.2rem, 4vw, 3.4rem);
	}
	.family-sunda .person-card p,
	.family-sunda .story-card p {
		color: #597168;
	}
	.family-sunda .event-card {
		border: 1px solid #c3a46f;
		border-radius: 48% 48% 0.5rem 0.5rem / 12% 12% 0.5rem 0.5rem;
		background: #fff9ec;
		box-shadow:
			inset 0 0 0 7px #fff9ec,
			inset 0 0 0 8px #c3a46f91,
			0 22px 40px #09291f73;
		padding: clamp(3.5rem, 6vw, 5rem) clamp(1.5rem, 4vw, 3rem) clamp(2rem, 4vw, 3rem);
		color: #183c34;
	}
	.family-sunda .event-card .eyebrow {
		color: #9a713b;
	}
	.family-sunda .event-card h3 {
		font-size: clamp(2rem, 3.5vw, 2.8rem);
	}
	.family-sunda .event-card p {
		color: #597168;
	}
	.family-sunda .divider {
		background: #b78a43;
	}
	.family-sunda .quote-section {
		min-height: 20rem;
		border-block: 1px solid #b78a4366;
	}
	.family-sunda blockquote {
		width: min(100%, 50rem);
		font-size: clamp(1rem, 2.5vw, 1.875rem);
		line-height: 1.45;
	}
	.family-sunda .story-list::before {
		width: 2px;
		background: #b78a43;
		opacity: 1;
	}
	.family-sunda .story-marker {
		border: 1px solid #b78a43;
		background: #183c34;
		color: #f8edcf;
	}
	.family-sunda .story-panel,
	.family-sunda .gift-grid article {
		border: 1px solid #c7ad79;
		border-radius: 0.35rem;
		background: #fffaf0;
		box-shadow: 0 18px 40px #2745391c;
	}
	.family-sunda .story-copy {
		padding: clamp(1.5rem, 3vw, 2.5rem);
	}
	.family-sunda .story-card h3 {
		font-size: clamp(1.8rem, 3vw, 2.5rem);
	}
	.family-sunda .story-meta time,
	.family-sunda .gift-grid small {
		color: #9a713b;
	}
	.family-sunda .gallery-grid figure {
		border: 6px solid #fff9ec;
		background: #fff9ec;
		box-shadow: 0 14px 30px #09291f88;
	}
	.family-sunda .gallery-grid img {
		transition: transform 400ms ease;
	}
	.family-sunda .gallery-grid button:hover img,
	.family-sunda .gallery-grid button:focus-visible img {
		transform: scale(1.035);
	}
	.family-sunda .gallery-trigger:focus-visible {
		outline-color: #dfc887;
	}
	.family-sunda .gift-grid article {
		padding: clamp(1.5rem, 3vw, 2.5rem);
	}
	.family-sunda .gift-provider {
		font-family: 'Iowan Old Style', Georgia, serif;
		font-size: 1.55rem;
	}
	.family-sunda .closing-section {
		min-height: 70svh;
	}
	.family-sunda .closing-section::after {
		background: #102e29ad;
	}
	.family-sunda .closing-section p,
	.family-sunda .closing-section h2,
	.family-sunda .closing-section small {
		color: #fff9ec;
	}
	.family-sunda .closing-section h2 {
		font-size: clamp(2.5rem, 6vw, 5rem);
	}
	.regional-theme {
		--color-muted: color-mix(in srgb, var(--color-text) 70%, var(--color-background));
		font-family: 'Avenir Next', Avenir, sans-serif;
	}
	.regional-theme .hero {
		box-sizing: border-box;
		height: 100dvh;
		min-height: 100dvh;
		background: var(--regional-dark);
		padding-block: clamp(0.75rem, 2dvh, 1.5rem);
	}
	.regional-theme .hero::after {
		background: color-mix(in srgb, var(--regional-dark) 68%, transparent);
	}
	.regional-theme .hero > .cover-frame .cover-placeholder {
		background: radial-gradient(circle at center, var(--color-accent), var(--regional-dark) 74%);
		color: var(--regional-cream);
	}
	.regional-theme .hero-grid {
		padding-block: 0.5rem;
	}
	.regional-theme .hero-copy {
		max-width: 54rem;
		text-shadow: 0 2px 18px #0009;
	}
	.regional-theme .regional-ornament {
		display: block;
		width: min(62%, 18rem);
		height: clamp(2.6rem, 8dvh, 5.5rem);
		margin: 0 auto 0.4rem;
		object-fit: contain;
		filter: drop-shadow(0 4px 10px #0007);
	}
	.regional-theme .hero-copy .eyebrow,
	.regional-theme .hero-copy .hero-intro {
		color: var(--regional-cream);
	}
	.regional-theme .hero-copy .eyebrow {
		letter-spacing: 0.14em;
	}
	.regional-theme .hero-copy h1,
	.regional-theme .section-heading h2,
	.regional-theme .person-card h3,
	.regional-theme .event-card h3,
	.regional-theme .story-card h3,
	.regional-theme blockquote,
	.regional-theme .closing-section h2 {
		font-family: 'Iowan Old Style', 'Baskerville', Georgia, serif;
		font-weight: 400;
		letter-spacing: -0.045em;
	}
	.regional-theme .hero-copy h1[data-name-layout='stacked'] {
		margin-top: 0.4rem;
		font-size: var(--hero-stacked-font-size, clamp(2.85rem, 7.6vw, 6.175rem));
		line-height: 0.97;
	}
	.regional-theme .hero-copy h1 .hero-ampersand {
		margin-block: 0.12em;
		color: var(--regional-gold);
		font-size: 0.5em;
	}
	.regional-theme .hero-copy .hero-intro {
		margin-top: 0.5rem;
	}
	.regional-theme .hero-countdown {
		--countdown-gap: 0.5rem;
		margin-top: 0.75rem;
	}
	.regional-theme .hero-countdown .countdown-card {
		border: 1px solid var(--regional-gold);
		background: color-mix(in srgb, var(--regional-dark) 84%, transparent);
		box-shadow:
			0 10px 30px #0006,
			inset 0 0 0 4px #fff1;
		color: var(--regional-cream);
		backdrop-filter: blur(0.35rem);
	}
	.regional-theme .countdown-card span {
		color: var(--regional-gold);
	}
	.regional-theme .primary-button,
	.regional-theme .hero .primary-button {
		margin-top: 1rem;
		border: 1px solid var(--regional-gold);
		border-radius: var(--regional-button-radius, 0.25rem);
		background: var(--regional-cream);
		box-shadow: 0 5px 0 var(--regional-gold);
		padding: 0.9rem 1.7rem;
		color: var(--regional-dark);
		font-size: 0.8rem;
		font-weight: 900;
		letter-spacing: 0.13em;
		text-transform: uppercase;
		transition:
			transform 180ms ease,
			box-shadow 180ms ease;
	}
	.regional-theme .primary-button:hover {
		transform: translateY(-3px);
		box-shadow: 0 8px 0 var(--regional-gold);
	}
	.regional-theme .primary-button:focus-visible {
		outline: 3px solid var(--regional-dark);
		outline-offset: 4px;
	}
	.regional-theme .hero .primary-button:focus-visible,
	.regional-theme .event-section .primary-button:focus-visible {
		outline-color: var(--regional-cream);
	}
	.regional-theme > section.couple-section,
	.regional-theme > section.story-section,
	.regional-theme > section.gift-section {
		background: var(--color-background);
	}
	.regional-theme > section.event-section,
	.regional-theme > section.gallery-section {
		background: var(--regional-dark);
		color: var(--regional-cream);
	}
	.regional-theme > section.quote-section {
		border-block: 1px solid color-mix(in srgb, var(--color-primary) 48%, transparent);
		background: color-mix(in srgb, var(--color-background) 74%, var(--color-accent));
		color: var(--color-text);
	}
	.regional-theme .section-heading::before {
		display: block;
		width: min(52vw, 16rem);
		height: 3.5rem;
		margin: 0 auto 1.1rem;
		background: var(--regional-ornament-image) center / contain no-repeat;
		content: '';
		filter: drop-shadow(0 2px 3px #0004);
	}
	.regional-theme .section-heading .eyebrow,
	.regional-theme .story-meta time,
	.regional-theme .gift-grid small {
		color: var(--color-primary);
	}
	.regional-theme .event-section .section-heading .eyebrow,
	.regional-theme .gallery-section .section-heading .eyebrow {
		color: var(--regional-gold);
	}
	.regional-theme .couple-grid::after {
		color: var(--color-primary);
		filter: none;
	}
	.regional-theme .person-card img,
	.regional-theme .person-placeholder {
		width: min(72%, 18rem);
		aspect-ratio: 4 / 5;
		border: 6px solid var(--color-surface);
		border-radius: var(--regional-portrait-radius, 45% 45% 0.35rem 0.35rem);
		box-shadow:
			0 0 0 2px var(--color-primary),
			0 22px 45px #0002;
	}
	.regional-theme .person-placeholder {
		background: var(--color-accent);
		color: var(--color-text);
	}
	.regional-theme .person-card h3 {
		font-size: clamp(2.2rem, 4vw, 3.4rem);
	}
	.regional-theme .event-card {
		border: 1px solid var(--color-primary);
		border-radius: var(--regional-card-radius, 0.35rem);
		background: var(--color-surface);
		box-shadow:
			inset 0 0 0 6px var(--color-surface),
			inset 0 0 0 7px var(--color-primary),
			0 18px 40px #0004;
		padding: clamp(2.5rem, 5vw, 4rem) clamp(1.5rem, 4vw, 3rem);
		color: var(--color-text);
	}
	.regional-theme .event-card .eyebrow {
		color: var(--color-primary);
	}
	.regional-theme blockquote {
		font-size: clamp(1rem, 2.5vw, 1.875rem);
		line-height: 1.45;
	}
	.regional-theme .story-list::before {
		width: 3px;
		background: var(--color-primary);
		opacity: 1;
	}
	.regional-theme .story-marker {
		border: 1px solid var(--color-primary);
		background: var(--regional-dark);
		color: var(--regional-cream);
	}
	.regional-theme .story-panel,
	.regional-theme .gift-grid article {
		border: 1px solid var(--color-primary);
		border-radius: var(--regional-card-radius, 0.35rem);
		background: var(--color-surface);
		box-shadow: 0 16px 35px #0002;
	}
	.regional-theme .gallery-grid figure {
		border: 5px solid var(--regional-cream);
		background: var(--regional-cream);
		box-shadow: 0 14px 30px #0007;
	}
	.regional-theme .gift-provider {
		font-family: 'Iowan Old Style', Georgia, serif;
		font-size: 1.5rem;
		font-weight: 400;
	}
	.regional-theme .regional-rsvp :global(#rsvp) {
		background: var(--color-background);
		color: var(--color-text);
	}
	.regional-theme .regional-rsvp :global(#rsvp [data-reveal]) {
		border-color: var(--color-primary);
		border-radius: var(--regional-card-radius, 0.35rem);
		background: var(--color-surface);
		box-shadow: 0 20px 50px #0002;
	}
	.regional-theme .regional-rsvp :global(#rsvp h2),
	.regional-theme .regional-rsvp :global(#rsvp h3),
	.regional-theme .regional-rsvp :global(#rsvp legend),
	.regional-theme .regional-rsvp :global(#rsvp label) {
		color: var(--color-text);
	}
	.regional-theme .regional-rsvp :global(#rsvp header p) {
		color: var(--color-primary);
	}
	.regional-theme .regional-rsvp :global(#rsvp button[type='submit']) {
		border-radius: var(--regional-button-radius, 0.25rem);
		background: var(--regional-dark);
		color: var(--regional-cream);
	}
	.regional-theme .regional-rsvp :global(#rsvp textarea:focus) {
		border-color: var(--color-primary);
	}
	.regional-theme .closing-section::after {
		background: color-mix(in srgb, var(--regional-dark) 76%, transparent);
	}
	.regional-theme .closing-section p,
	.regional-theme .closing-section h2,
	.regional-theme .closing-section small {
		color: var(--regional-cream);
	}
	.family-aceh {
		--regional-dark: #35191e;
		--regional-cream: #fff1d7;
		--regional-gold: #e7bd76;
		--regional-ornament-image: url('/images/themes/pinto-aceh-ornament.svg');
		--regional-card-radius: 45% 45% 0.35rem 0.35rem / 12% 12% 0.35rem 0.35rem;
	}
	.family-aceh .event-card {
		padding-top: clamp(3.5rem, 6vw, 5rem);
	}
	.family-aceh .couple-section,
	.family-aceh .story-section {
		background-image: radial-gradient(circle at 50% 0, #b83c4314, transparent 55%);
	}
	.family-jawa {
		--regional-dark: #38281d;
		--regional-cream: #f9ebcf;
		--regional-gold: #ecd4a4;
		--regional-ornament-image: url('/images/themes/kawung-jawa-ornament.svg');
		--regional-portrait-radius: 50% 50% 0.2rem 0.2rem;
		--regional-card-radius: 0.15rem;
	}
	.family-jawa .couple-section,
	.family-jawa .story-section,
	.family-jawa .gift-section {
		background-image:
			radial-gradient(ellipse 20px 35px at 25px 45px, #9865431a 35%, transparent 38%),
			radial-gradient(ellipse 20px 35px at 65px 45px, #9865431a 35%, transparent 38%);
		background-size: 90px 90px;
	}
	.family-jawa .event-card {
		border-width: 2px;
		box-shadow:
			inset 0 0 0 6px var(--color-surface),
			inset 0 0 0 8px #98654380,
			0 18px 40px #0004;
	}
	.family-batak {
		--regional-dark: #1f1d1b;
		--regional-cream: #f7efe2;
		--regional-gold: #f5e9cf;
		--regional-ornament-image: url('/images/themes/gorga-batak-ornament.svg');
		--regional-portrait-radius: 0.15rem;
		--regional-card-radius: 0.15rem;
		--regional-button-radius: 0;
	}
	.family-batak .hero::before,
	.family-batak .event-section::before,
	.family-batak .gallery-section::before {
		position: absolute;
		z-index: 2;
		top: 0;
		left: 0;
		width: 100%;
		height: 10px;
		background: repeating-linear-gradient(
			90deg,
			#a82424 0 22px,
			#f5e9cf 22px 28px,
			#1f1d1b 28px 50px
		);
		content: '';
		pointer-events: none;
	}
	.family-batak .event-card,
	.family-batak .story-panel,
	.family-batak .gift-grid article {
		border: 2px solid #a82424;
		box-shadow: 7px 7px 0 #1f1d1b;
	}
	.family-batak .story-list::before {
		background: #a82424;
	}
	.family-bugis {
		--regional-dark: #123b37;
		--regional-cream: #fdf1d2;
		--regional-gold: #e8d2a0;
		--regional-ornament-image: url('/images/themes/lipa-sabbe-bugis-ornament.svg');
		--regional-portrait-radius: 0.3rem;
		--regional-card-radius: 0.15rem;
	}
	.family-bugis .event-section,
	.family-bugis .gallery-section {
		background-image:
			linear-gradient(#e8d2a012 1px, transparent 1px),
			linear-gradient(90deg, #e8d2a012 1px, transparent 1px);
		background-size: 28px 28px;
	}
	.family-bugis .event-card,
	.family-bugis .story-panel,
	.family-bugis .gift-grid article {
		clip-path: polygon(
			0 0,
			calc(100% - 16px) 0,
			100% 16px,
			100% 100%,
			16px 100%,
			0 calc(100% - 16px)
		);
	}
	.family-betawi {
		--regional-dark: #16463b;
		--regional-cream: #fff4d8;
		--regional-gold: #f8e9c5;
		--regional-ornament-image: url('/images/themes/gigi-balang-betawi-ornament.svg');
		--regional-portrait-radius: 47% 47% 0.4rem 0.4rem;
		--regional-card-radius: 1.75rem 1.75rem 0.5rem 0.5rem;
		--regional-button-radius: 0.35rem;
	}
	.family-betawi .hero::before,
	.family-betawi .event-section::before,
	.family-betawi .gallery-section::before {
		position: absolute;
		z-index: 2;
		top: 0;
		left: 0;
		width: 100%;
		height: 20px;
		background: linear-gradient(135deg, var(--regional-cream) 50%, transparent 50%) 0 0 / 32px 20px
			repeat-x;
		content: '';
		pointer-events: none;
	}
	.family-betawi .section-heading h2,
	.family-betawi .person-card h3 {
		color: var(--color-text);
	}
	.family-betawi .event-section .section-heading h2,
	.family-betawi .gallery-section .section-heading h2 {
		color: var(--regional-cream);
	}
	.family-minang {
		--regional-dark: #441e29;
		--regional-cream: #fff0d4;
		--regional-gold: #eac980;
		--regional-ornament-image: url('/images/themes/gonjong-minang-ornament.svg');
		--regional-card-radius: 45% 45% 0.25rem 0.25rem / 10% 10% 0.25rem 0.25rem;
	}
	.family-minang .event-card {
		padding-top: clamp(3.5rem, 6vw, 5rem);
	}
	.family-minang .hero-copy h1,
	.family-minang .section-heading h2 {
		font-style: italic;
	}
	.family-minang .couple-section,
	.family-minang .story-section {
		background-image: repeating-linear-gradient(135deg, transparent 0 22px, #b388380b 22px 24px);
	}
	.family-toraja {
		--regional-dark: #32231f;
		--regional-cream: #f7e8cc;
		--regional-gold: #ebd9b9;
		--regional-ornament-image: url('/images/themes/tongkonan-toraja-ornament.svg');
		--regional-portrait-radius: 0.25rem;
		--regional-card-radius: 0.25rem;
		--regional-button-radius: 0.1rem;
	}
	.family-toraja .event-section,
	.family-toraja .gallery-section {
		background-image:
			repeating-linear-gradient(45deg, transparent 0 46px, #b85f3b16 46px 48px),
			repeating-linear-gradient(-45deg, transparent 0 46px, #b85f3b16 46px 48px);
	}
	.family-toraja .event-card,
	.family-toraja .story-panel,
	.family-toraja .gift-grid article {
		border-left: 6px solid var(--color-primary);
		border-right: 6px solid var(--color-primary);
	}
	.family-toraja .story-marker {
		border-radius: 0.2rem;
	}
	@media (max-width: 40rem) {
		.family-sunda .sunda-ornament {
			width: min(60%, 14rem);
		}
	}

	@media (max-width: 40rem) {
		.family-nocturne .hero-grid {
			padding-inline: 0.35rem;
		}
		.family-nocturne .hero-countdown {
			--countdown-gap: 0.5rem;
		}
		.family-nocturne .hero .decoration {
			width: 6rem;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.family-3d-design .primary-button {
			transition: none;
		}
		.family-nocturne .primary-button,
		.family-nocturne .gallery-grid img,
		.family-sunda .primary-button,
		.family-sunda .gallery-grid img {
			transition: none;
		}
	}

	@media (max-width: 40rem) {
		.hero-countdown {
			--countdown-size: clamp(3.8rem, 18vw, 5rem);
		}
		.theme-canvas .hero-copy h1[data-name-layout='stacked'] {
			font-size: var(--hero-stacked-font-size, clamp(2.5rem, 10vw, 4rem));
		}
		.family-sunda .hero-copy h1[data-name-layout='stacked'] {
			font-size: var(--hero-stacked-font-size, clamp(2.375rem, 9.5vw, 3.8rem));
		}
		.regional-theme .hero-copy h1[data-name-layout='stacked'] {
			font-size: var(--hero-stacked-font-size, clamp(2.375rem, 9.5vw, 3.8rem));
		}
		.regional-theme .regional-ornament {
			height: clamp(2.4rem, 6dvh, 3.5rem);
		}
		.theme-canvas .hero-copy h1,
		.theme-canvas .hero .primary-button {
			margin-top: 1.25rem;
		}
	}

	@media (min-width: 48rem) {
		.music-control {
			right: max(2rem, env(safe-area-inset-right));
			bottom: max(2rem, calc(env(safe-area-inset-bottom) + 1.25rem));
		}
		.hero-grid {
			grid-template-columns: minmax(0, 1fr);
		}
		.hero-copy {
			text-align: center;
		}
		.couple-grid,
		.event-grid,
		.gift-grid {
			grid-template-columns: repeat(2, 1fr);
		}
		.couple-grid {
			grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
			column-gap: clamp(1rem, 3vw, 2.5rem);
		}
		.couple-grid::after {
			grid-column: 2;
			grid-row: 1;
		}
		.couple-grid .person-card:first-child {
			grid-column: 1;
			grid-row: 1;
		}
		.couple-grid .person-card:last-child {
			grid-column: 3;
			grid-row: 1;
		}
		.story-list::before {
			left: 50%;
		}
		.story-card {
			grid-template-columns: minmax(0, 1fr) 3rem minmax(0, 1fr);
			gap: 1.5rem;
		}
		.story-card .story-marker {
			grid-column: 2;
			grid-row: 1;
			justify-self: center;
			width: 2.5rem;
		}
		.story-card .story-panel {
			grid-column: 1;
			grid-row: 1;
		}
		.story-card:nth-child(even) .story-panel {
			grid-column: 3;
		}
	}
</style>
