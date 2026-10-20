<script lang="ts">
	import { page } from '$app/state';
	import { onMount, tick, untrack } from 'svelte';
	import type { WeddingThemeProps } from '../../model/wedding-theme.js';
	import {
		calculateCountdown,
		formatEventDate,
		formatPersonName,
		formatStoryDate,
		getEventLocation
	} from '../../shared/theme-utils.js';
	import PramestiRsvp from './PramestiRsvp.svelte';
	import { mountPramestiAnimations, type PramestiMotion } from './pramesti-animations.js';
	import './pramesti.css';

	let { wedding }: WeddingThemeProps = $props();
	const groom = $derived(formatPersonName(wedding.groom_name) || 'Mempelai Pria');
	const bride = $derived(formatPersonName(wedding.bride_name) || 'Mempelai Wanita');
	const couple = $derived(`${groom} & ${bride}`);
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
	let audio = $state<HTMLAudioElement>();
	let gallery = $state<HTMLDialogElement>();
	let galleryIndex = $state(0);
	let playing = $state(false);
	let coverVisible = $state(true);
	let opened = $state(false);
	let opening = $state(false);
	let countdown = $state(calculateCountdown(untrack(() => targetDate)));
	let copyFeedback = $state('');
	let motion: PramestiMotion | undefined;
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
		motion = mountPramestiAnimations(root);
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
					root?.querySelector<HTMLElement>('.pramesti-hero')?.focus({ preventScroll: true });
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

