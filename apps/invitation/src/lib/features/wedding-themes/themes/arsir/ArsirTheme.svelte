<script lang="ts">
	import { page } from '$app/state';
	import { onMount, tick, untrack } from 'svelte';
	import { getPublicGuestRsvp } from '#lib/features/guests/index.js';
	import type { WeddingThemeProps } from '../../model/wedding-theme.js';
	import {
		calculateCountdown,
		formatEventDate,
		formatPersonName,
		formatStoryDate,
		safeExternalURL
	} from '../../shared/theme-utils.js';
	import ArsirRsvp from './ArsirRsvp.svelte';
	import { mountArsirAnimations, type ArsirMotion } from './arsir-animations.js';
	import './arsir.css';

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
	const maps = $derived(safeExternalURL(wedding.maps));
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
		{ label: 'Akad Nikah', date: formatEventDate(wedding.akad) },
		{ label: 'Resepsi', date: formatEventDate(wedding.reception) }
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
	let giftsVisible = $state(false);
	let audio = $state<HTMLAudioElement>();
	let gallery = $state<HTMLDialogElement>();
	let galleryIndex = $state(0);
	let playing = $state(false);
	let coverVisible = $state(true);
	let opened = $state(false);
	let opening = $state(false);
	let countdown = $state(calculateCountdown(untrack(() => targetDate)));
	let copyFeedback = $state('');
	let motion: ArsirMotion | undefined;
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
		motion = mountArsirAnimations(root);
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
					root?.querySelector<HTMLElement>('.arsir-hero')?.focus({ preventScroll: true });
			});
		};
		if (motion) motion.open(complete);
		else complete();
	}
	async function toggleGifts() {
		giftsVisible = !giftsVisible;
		await tick();
		if (!disposed) motion?.refresh();
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

<main class="arsir-theme" bind:this={root}>
	{#if coverVisible}
		<section class="arsir-cover" aria-label="Sampul undangan">
			<div class="arsir-cover-media" aria-hidden="true">
				{#if cover}<img src={cover} alt="" fetchpriority="high" decoding="async" />{/if}
			</div>
			<div class="arsir-cover-grid" aria-hidden="true"></div>
			<div class="arsir-cover-content">
				<p class="arsir-cover-date">{eventDate.date}</p>
				<h1 class="arsir-cover-names" aria-label={couple}>
					<span aria-hidden="true">{groom}</span><i aria-hidden="true">&amp;</i><span
						aria-hidden="true">{bride}</span
					>
				</h1>
				<div class="arsir-recipient">
					<p>Kepada Bapak/Ibu/Saudara/i,</p>
					{#if recipient}<p class="arsir-recipient-name">{recipient}</p>{/if}
				</div>
				<div class="arsir-cover-bottom">
					{#if targetDate}
						<div class="arsir-countdown" role="timer" aria-label="Hitung mundur pernikahan">
							{#each [{ value: countdown.days, label: 'Hari' }, { value: countdown.hours, label: 'Jam' }, { value: countdown.minutes, label: 'Menit' }, { value: countdown.seconds, label: 'Detik' }] as item (item.label)}
								<div>
									<strong>{String(item.value).padStart(2, '0')}</strong><span>{item.label}</span>
								</div>
							{/each}
						</div>
					{/if}
					<button
						type="button"
						class="arsir-open-button"
						onclick={openInvitation}
						disabled={opening}>Buka Undangan</button
					>
				</div>
			</div>
		</section>
	{/if}

	{#if opened}
		<div class="arsir-content" inert={coverVisible}>
			<section class="arsir-hero" tabindex="-1" aria-label={couple}>
				<div class="arsir-stripe" aria-hidden="true"></div>
				<div class="arsir-hero-media" aria-hidden="true">
					{#if cover}<img src={cover} alt="" decoding="async" />{/if}
				</div>
				<div class="arsir-hero-fade" aria-hidden="true"></div>
			</section>

			{#if wedding.quote}
				<section class="arsir-quote-section" aria-label="Kutipan">
					<blockquote data-arsir-reveal>{wedding.quote}</blockquote>
				</section>
			{/if}

			<section
				class="arsir-section arsir-dark arsir-couple-section"
				aria-labelledby="arsir-couple-title"
			>
				<div class="arsir-container">
					<header class="arsir-heading" data-arsir-reveal>
						<h2 id="arsir-couple-title">Mempelai</h2>
					</header>
					<div class="arsir-couple">
						{#each people as person (person.role)}
							<article class="arsir-person" data-arsir-reveal>
								<p class="arsir-person-role">{person.role}</p>
								<div class="arsir-portrait">
									{#if person.photo}
										<img
											src={person.photo}
											alt={person.name}
											loading="lazy"
											decoding="async"
											width="400"
											height="560"
										/>
									{:else}<span class="arsir-initial" aria-hidden="true"
											>{person.name.charAt(0)}</span
										>{/if}
								</div>
								<h3>{person.name}</h3>
								{#if person.father || person.mother}
									<p>{person.relationship}</p>
									<p>
										{[person.father, person.mother]
											.filter(Boolean)
											.map(formatPersonName)
											.join(' & ')}
									</p>
								{/if}
							</article>
						{/each}
					</div>
				</div>
			</section>

			{#if wedding.stories.length}
				<section class="arsir-section arsir-stories-section" aria-labelledby="arsir-stories-title">
					<div class="arsir-container">
						<header class="arsir-heading" data-arsir-reveal>
							<h2 id="arsir-stories-title">Cerita Kami</h2>
						</header>
						<div class="arsir-stories">
							<div class="arsir-story-line" aria-hidden="true"><span></span></div>
							{#each wedding.stories as story (story.id)}
								<article class="arsir-story">
									<div class="arsir-story-marker" aria-hidden="true">
										{#if story.image_url}<img
												src={story.image_url}
												alt=""
												loading="lazy"
												decoding="async"
												width="120"
												height="120"
											/>{/if}
									</div>
									<div class="arsir-story-copy" data-arsir-reveal>
										{#if story.date}<p class="arsir-story-date">
												{formatStoryDate(story.date)}
											</p>{/if}
										<h3>{story.title}</h3>
										<p class="arsir-story-description">{story.content}</p>
									</div>
								</article>
							{/each}
						</div>
					</div>
				</section>
			{/if}

			<section
				class="arsir-section arsir-dark arsir-events-section"
				aria-labelledby="arsir-events-title"
			>
				<div class="arsir-container">
					<header class="arsir-heading" data-arsir-reveal>
						<h2 id="arsir-events-title">Waktu &amp; Tempat</h2>
					</header>
					<div class="arsir-events">
						{#each events as event (event.label)}
							<article class="arsir-event" data-arsir-reveal>
								<h3>{event.label}</h3>
								<p class="arsir-event-date">{event.date.date}</p>
								<p class="arsir-event-time">{event.date.time}</p>
								{#if wedding.address}<p class="arsir-address">{wedding.address}</p>{/if}
								{#if maps}<a
										class="arsir-outline"
										href={maps}
										target="_blank"
										rel="noopener noreferrer">Buka Google Maps</a
									>{/if}
							</article>
						{/each}
					</div>
				</div>
			</section>

			{#if wedding.gallery.length}
				<section class="arsir-section arsir-gallery-section" aria-labelledby="arsir-gallery-title">
					<div class="arsir-container">
						<header class="arsir-heading" data-arsir-reveal>
							<h2 id="arsir-gallery-title">Galeri</h2>
						</header>
						<div class="arsir-gallery">
							{#each wedding.gallery as photo, index (index)}
								<button
									type="button"
									aria-label={'Lihat foto galeri ' + (index + 1)}
									onclick={(event) => showPhoto(index, event.currentTarget)}
									data-arsir-photo
								>
									<img
										src={photo.url}
										alt={'Foto ' + couple + ' ' + (index + 1)}
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

			{#key wedding.slug + ':' + token}<ArsirRsvp
					slug={wedding.slug}
					{token}
					onLayoutChange={() => motion?.refresh()}
				/>{/key}

			{#if wedding.gift_enabled && gifts.length}
				<section class="arsir-section arsir-gift-section" aria-labelledby="arsir-gifts-title">
					<div class="arsir-container">
						<header class="arsir-heading" data-arsir-reveal>
							<h2 id="arsir-gifts-title">Hadiah Pernikahan</h2>
						</header>
						<button
							class="arsir-outline"
							type="button"
							aria-expanded={giftsVisible}
							aria-controls="arsir-gift-accounts"
							onclick={toggleGifts}>{giftsVisible ? 'Tutup rekening' : 'Lihat rekening'}</button
						>
						<div id="arsir-gift-accounts" class="arsir-gifts" hidden={!giftsVisible}>
							{#each gifts as gift, index (index)}
								<article class="arsir-gift">
									<h3>{gift.provider || gift.name}</h3>
									<p class="arsir-account">{gift.number}</p>
									<p>{gift.owner || gift.name}</p>
									<button
										class="arsir-outline"
										type="button"
										onclick={() => copyAccount(gift.number)}>Salin nomor rekening</button
									>
								</article>
							{/each}
						</div>
						<p class="arsir-copy-feedback" role="status">{copyFeedback}</p>
					</div>
				</section>
			{/if}

			<footer class="arsir-footer arsir-dark">
				<div class="arsir-footer-grid" aria-hidden="true"></div>
				<div class="arsir-footer-content" data-arsir-reveal>
					<p class="arsir-footer-names">{couple}</p>
					<p class="arsir-footer-date">{eventDate.date}</p>
					<a href="https://wedez.id" target="_blank" rel="noopener noreferrer"
						>Dibuat dengan Wedez</a
					>
				</div>
			</footer>
		</div>
	{/if}

	{#if wedding.gallery.length}
		<dialog
			class="arsir-lightbox"
			bind:this={gallery}
			onclose={closeGallery}
			onkeydown={galleryKeys}
			aria-label="Galeri foto"
		>
			<div class="arsir-lightbox-bar">
				<p>{galleryIndex + 1} / {wedding.gallery.length}</p>
				<button type="button" onclick={() => gallery?.close()}>Tutup</button>
			</div>
			<img src={wedding.gallery[galleryIndex]?.url} alt={`Foto ${couple} ${galleryIndex + 1}`} />
			{#if wedding.gallery.length > 1}<div class="arsir-lightbox-controls">
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
				class="arsir-music"
				type="button"
				onclick={toggleMusic}
				aria-pressed={playing}>{playing ? 'Jeda musik' : 'Putar musik'}</button
			>{/if}
	{/if}
</main>
