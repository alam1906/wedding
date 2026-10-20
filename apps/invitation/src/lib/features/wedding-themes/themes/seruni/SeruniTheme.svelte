<script lang="ts">
	import { page } from '$app/state';
	import { onMount, tick, untrack } from 'svelte';
	import { getPublicGuestRsvp } from '#lib/features/guests/index.js';
	import { fitCoupleHeading } from '../../shared/fit-couple-heading.js';
	import type { WeddingThemeProps } from '../../model/wedding-theme.js';
	import {
		calculateCountdown,
		formatEventDate,
		formatPersonName,
		formatStoryDate,
		getEventLocation
	} from '../../shared/theme-utils.js';
	import SeruniRsvp from './SeruniRsvp.svelte';
	import { mountSeruniAnimations, type SeruniMotion } from './seruni-animations.js';
	import './seruni.css';

	let { wedding }: WeddingThemeProps = $props();
	const groom = $derived(formatPersonName(wedding.groom_name) || 'Mempelai Pria');
	const bride = $derived(formatPersonName(wedding.bride_name) || 'Mempelai Wanita');
	const couple = $derived(`${groom} & ${bride}`);
	const cover = $derived(
		wedding.cover_url ||
			wedding.gallery[0]?.url ||
			wedding.groom_photo_url ||
			wedding.bride_photo_url ||
			''
	);
	const targetDate = $derived(wedding.akad || wedding.reception || '');
	const eventDate = $derived(formatEventDate(wedding.reception || wedding.akad));
	const token = $derived(page.url.searchParams.get('rsvp')?.trim() ?? '');
	const people = $derived([
		{
			name: groom,
			photo: wedding.groom_photo_url,
			role: 'Mempelai Pria',
			relationship: 'Putra dari',
			father: wedding.groom_father_name,
			mother: wedding.groom_mother_name
		},
		{
			name: bride,
			photo: wedding.bride_photo_url,
			role: 'Mempelai Wanita',
			relationship: 'Putri dari',
			father: wedding.bride_father_name,
			mother: wedding.bride_mother_name
		}
	]);
	const events = $derived([
		{
			label: 'Akad Nikah',
			...getEventLocation(wedding, 'akad'),
			date: formatEventDate(wedding.akad)
		},
		{
			label: 'Resepsi',
			...getEventLocation(wedding, 'reception'),
			date: formatEventDate(wedding.reception)
		}
	]);
	const gifts = $derived(
		[
			{
				name: groom,
				provider: wedding.groom_payment_provider,
				number: wedding.groom_payment_number,
				owner: wedding.groom_payment_account_name
			},
			{
				name: bride,
				provider: wedding.bride_payment_provider,
				number: wedding.bride_payment_number,
				owner: wedding.bride_payment_account_name
			}
		].filter((gift) => gift.number)
	);
	let root = $state<HTMLElement>();
	let recipient = $state('');
	let audio = $state<HTMLAudioElement>();
	let gallery = $state<HTMLDialogElement>();
	let galleryIndex = $state(0);
	let playing = $state(false);
	let coverVisible = $state(true);
	let opened = $state(false);
	let opening = $state(false);
	let countdown = $state(calculateCountdown(untrack(() => targetDate)));
	let copyFeedback = $state('');
	let motion: SeruniMotion | undefined;
	let releaseScroll = () => {};
	let galleryOverflow: string | undefined;
	let photoOrigin: HTMLButtonElement | undefined;
	let disposed = false;

	onMount(() => {
		if (!root) return;
		const html = document.documentElement;
		const body = document.body;
		const previous = {
			html: html.style.overflow,
			body: body.style.overflow,
			behavior: html.style.scrollBehavior,
			restoration: history.scrollRestoration
		};
		let locked = true;
		html.style.scrollBehavior = 'auto';
		history.scrollRestoration = 'manual';
		window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
		html.style.overflow = 'hidden';
		body.style.overflow = 'hidden';
		releaseScroll = () => {
			if (!locked) return;
			locked = false;
			html.style.overflow = previous.html;
			body.style.overflow = previous.body;
		};
		if (token) {
			void getPublicGuestRsvp(wedding.slug, token)
				.then((guest) => {
					if (!disposed) recipient = guest.name;
				})
				.catch(() => {});
		}
		motion = mountSeruniAnimations(root);
		const refresh = () => motion?.refresh();
		const element = root;
		element.addEventListener('load', refresh, true);
		const interval = window.setInterval(() => {
			countdown = calculateCountdown(targetDate);
		}, 1000);
		return () => {
			disposed = true;
			window.clearInterval(interval);
			element.removeEventListener('load', refresh, true);
			motion?.destroy();
			audio?.pause();
			if (galleryOverflow !== undefined) body.style.overflow = galleryOverflow;
			releaseScroll();
			html.style.scrollBehavior = previous.behavior;
			history.scrollRestoration = previous.restoration;
		};
	});

	async function playMusic() {
		try {
			await audio?.play();
		} catch {
			if (!disposed) playing = false;
		}
	}
	function toggleMusic() {
		if (audio?.paused) void playMusic();
		else audio?.pause();
	}
	async function openInvitation() {
		if (opening || opened) return;
		opening = true;
		opened = true;
		void playMusic();
		await tick();
		if (disposed) return;
		const complete = () => {
			if (disposed) return;
			coverVisible = false;
			opening = false;
			releaseScroll();
			void tick().then(() => {
				if (!disposed)
					root?.querySelector<HTMLElement>('.seruni-hero')?.focus({ preventScroll: true });
			});
		};
		if (motion) motion.open(complete);
		else complete();
	}
	async function copyAccount(number: string) {
		try {
			await navigator.clipboard.writeText(number);
			if (!disposed) copyFeedback = 'Nomor rekening berhasil disalin.';
		} catch {
			if (!disposed)
				copyFeedback = 'Nomor belum dapat disalin. Silakan salin nomor rekening secara manual.';
		}
	}
	function showPhoto(index: number, origin?: HTMLButtonElement) {
		if (!gallery || !wedding.gallery.length) return;
		galleryIndex = (index + wedding.gallery.length) % wedding.gallery.length;
		if (!gallery.open) {
			photoOrigin = origin;
			galleryOverflow = document.body.style.overflow;
			document.body.style.overflow = 'hidden';
			gallery.showModal();
		}
	}
	function closeGallery() {
		if (galleryOverflow !== undefined) {
			document.body.style.overflow = galleryOverflow;
			galleryOverflow = undefined;
		}
		photoOrigin?.focus({ preventScroll: true });
	}
	function galleryKeys(event: KeyboardEvent) {
		if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
		event.preventDefault();
		showPhoto(galleryIndex + (event.key === 'ArrowRight' ? 1 : -1));
	}
