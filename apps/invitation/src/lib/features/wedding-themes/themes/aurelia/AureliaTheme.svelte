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
		getEventLocation
	} from '../../shared/theme-utils.js';
	import AureliaRsvp from './AureliaRsvp.svelte';
	import { mountAureliaAnimations, type AureliaMotion } from './aurelia-animations.js';
	import './aurelia.css';

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
	let motion: AureliaMotion | undefined;
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
		motion = mountAureliaAnimations(root);
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
					root?.querySelector<HTMLElement>('.aurelia-content')?.focus({ preventScroll: true });
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

<main class="aurelia-theme" bind:this={root}>
	<div class="aurelia-backdrop" aria-hidden="true"></div>
	{#if coverVisible}
		<section class="aurelia-cover" aria-label="Sampul undangan">
			<div class="aurelia-cover-card">
				{#if cover}
					<div class="aurelia-cover-photo">
						<img
							src={cover}
							alt={couple}
							width="120"
							height="120"
							fetchpriority="high"
							decoding="async"
						/>
					</div>
				{/if}
				<h1 class="aurelia-cover-names">{groom} &amp; {bride}</h1>
				<p class="aurelia-cover-date">{eventDate.date}</p>
				<div class="aurelia-recipient">
					<p>Kepada Bapak/Ibu/Saudara/i,</p>
					{#if recipient}<p class="aurelia-recipient-name">{recipient}</p>{/if}
				</div>
				{#if targetDate}
					<div class="aurelia-countdown" role="timer" aria-label="Hitung mundur pernikahan">
						{#each [{ value: countdown.days, label: 'Hari' }, { value: countdown.hours, label: 'Jam' }, { value: countdown.minutes, label: 'Menit' }, { value: countdown.seconds, label: 'Detik' }] as item (item.label)}
							<div>
								<strong>{String(item.value).padStart(2, '0')}</strong><span>{item.label}</span>
							</div>
						{/each}
					</div>
				{/if}
				<button
					type="button"
					class="aurelia-outline aurelia-open-button"
					onclick={openInvitation}
					disabled={opening}>Buka Undangan</button
				>
			</div>
		</section>
	{/if}

	{#if opened}
		<div class="aurelia-content" inert={coverVisible} tabindex="-1">
			{#if wedding.quote}
				<section class="aurelia-section aurelia-quote-section" aria-label="Kutipan">
					<div class="aurelia-quote aurelia-panel" data-aurelia-reveal>
						<blockquote>{wedding.quote}</blockquote>
					</div>
				</section>
			{/if}

			<section class="aurelia-section" aria-labelledby="aurelia-couple-title">
				<div class="aurelia-container">
					<header class="aurelia-heading" data-aurelia-reveal>
						<h2 id="aurelia-couple-title">Mempelai</h2>
					</header>
					<div class="aurelia-couple">
						{#each people as person, index (person.role)}
							{#if index === 1}<span class="aurelia-couple-ampersand" aria-hidden="true">&amp;</span
								>{/if}
							<article
								class="aurelia-person aurelia-panel"
								aria-label={person.role}
								data-aurelia-reveal
							>
								<div class="aurelia-portrait">
									{#if person.photo}<img
											src={person.photo}
											alt={person.name}
											loading="lazy"
											decoding="async"
											width="200"
											height="200"
										/>
									{:else}<span class="aurelia-initial" aria-hidden="true"
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

			<section class="aurelia-section" aria-labelledby="aurelia-events-title">
				<div class="aurelia-container">
					<header class="aurelia-heading" data-aurelia-reveal>
						<h2 id="aurelia-events-title">Waktu &amp; Tempat</h2>
					</header>
					<div class="aurelia-events">
						{#each events as event (event.label)}
							<article class="aurelia-event aurelia-panel" data-aurelia-reveal>
								<h3>{event.label}</h3>
								<p class="aurelia-event-date">{event.date.date}</p>
								<p class="aurelia-event-time">{event.date.time}</p>
								{#if event.address}<p class="aurelia-address">{event.address}</p>{/if}
								{#if event.maps}<a
										class="aurelia-outline"
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
				<section class="aurelia-section" aria-labelledby="aurelia-stories-title">
					<div class="aurelia-container">
						<header class="aurelia-heading" data-aurelia-reveal>
							<h2 id="aurelia-stories-title">Cerita Kami</h2>
						</header>
						<div class="aurelia-stories">
							<div class="aurelia-story-line" aria-hidden="true"><span></span></div>
							{#each wedding.stories as story (story.id)}
								<article class="aurelia-story">
									<div class="aurelia-story-marker" aria-hidden="true">
										{#if story.image_url}<img
												src={story.image_url}
												alt=""
												loading="lazy"
												decoding="async"
												width="120"
												height="120"
											/>{/if}
									</div>
									<div class="aurelia-story-copy aurelia-panel" data-aurelia-reveal>
										<h3>{story.title}</h3>
										{#if story.date}<p class="aurelia-story-date">
												{formatStoryDate(story.date)}
											</p>{/if}
										<p class="aurelia-story-description">{story.content}</p>
									</div>
								</article>
							{/each}
						</div>
					</div>
				</section>
			{/if}

			{#if wedding.gallery.length}
				<section class="aurelia-section" aria-labelledby="aurelia-gallery-title">
					<div class="aurelia-container">
						<header class="aurelia-heading" data-aurelia-reveal>
							<h2 id="aurelia-gallery-title">Galeri</h2>
						</header>
						<div class="aurelia-gallery">
							{#each wedding.gallery as photo, index (index)}
								<button
									type="button"
									aria-label={'Lihat foto galeri ' + (index + 1)}
									onclick={(event) => showPhoto(index, event.currentTarget)}
									data-aurelia-photo
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

			{#key wedding.slug + ':' + token}<AureliaRsvp
					slug={wedding.slug}
					{token}
					onLayoutChange={() => motion?.refresh()}
				/>{/key}

			{#if wedding.gift_enabled && gifts.length}
				<section class="aurelia-section aurelia-gift-section" aria-labelledby="aurelia-gifts-title">
					<div class="aurelia-container">
						<header class="aurelia-heading" data-aurelia-reveal>
							<h2 id="aurelia-gifts-title">Hadiah Pernikahan</h2>
						</header>
						<div class="aurelia-gifts">
							{#each gifts as gift, index (index)}
								<article class="aurelia-gift aurelia-panel">
									<h3>{gift.provider || gift.name}</h3>
									<p class="aurelia-account">{gift.number}</p>
									<p>{gift.owner || gift.name}</p>
									<button
										class="aurelia-outline"
										type="button"
										onclick={() => copyAccount(gift.number)}>Salin nomor rekening</button
									>
								</article>
							{/each}
						</div>
						<p class="aurelia-copy-feedback" role="status">{copyFeedback}</p>
					</div>
				</section>
			{/if}

			<footer class="aurelia-footer">
				<div class="aurelia-footer-card" data-aurelia-reveal>
					<p class="aurelia-footer-names">{couple}</p>
					<p class="aurelia-footer-date">{eventDate.date}</p>
					<a href="https://wedez.id" target="_blank" rel="noopener noreferrer"
						>Dibuat dengan Wedez</a
					>
				</div>
			</footer>
		</div>
	{/if}

	{#if wedding.gallery.length}
		<dialog
			class="aurelia-lightbox"
			bind:this={gallery}
			onclose={closeGallery}
			onkeydown={galleryKeys}
			aria-label="Galeri foto"
		>
			<div class="aurelia-lightbox-bar">
				<p>{galleryIndex + 1} / {wedding.gallery.length}</p>
				<button type="button" onclick={() => gallery?.close()}>Tutup</button>
			</div>
			<img src={wedding.gallery[galleryIndex]?.url} alt={`Foto ${couple} ${galleryIndex + 1}`} />
			{#if wedding.gallery.length > 1}<div class="aurelia-lightbox-controls">
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
				class="aurelia-music"
				type="button"
				onclick={toggleMusic}
				aria-pressed={playing}>{playing ? 'Jeda musik' : 'Putar musik'}</button
			>{/if}
	{/if}
</main>
