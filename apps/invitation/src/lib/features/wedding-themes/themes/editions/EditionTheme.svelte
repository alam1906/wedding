<script lang="ts">
	import { page } from '$app/state';
	import { onMount, tick, untrack } from 'svelte';
	import { getPublicGuestRsvp } from '#lib/features/guests/index.js';
	import type { WeddingThemeProps } from '../../model/wedding-theme.js';
	import {
		calculateCountdown,
		formatEventCalendarDate,
		formatEventDate,
		formatPersonName,
		formatStoryDate,
		safeExternalURL
	} from '../../shared/theme-utils.js';
	import EditionRsvp from './EditionRsvp.svelte';
	import FloralFrame from '../floral/FloralFrame.svelte';
	import FloralOrnaments from '../floral/FloralOrnaments.svelte';
	import FloralPortrait from '../floral/FloralPortrait.svelte';
	import MinimalistCover from '../minimalist/MinimalistCover.svelte';
	import AdatCover from '../adat/AdatCover.svelte';
	import AdatPortrait from '../adat/AdatPortrait.svelte';
	import AdatOrnament from '../adat/AdatOrnament.svelte';
	import { mountEditionAnimations, type EditionMotion } from './edition-animations.js';
	import './edition.css';

	import { EDITION_PROFILES, type EditionKey, type EditionProfile } from './edition-profiles.js';
	let { wedding, theme }: WeddingThemeProps & { theme: EditionKey } = $props();
	const profile: EditionProfile = $derived(EDITION_PROFILES[theme]);
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
		{
			label: 'Akad Nikah',
			date: formatEventDate(wedding.akad),
			calendar: formatEventCalendarDate(wedding.akad)
		},
		{
			label: 'Resepsi',
			date: formatEventDate(wedding.reception),
			calendar: formatEventCalendarDate(wedding.reception)
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
	let motion: EditionMotion | undefined;
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
		motion = mountEditionAnimations(root, theme);
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
					root?.querySelector<HTMLElement>('.edition-content')?.focus({ preventScroll: true });
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

{#snippet names()}
	<span>{groom}</span><i aria-hidden="true">&amp;</i><span>{bride}</span>
{/snippet}
{#snippet timer()}
	<div class="edition-countdown" role="timer" aria-label="Hitung mundur pernikahan">
		{#each [{ value: countdown.days, label: 'Hari' }, { value: countdown.hours, label: 'Jam' }, { value: countdown.minutes, label: 'Menit' }, { value: countdown.seconds, label: 'Detik' }] as item (item.label)}
			<div><strong>{String(item.value).padStart(2, '0')}</strong><span>{item.label}</span></div>
		{/each}
	</div>
{/snippet}
{#snippet countdownSection()}
	{#if targetDate}
		<section class="edition-countdown-section" aria-label="Hitung mundur">
			{#if cover && theme !== 'swarna'}<img
					src={cover}
					alt=""
					loading="lazy"
					decoding="async"
				/>{/if}
			{@render timer()}
		</section>
	{/if}
{/snippet}
<main
	class={'edition-theme ' + theme}
	class:edition-narrow={profile.narrow}
	class:edition-concept={profile.concept}
	class:edition-floral={!!profile.floral}
	class:edition-minimalist={!!profile.minimalist}
	class:edition-adat={!!profile.adat}
	bind:this={root}
>
	<div class="edition-backdrop" aria-hidden="true">
		{#if profile.backdropPhoto && cover}<img src={cover} alt="" decoding="async" />{/if}
	</div>
	{#if profile.decoration === 'petals'}
		<div class="edition-petals" aria-hidden="true">
			{#each Array.from({ length: 12 }, (_, index) => index) as index (index)}<span
					style:--index={index}
				></span>{/each}
		</div>
	{/if}
	{#if profile.particles}
		<div class="edition-atmosphere" aria-hidden="true">
			{#each Array.from({ length: 14 }, (_, index) => index) as index (index)}<span
					style:--index={index}
				></span>{/each}
		</div>
	{/if}
	{#if coverVisible}
		<section class="edition-cover" aria-label="Sampul undangan">
			{#if profile.minimalist}
				<MinimalistCover
					variant={profile.minimalist}
					{cover}
					{couple}
					{names}
					date={eventDate.date}
					dateValue={wedding.reception || wedding.akad}
					{recipient}
					{opening}
					onopen={openInvitation}
				/>
			{:else if profile.adat}
				<AdatCover
					{theme}
					motif={profile.adat.motif}
					{cover}
					{couple}
					{names}
					date={eventDate.date}
					{recipient}
					{opening}
					onopen={openInvitation}
				/>
			{:else}
				{#if profile.decoration === 'lights'}
					<div class="edition-string-lights" aria-hidden="true">
						{#each [0, 1, 2, 3, 4, 5, 6, 7, 8] as index (index)}<span style:--index={index}
							></span>{/each}
					</div>
				{/if}
				{#if profile.cover === 'cinematic' || profile.cover === 'photo'}
					<div class="edition-cover-backdrop" aria-hidden="true">
						{#if cover}<img src={cover} alt="" fetchpriority="high" decoding="async" />{/if}
					</div>
				{/if}
				{#if profile.cover === 'gate'}<div class="edition-gates" aria-hidden="true">
						<span></span><span></span>
					</div>{/if}
				{#if profile.floral && profile.floral.frame !== 'hexagon'}
					<FloralOrnaments
						src={profile.floral.ornament}
						placement={['arch', 'rustic', 'garland'].includes(profile.floral.frame)
							? 'bottom'
							: 'corners'}
						eager
					/>
				{/if}
				<div class="edition-cover-card">
					{#if profile.floral?.frame === 'facets'}<FloralFrame facets />{/if}
					{#if profile.coverIllustration}<div class="edition-cover-illustration" aria-hidden="true">
							<img
								src={profile.coverIllustration}
								alt=""
								width="1280"
								height="1280"
								fetchpriority="high"
								decoding="async"
							/>
						</div>{/if}
					{#if cover && (profile.cover === 'arch' || profile.cover === 'cinematic' || profile.cover === 'album' || profile.cover === 'polaroid')}
						<div class="edition-cover-photo">
							<img
								src={cover}
								alt={couple}
								width="360"
								height="480"
								fetchpriority="high"
								decoding="async"
							/>
						</div>
					{/if}
					<div class="edition-cover-heading">
						{#if profile.floral?.frame === 'hexagon'}
							<FloralFrame />
							<FloralOrnaments src={profile.floral.ornament} placement="sides" eager />
						{/if}
						<h1 class="edition-cover-names" aria-label={couple}>{@render names()}</h1>
					</div>
					<p class="edition-cover-date">{eventDate.date}</p>
					<div class="edition-recipient">
						<p>Kepada Bapak/Ibu/Saudara/i,</p>
						{#if recipient}<p class="edition-recipient-name">{recipient}</p>{/if}
					</div>
					{#if targetDate && !profile.narrow && !profile.floral?.countdownAtEvents}{@render timer()}{/if}
					<button
						type="button"
						class="edition-outline edition-open-button"
						onclick={openInvitation}
						disabled={opening}
						>{#if profile.cover === 'seal'}<span class="edition-seal" aria-hidden="true"
								>{groom.charAt(0)}&amp;{bride.charAt(0)}</span
							>{/if}<span>Buka Undangan</span></button
					>
				</div>
			{/if}
		</section>
	{/if}

	{#if opened}
		<div class="edition-scroll-wrapper">
			<div class="edition-content" data-theme-scroll-content inert={coverVisible} tabindex="-1">
				{#if profile.hero !== 'none'}
					<section class={'edition-hero edition-hero-' + profile.hero} aria-label={couple}>
						{#if profile.adat && profile.adat.portrait !== 'plain'}
							<div class="edition-hero-media" data-edition-reveal>
								<AdatPortrait photo={cover} name={couple} frame={profile.adat.portrait} eager />
							</div>
						{:else if cover}<div class="edition-hero-media">
								<img src={cover} alt={couple} decoding="async" width="1200" height="900" />
							</div>{/if}
						<div class="edition-hero-copy">
							<p class="edition-hero-names" aria-label={couple}>{@render names()}</p>
							{#if profile.narrow || profile.floral || profile.minimalist || profile.adat}<p
									class="edition-hero-date"
								>
									{eventDate.date}
								</p>{/if}
						</div>
						{#if profile.floral}<FloralOrnaments
								src={profile.floral.ornament}
								placement={profile.floral.frame === 'garland' ? 'bottom' : 'corners'}
							/>{/if}
					</section>
				{/if}
				{#if wedding.quote}
					<section class="edition-section edition-quote-section" aria-label="Kutipan">
						<div class="edition-quote" data-edition-reveal>
							{#if profile.quotePhoto && cover}<div class="edition-quote-photo">
									<img
										src={cover}
										alt=""
										loading="lazy"
										decoding="async"
										width="640"
										height="400"
									/>
								</div>{/if}
							{#if theme === 'safira'}<p class="edition-monogram" aria-hidden="true">
									{groom.charAt(0)}&amp;{bride.charAt(0)}
								</p>{/if}
							<blockquote>{wedding.quote}</blockquote>
						</div>
					</section>
				{/if}
				<section
					class="edition-section edition-couple-section"
					aria-labelledby="edition-couple-title"
				>
					{#if profile.minimalist === 2}<img
							class="minimal-botanical-leaf minimal-section-leaf"
							src="/images/themes/minimalist/monstera.webp"
							alt=""
							aria-hidden="true"
							loading="lazy"
							width="800"
							height="800"
						/>{/if}
					{#if profile.floral}<FloralOrnaments
							src={profile.floral.ornament}
							placement="sides"
						/>{/if}
					<div class="edition-container">
						<header class="edition-heading" data-edition-reveal>
							<h2 id="edition-couple-title">Mempelai</h2>
						</header>
						<div class="edition-couple">
							{#each people as person, index (person.role)}
								{#if index === 1}<span class="edition-couple-ampersand" aria-hidden="true"
										>&amp;</span
									>{/if}
								<article class="edition-person" aria-label={person.role} data-edition-reveal>
									{#if profile.floral}
										<FloralPortrait
											photo={person.photo}
											name={person.name}
											ornament={profile.floral.ornament}
										/>
									{:else if profile.adat && profile.adat.portrait !== 'plain'}
										<AdatPortrait
											photo={person.photo}
											name={person.name}
											frame={profile.adat.portrait}
										/>
									{:else}
										<div class="edition-portrait">
											{#if person.photo}<img
													src={person.photo}
													alt={person.name}
													loading="lazy"
													decoding="async"
													width="480"
													height="640"
												/>{:else}<span class="edition-initial" aria-hidden="true"
													>{person.name.charAt(0)}</span
												>{/if}
										</div>
									{/if}
									<div class="edition-person-copy">
										<h3>{person.name}</h3>
										{#if person.father || person.mother}<p>{person.relationship}</p>
											<p>
												{[person.father, person.mother]
													.filter(Boolean)
													.map(formatPersonName)
													.join(' & ')}
											</p>{/if}
									</div>
								</article>
							{/each}
						</div>
					</div>
				</section>
				{#if theme === 'swarna'}{@render countdownSection()}{/if}
				<section
					class="edition-section edition-events-section"
					aria-labelledby="edition-events-title"
				>
					{#if profile.adat}<AdatOrnament motif={profile.adat.motif} />{/if}
					{#if profile.floral}<FloralOrnaments
							src={profile.floral.ornament}
							placement="corners"
						/>{/if}
					<div class="edition-container">
						<header class="edition-heading" data-edition-reveal>
							<h2 id="edition-events-title">Waktu &amp; Tempat</h2>
						</header>
						{#if (profile.floral?.countdownAtEvents || profile.minimalist || profile.adat) && targetDate}{@render timer()}{/if}
						<div class="edition-events">
							{#each events as event (event.label)}
								<article class="edition-event edition-panel" data-edition-reveal>
									<h3>{event.label}</h3>
									{#if profile.calendar && event.calendar}
										<div class="edition-calendar">
											<p>{event.calendar.weekday}</p>
											<strong>{event.calendar.day}</strong>
											<p>{event.calendar.monthYear}</p>
										</div>
									{:else}<p class="edition-event-date">{event.date.date}</p>{/if}
									<p class="edition-event-time">{event.date.time}</p>
									{#if wedding.address}<p class="edition-address">{wedding.address}</p>{/if}
									{#if maps}<a
											class="edition-outline"
											href={maps}
											target="_blank"
											rel="noopener noreferrer">Buka Google Maps</a
										>{/if}
								</article>
							{/each}
						</div>
					</div>
				</section>
				{#if profile.narrow && theme !== 'swarna' && !profile.adat}{@render countdownSection()}{/if}
				{#if wedding.stories.length}
					<section
						class="edition-section edition-stories-section"
						aria-labelledby="edition-stories-title"
					>
						<div class="edition-container">
							<header class="edition-heading" data-edition-reveal>
								<h2 id="edition-stories-title">Cerita Kami</h2>
							</header>
							<!-- svelte-ignore a11y_no_noninteractive_tabindex (The horizontal story scroller needs keyboard focus for native arrow-key scrolling.) -->
							<div
								class={'edition-stories edition-stories-' + profile.story}
								role={profile.story === 'filmstrip' ? 'region' : undefined}
								tabindex={profile.story === 'filmstrip' ? 0 : undefined}
								aria-label={profile.story === 'filmstrip' ? 'Cerita Kami' : undefined}
							>
								{#if profile.story === 'timeline' || profile.story === 'timeline-cards'}<div
										class="edition-story-line"
										aria-hidden="true"
									>
										<span></span>
									</div>{/if}
								{#each wedding.stories as story (story.id)}
									<article class="edition-story" data-edition-reveal>
										{#if story.image_url}<div class="edition-story-photo">
												<img
													src={story.image_url}
													alt={story.title}
													loading="lazy"
													decoding="async"
													width="600"
													height="400"
												/>
											</div>{:else if profile.story === 'timeline' || profile.story === 'timeline-cards'}<span
												class="edition-story-marker"
												aria-hidden="true"
											></span>{/if}
										<div class="edition-story-copy">
											<h3>{story.title}</h3>
											{#if story.date}<p class="edition-story-date">
													{formatStoryDate(story.date)}
												</p>{/if}
											<p class="edition-story-description">{story.content}</p>
										</div>
									</article>
								{/each}
							</div>
						</div>
					</section>
				{/if}

				{#if wedding.gallery.length}
					<section
						class="edition-section edition-gallery-section"
						aria-labelledby="edition-gallery-title"
					>
						<div class="edition-container">
							<header class="edition-heading" data-edition-reveal>
								<h2 id="edition-gallery-title">Galeri</h2>
							</header>
							<div class="edition-gallery">
								{#each wedding.gallery as photo, index (index)}
									<button
										type="button"
										aria-label={'Lihat foto galeri ' + (index + 1)}
										onclick={(event) => showPhoto(index, event.currentTarget)}
										data-edition-photo
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

				{#key wedding.slug + ':' + token}<EditionRsvp
						slug={wedding.slug}
						{token}
						onLayoutChange={() => motion?.refresh()}
					/>{/key}

				{#if wedding.gift_enabled && gifts.length}
					<section
						class="edition-section edition-gift-section"
						aria-labelledby="edition-gifts-title"
					>
						<div class="edition-container">
							<header class="edition-heading" data-edition-reveal>
								<h2 id="edition-gifts-title">Hadiah Pernikahan</h2>
							</header>
							<button
								class="edition-outline"
								type="button"
								aria-expanded={giftsVisible}
								aria-controls="edition-gift-accounts"
								onclick={toggleGifts}>{giftsVisible ? 'Tutup rekening' : 'Lihat rekening'}</button
							>
							<div id="edition-gift-accounts" class="edition-gifts" hidden={!giftsVisible}>
								{#each gifts as gift, index (index)}
									<article class="edition-gift edition-panel">
										<h3>{gift.provider || gift.name}</h3>
										<p class="edition-account">{gift.number}</p>
										<p>{gift.owner || gift.name}</p>
										<button
											class="edition-outline"
											type="button"
											onclick={() => copyAccount(gift.number)}>Salin nomor rekening</button
										>
									</article>
								{/each}
							</div>
							<p class="edition-copy-feedback" role="status">{copyFeedback}</p>
						</div>
					</section>
				{/if}

				<footer class="edition-footer">
					{#if profile.adat}<AdatOrnament motif={profile.adat.motif} />{/if}
					<div class="edition-footer-card" data-edition-reveal>
						<p class="edition-footer-names">{couple}</p>
						<p class="edition-footer-date">{eventDate.date}</p>
						<a href="https://wedez.id" target="_blank" rel="noopener noreferrer"
							>Dibuat dengan Wedez</a
						>
					</div>
				</footer>
			</div>
		</div>
	{/if}

	{#if wedding.gallery.length}
		<dialog
			class="edition-lightbox"
			bind:this={gallery}
			onclose={closeGallery}
			onkeydown={galleryKeys}
			aria-label="Galeri foto"
		>
			<div class="edition-lightbox-bar">
				<p>{galleryIndex + 1} / {wedding.gallery.length}</p>
				<button type="button" onclick={() => gallery?.close()}>Tutup</button>
			</div>
			<img src={wedding.gallery[galleryIndex]?.url} alt={`Foto ${couple} ${galleryIndex + 1}`} />
			{#if wedding.gallery.length > 1}<div class="edition-lightbox-controls">
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
				class="edition-music"
				type="button"
				onclick={toggleMusic}
				aria-pressed={playing}>{playing ? 'Jeda musik' : 'Putar musik'}</button
			>{/if}
	{/if}
</main>