</script>

<main class="seruni-theme" bind:this={root}>
	{#if coverVisible}
		<section class="seruni-cover" aria-label="Sampul undangan">
			<div class="seruni-cover-media" aria-hidden="true">
				{#if cover}<img src={cover} alt="" fetchpriority="high" decoding="async" />{/if}
			</div>
			<div class="seruni-cover-veil" aria-hidden="true"></div>
			<div class="seruni-cover-content">
				<h1 class="seruni-cover-names" aria-label={couple} {@attach fitCoupleHeading}>
					<span class="hero-name" aria-hidden="true">{groom}</span><i aria-hidden="true">&amp;</i
					><span class="hero-name" aria-hidden="true">{bride}</span>
				</h1>
				<div class="seruni-recipient">
					<p>Kepada Bapak/Ibu/Saudara/i,</p>
					{#if recipient}<p class="seruni-recipient-name">{recipient}</p>{/if}
				</div>
				<div class="seruni-cover-bottom">
					<p>{eventDate.date}</p>
					<button
						type="button"
						class="seruni-open-button"
						onclick={openInvitation}
						disabled={opening}>Buka Undangan</button
					>
				</div>
			</div>
		</section>
	{/if}

	{#if opened}
		<div class="seruni-content" inert={coverVisible}>
			<section class="seruni-hero" tabindex="-1" aria-label={couple}>
				<div class="seruni-hero-media" aria-hidden="true">
					{#if cover}<img src={cover} alt="" decoding="async" />{/if}
				</div>
				<div class="seruni-hero-fade" aria-hidden="true"></div>
				<h2 data-intro>{couple}</h2>
			</section>

			{#if wedding.quote}
				<section class="seruni-quote-section" aria-label="Kutipan">
					<div class="seruni-wash seruni-wash-left" aria-hidden="true"></div>
					<blockquote data-seruni-reveal>{wedding.quote}</blockquote>
				</section>
			{/if}

			{#if targetDate}
				<section
					class="seruni-section seruni-countdown-section"
					aria-labelledby="seruni-countdown-title"
				>
					<div class="seruni-container">
						<header class="seruni-heading" data-seruni-reveal>
							<h2 id="seruni-countdown-title">Menghitung Hari</h2>
							<p>{eventDate.date}</p>
						</header>
						<div
							class="seruni-countdown"
							role="timer"
							aria-label="Hitung mundur pernikahan"
							data-seruni-reveal
						>
							{#each [{ value: countdown.days, label: 'Hari' }, { value: countdown.hours, label: 'Jam' }, { value: countdown.minutes, label: 'Menit' }, { value: countdown.seconds, label: 'Detik' }] as item (item.label)}
								<div>
									<strong>{String(item.value).padStart(2, '0')}</strong><span>{item.label}</span>
								</div>
							{/each}
						</div>
					</div>
				</section>
			{/if}

			<section class="seruni-section seruni-couple-section" aria-labelledby="seruni-couple-title">
				<div class="seruni-container">
					<header class="seruni-heading" data-seruni-reveal>
						<h2 id="seruni-couple-title">Mempelai</h2>
					</header>
					<div class="seruni-couple">
						{#each people as person, index (person.role)}
							{#if index === 1}<span class="seruni-couple-ampersand" aria-hidden="true">&amp;</span
								>{/if}
							<article class="seruni-person" data-seruni-reveal>
								<div class="seruni-portrait">
									<div class="seruni-portrait-wash" aria-hidden="true"></div>
									{#if person.photo}<img
											src={person.photo}
											alt={person.name}
											loading="lazy"
											decoding="async"
											width="400"
											height="400"
										/>{:else}<span class="seruni-initial" aria-hidden="true"
											>{person.name.charAt(0)}</span
										>{/if}
								</div>
								<h3>{person.name}</h3>
								{#if person.father || person.mother}<p>{person.relationship}</p>
									<p>
										{[person.father, person.mother]
											.filter(Boolean)
											.map(formatPersonName)
											.join(' & ')}
									</p>{/if}
							</article>
						{/each}
					</div>
				</div>
			</section>

			<section class="seruni-section seruni-events-section" aria-labelledby="seruni-events-title">
				<div class="seruni-container">
					<header class="seruni-heading" data-seruni-reveal>
						<h2 id="seruni-events-title">Waktu &amp; Tempat</h2>
					</header>
					<div class="seruni-events">
						{#each events as event, index (event.label)}
							<article
								class="seruni-event"
								class:seruni-event-peach={index === 1}
								data-seruni-reveal
							>
								<div class="seruni-event-wash" aria-hidden="true"></div>
								<h3>{event.label}</h3>
								<p class="seruni-event-date">{event.date.date}</p>
								<p class="seruni-event-time">{event.date.time}</p>
								{#if event.address}<p class="seruni-address">{event.address}</p>{/if}
								{#if event.maps}<a
										class="seruni-outline"
										href={event.maps}
										target="_blank"
										rel="noopener noreferrer">Buka Google Maps</a
									>{/if}
							</article>
						{/each}
					</div>
				</div>
			</section>

			{#if wedding.stories.length}
				<section
					class="seruni-section seruni-stories-section"
					aria-labelledby="seruni-stories-title"
				>
					<div class="seruni-wash seruni-wash-left" aria-hidden="true"></div>
					<div class="seruni-container">
						<header class="seruni-heading" data-seruni-reveal>
							<h2 id="seruni-stories-title">Cerita Kami</h2>
						</header>
						<div class="seruni-stories">
							{#each wedding.stories as story, index (story.id)}
								<article
									class="seruni-story"
									class:seruni-story-reverse={index % 2 === 1}
									class:seruni-story-text-only={!story.image_url}
								>
									{#if story.image_url}
										<figure class="seruni-polaroid" data-seruni-reveal>
											<img
												src={story.image_url}
												alt={story.title}
												width="600"
												height="720"
												loading="lazy"
												decoding="async"
											/>
											{#if story.date}<figcaption>{formatStoryDate(story.date)}</figcaption>{/if}
										</figure>
									{/if}
									<div class="seruni-story-copy" data-seruni-reveal>
										<p class="seruni-story-date">{formatStoryDate(story.date)}</p>
										<h3>{story.title}</h3>
										<p class="seruni-story-description">{story.content}</p>
									</div>
								</article>
							{/each}
						</div>
					</div>
				</section>
			{/if}

			{#if wedding.gallery.length}
				<section
					class="seruni-section seruni-gallery-section"
					aria-labelledby="seruni-gallery-title"
				>
					<div class="seruni-container">
						<header class="seruni-heading" data-seruni-reveal>
							<h2 id="seruni-gallery-title">Galeri</h2>
						</header>
						<div class="seruni-gallery">
							{#each wedding.gallery as photo, index (index)}
								<button
									type="button"
									aria-label={`Lihat foto galeri ${index + 1}`}
									onclick={(event) => showPhoto(index, event.currentTarget)}
									data-seruni-reveal
								>
									<img
										src={photo.url}
										alt={`Foto ${couple} ${index + 1}`}
										width="600"
										height="800"
										loading="lazy"
										decoding="async"
									/>
								</button>
							{/each}
						</div>
					</div>
				</section>
			{/if}

			{#key `${wedding.slug}:${token}`}<SeruniRsvp
					slug={wedding.slug}
					{token}
					onLayoutChange={() => motion?.refresh()}
				/>{/key}

			{#if wedding.gift_enabled && gifts.length}
				<section class="seruni-section seruni-gift-section" aria-labelledby="seruni-gifts-title">
					<div class="seruni-container">
						<header class="seruni-heading" data-seruni-reveal>
							<h2 id="seruni-gifts-title">Hadiah Pernikahan</h2>
						</header>
						<div class="seruni-gifts" data-seruni-reveal>
							{#each gifts as gift, index (index)}
								<article class="seruni-gift">
									<h3>{gift.provider || gift.name}</h3>
									<p class="seruni-account">{gift.number}</p>
									<p>{gift.owner || gift.name}</p>
									<button
										class="seruni-outline"
										type="button"
										onclick={() => copyAccount(gift.number)}>Salin nomor rekening</button
									>
								</article>
							{/each}
						</div>
						<p class="seruni-copy-feedback" role="status">{copyFeedback}</p>
					</div>
				</section>
			{/if}

			<footer class="seruni-footer">
				<div class="seruni-wash seruni-wash-right" aria-hidden="true"></div>
				<p class="seruni-footer-names">{couple}</p>
				<p class="seruni-footer-date">{eventDate.date}</p>
				<a href="https://wedez.id" target="_blank" rel="noopener noreferrer">Dibuat dengan Wedez</a>
			</footer>
		</div>
	{/if}

	{#if wedding.gallery.length}
		<dialog
			class="seruni-lightbox"
			bind:this={gallery}
			onclose={closeGallery}
			onkeydown={galleryKeys}
			aria-label="Galeri foto"
		>
			<div class="seruni-lightbox-bar">
				<p>{galleryIndex + 1} / {wedding.gallery.length}</p>
				<button type="button" onclick={() => gallery?.close()}>Tutup</button>
			</div>
			<img src={wedding.gallery[galleryIndex]?.url} alt={`Foto ${couple} ${galleryIndex + 1}`} />
			{#if wedding.gallery.length > 1}<div class="seruni-lightbox-controls">
					<button type="button" onclick={() => showPhoto(galleryIndex - 1)}>Sebelumnya</button
					><button type="button" onclick={() => showPhoto(galleryIndex + 1)}>Berikutnya</button>
				</div>{/if}
		</dialog>
	{/if}
	{#if wedding.music_url}
		<audio
			bind:this={audio}
			src={wedding.music_url}
			loop
			preload="none"
			onplay={() => {
				playing = true;
			}}
			onpause={() => {
				playing = false;
			}}
			onerror={() => {
				playing = false;
			}}
		></audio>
		{#if opened && !coverVisible}<button
				class="seruni-music"
				type="button"
				onclick={toggleMusic}
				aria-pressed={playing}>{playing ? 'Jeda musik' : 'Putar musik'}</button
			>{/if}
	{/if}
</main>