<main class="pramesti-theme" bind:this={root}>
	{#if coverVisible}
		<section class="pramesti-cover" aria-label="Sampul undangan">
			<div class="pramesti-ambient" aria-hidden="true"></div>
			<div class="pramesti-cover-content">
				<p class="pramesti-eyebrow">Kepada Bapak/Ibu/Saudara/i,</p>
				<h1 class="pramesti-cover-names"><span>{groom}</span><i>&amp;</i><span>{bride}</span></h1>
				<div class="pramesti-cover-details">
					<p>{eventDate.date}</p>
				</div>
				<button class="pramesti-button" type="button" onclick={openInvitation} disabled={opening}
					>Buka Undangan</button
				>
			</div>
		</section>
	{/if}

	{#if opened}
		<div class="pramesti-scroll-wrapper">
			<div class="pramesti-content" data-theme-scroll-content inert={coverVisible}>
				<section class="pramesti-hero" tabindex="-1" aria-label={couple}>
					<div class="pramesti-ambient" aria-hidden="true"></div>
					<div class="pramesti-hero-content">
						<h2 class="pramesti-hero-names">
							<span data-intro>{groom}</span><i data-intro>&amp;</i><span data-intro>{bride}</span>
						</h2>
						<div class="pramesti-hero-details" data-intro>
							<p>{eventDate.date}</p>
						</div>
					</div>
				</section>

				{#if wedding.quote}
					<section class="pramesti-quote-section" aria-label="Kutipan">
						<blockquote class="pramesti-quote" data-pramesti-reveal>
							{wedding.quote}
						</blockquote>
					</section>
				{/if}

				{#if targetDate}
					<section
						class="pramesti-section pramesti-countdown-section"
						aria-labelledby="pramesti-countdown-title"
					>
						<header class="pramesti-heading" data-pramesti-reveal>
							<h2 id="pramesti-countdown-title">Menghitung Hari</h2>
							<p>{eventDate.date}</p>
						</header>
						<div
							class="pramesti-countdown"
							role="timer"
							aria-label="Hitung mundur pernikahan"
							data-pramesti-reveal
						>
							{#each [{ value: countdown.days, label: 'Hari' }, { value: countdown.hours, label: 'Jam' }, { value: countdown.minutes, label: 'Menit' }, { value: countdown.seconds, label: 'Detik' }] as item (item.label)}
								<div>
									<strong>{String(item.value).padStart(2, '0')}</strong><span>{item.label}</span>
								</div>
							{/each}
						</div>
					</section>
				{/if}

				<section class="pramesti-section" aria-labelledby="pramesti-couple-title">
					<header class="pramesti-heading" data-pramesti-reveal>
						<h2 id="pramesti-couple-title">Mempelai</h2>
					</header>
					<div class="pramesti-couple-grid">
						{#each people as person (person.role)}
							<article class="pramesti-panel pramesti-person" data-pramesti-reveal>
								{#if person.photo}<img
										src={person.photo}
										alt={person.name}
										loading="lazy"
										decoding="async"
										width="600"
										height="750"
									/>{/if}
								<div class="pramesti-person-details">
									<p class="pramesti-eyebrow">{person.role}</p>
									<h3>{person.name}</h3>
									{#if person.father || person.mother}<p>{person.relationship}</p>
										<p class="pramesti-parents">
											{[person.father, person.mother]
												.filter(Boolean)
												.map(formatPersonName)
												.join(' & ')}
										</p>{/if}
								</div>
							</article>
						{/each}
					</div>
				</section>

				<section class="pramesti-section" aria-labelledby="pramesti-events-title">
					<header class="pramesti-heading" data-pramesti-reveal>
						<h2 id="pramesti-events-title">Waktu &amp; Tempat</h2>
					</header>
					<div class="pramesti-event-grid">
						{#each events as event (event.label)}
							<article class="pramesti-panel pramesti-event" data-pramesti-reveal>
								<h3>{event.label}</h3>
								<div class="pramesti-event-rule"></div>
								<p class="pramesti-event-date">{event.date.date}</p>
								<p>{event.date.time}</p>
								{#if event.address}<p class="pramesti-address">{event.address}</p>{/if}
								{#if event.maps}<a
										class="pramesti-outline"
										href={event.maps}
										target="_blank"
										rel="noopener noreferrer">Buka Google Maps</a
									>{/if}
							</article>
						{/each}
					</div>
				</section>

				{#if wedding.gallery.length}
					<section
						class="pramesti-section pramesti-gallery-section"
						aria-labelledby="pramesti-gallery-title"
					>
						<header class="pramesti-heading" data-pramesti-reveal>
							<h2 id="pramesti-gallery-title">Galeri</h2>
						</header>
						<div class="pramesti-gallery">
							{#each wedding.gallery as photo, index (index)}
								<button
									type="button"
									aria-label={`Lihat foto galeri ${index + 1}`}
									onclick={(event) => showPhoto(index, event.currentTarget)}
									data-pramesti-reveal
									><img
										src={photo.url}
										alt={`Foto ${couple} ${index + 1}`}
										width="600"
										height="750"
										loading="lazy"
										decoding="async"
									/></button
								>
							{/each}
						</div>
					</section>
				{/if}

				{#if wedding.stories.length}
					<section class="pramesti-section" aria-labelledby="pramesti-stories-title">
						<header class="pramesti-heading" data-pramesti-reveal>
							<h2 id="pramesti-stories-title">Cerita Kami</h2>
						</header>
						<div class="pramesti-timeline">
							<div class="pramesti-timeline-line" aria-hidden="true">
								<div class="pramesti-timeline-progress"></div>
							</div>
							{#each wedding.stories as story, index (story.id)}
								<div class="pramesti-story-row" class:pramesti-story-reverse={index % 2 === 1}>
									<span class="pramesti-story-number" aria-hidden="true"
										>{String(index + 1).padStart(2, '0')}</span
									>
									<article class="pramesti-panel pramesti-story" data-pramesti-reveal>
										{#if story.image_url}<img
												src={story.image_url}
												alt={story.title}
												width="600"
												height="450"
												loading="lazy"
												decoding="async"
											/>{/if}
										<div>
											<p class="pramesti-story-date">{formatStoryDate(story.date)}</p>
											<h3>{story.title}</h3>
											<p class="pramesti-story-copy">{story.content}</p>
										</div>
									</article>
								</div>
							{/each}
						</div>
					</section>
				{/if}

				{#if wedding.gift_enabled && gifts.length}
					<section class="pramesti-section" aria-labelledby="pramesti-gifts-title">
						<header class="pramesti-heading" data-pramesti-reveal>
							<h2 id="pramesti-gifts-title">Hadiah Pernikahan</h2>
						</header>
						<div class="pramesti-gifts">
							{#each gifts as gift, index (index)}
								<article class="pramesti-panel pramesti-gift" data-pramesti-reveal>
									<h3>{gift.provider || gift.name}</h3>
									<div>
										<p class="pramesti-account">{gift.number}</p>
										<p>{gift.owner || gift.name}</p>
										<button
											class="pramesti-outline"
											type="button"
											onclick={() => copyAccount(gift.number)}>Salin nomor rekening</button
										>
									</div>
								</article>
							{/each}
						</div>
						<p class="pramesti-copy-feedback" role="status">{copyFeedback}</p>
					</section>
				{/if}

				{#key `${wedding.slug}:${token}`}<PramestiRsvp
						slug={wedding.slug}
						{token}
						onLayoutChange={() => motion?.refresh()}
					/>{/key}
				<footer class="pramesti-footer">
					<p>{couple}</p>
					<a href="https://wedez.id" target="_blank" rel="noopener noreferrer"
						>Dibuat dengan Wedez</a
					>
				</footer>
			</div>
		</div>
	{/if}

	{#if wedding.gallery.length}
		<dialog
			class="pramesti-lightbox"
			bind:this={gallery}
			onclose={closeGallery}
			onkeydown={galleryKeys}
			aria-label="Galeri foto"
		>
			<div class="pramesti-lightbox-bar">
				<p>{galleryIndex + 1} / {wedding.gallery.length}</p>
				<button type="button" onclick={() => gallery?.close()}>Tutup</button>
			</div>
			<img src={wedding.gallery[galleryIndex]?.url} alt={`Foto ${couple} ${galleryIndex + 1}`} />
			{#if wedding.gallery.length > 1}<div class="pramesti-lightbox-controls">
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
				class="pramesti-music"
				type="button"
				onclick={toggleMusic}
				aria-pressed={playing}>{playing ? 'Jeda musik' : 'Putar musik'}</button
			>{/if}
	{/if}
</main>
