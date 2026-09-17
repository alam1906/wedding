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
		family: '3d-design' | 'minimalist' | 'neubrutalism' | 'playful';
		name: string;
		variant: 1 | 2 | 3;
	};

	type Props = WeddingThemeProps & {
		theme: WeddingThemeKey;
	};

	const themeProfiles: Record<WeddingThemeKey, ThemeProfile> = {
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
		'3d-design-3': { family: '3d-design', name: 'Fresh', variant: 3 }
	};

	let { wedding, theme }: Props = $props();
	const profile = $derived(themeProfiles[theme]);
	const colors = $derived(WEDDING_THEME_COLORS[theme]);
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
			<div class="narrow-content" data-reveal>
				<blockquote>
					{wedding.quote || 'Dua hati, satu perjalanan, dan satu janji untuk selamanya.'}
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

		{#if wedding.groom_payment_number || wedding.bride_payment_number}
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
							</article>{/if}{#if wedding.bride_payment_number}<article data-reveal>
								<small>Untuk {brideName}</small><span class="gift-provider"
									>{wedding.bride_payment_provider || 'Rekening / e-wallet'}</span
								><strong>{wedding.bride_payment_number}</strong>
							</article>{/if}
					</div>
				</div>
			</section>
		{/if}

		<PublicRsvpForm slug={wedding.slug} token={rsvpToken} />

		<footer class="closing-section section-shell">
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
		--countdown-size: clamp(6rem, 16vw, 8rem);
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
		margin-top: 1.5rem;
		font-family: Georgia, serif;
		font-size: clamp(2rem, 5vw, 3.75rem);
		line-height: 1.15;
		font-weight: 700;
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
		min-height: 26rem;
		place-items: center;
		background: var(--color-text);
		color: var(--color-surface);
	}
	.closing-section .narrow-content {
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
	.family-3d-design .closing-section {
		background:
			radial-gradient(
				circle at 75% 20%,
				color-mix(in srgb, var(--color-accent) 35%, transparent),
				transparent 25%
			),
			linear-gradient(
				145deg,
				color-mix(in srgb, var(--color-text) 82%, var(--color-primary)),
				var(--color-text)
			);
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
		font-size: 1.6rem;
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
	.theme-canvas .hero::after {
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
		font-size: clamp(2rem, 10vw, 6rem);
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
	.theme-canvas .hero > .decoration {
		display: none;
	}
	.family-3d-design.variant-2 .hero::after {
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
	.family-3d-design.variant-3 .hero::after {
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

	@media (prefers-reduced-motion: reduce) {
		.family-3d-design .primary-button {
			transition: none;
		}
	}

	@media (max-width: 40rem) {
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
