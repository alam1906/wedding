<script lang="ts">
	import { page } from '$app/state';
	import { onMount, tick, untrack } from 'svelte';
	import type { WeddingThemeProps } from '../../model/wedding-theme.js';
	import { fitCoupleHeading } from '../../shared/fit-couple-heading.js';
	import {
		calculateCountdown,
		formatEventDate,
		formatPersonName,
		formatStoryDate,
		safeExternalURL
	} from '../../shared/theme-utils.js';
	import AnomaliRsvp from './AnomaliRsvp.svelte';
	import { mountAnomaliAnimations, type AnomaliMotion } from './anomali-animations.js';

	let { wedding }: WeddingThemeProps = $props();
	const groom = $derived(formatPersonName(wedding.groom_name) || 'Mempelai Pria');
	const bride = $derived(formatPersonName(wedding.bride_name) || 'Mempelai Wanita');
	const couple = $derived(groom + ' & ' + bride);
	const targetDate = $derived(wedding.akad || wedding.reception || '');
	const eventDate = $derived(formatEventDate(wedding.reception || wedding.akad));
	const maps = $derived(safeExternalURL(wedding.maps));
	const token = $derived(page.url.searchParams.get('rsvp')?.trim() ?? '');
	const cover = $derived(
		wedding.cover_url ||
			wedding.groom_photo_url ||
			wedding.bride_photo_url ||
			wedding.gallery[0]?.url ||
			''
	);
	const giftAccounts = $derived(
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
		].filter((account) => account.number)
	);
	const galleryBatches = $derived(
		Array.from({ length: Math.ceil(wedding.gallery.length / 4) }, (_, batch) =>
			wedding.gallery.slice(batch * 4, batch * 4 + 4).map((photo, index) => ({
				...photo,
				index: batch * 4 + index
			}))
		)
	);
	const wordSeparator = ' ';
	let root = $state<HTMLElement>();
	let music = $state<HTMLAudioElement>();
	let musicPlaying = $state(false);
	let gallery = $state<HTMLDialogElement>();
	let galleryIndex = $state(0);
	let opened = $state(false);
	let opening = $state(false);
	let mounted = $state(false);
	let countdown = $state(calculateCountdown(untrack(() => targetDate)));
	let motion: AnomaliMotion | undefined;
	let releaseScroll: () => void = () => undefined;
	let galleryOverflow: string | undefined;
	let photoOrigin: HTMLButtonElement | undefined;
	let disposed = false;

	onMount(() => {
		if (!root) return;
		mounted = true;
		const html = document.documentElement;
		const body = document.body;
		const previous = {
			htmlOverflow: html.style.overflow,
			bodyOverflow: body.style.overflow,
			scrollBehavior: html.style.scrollBehavior,
			restoration: window.history.scrollRestoration
		};
		let locked = true;
		html.style.scrollBehavior = 'auto';
		window.history.scrollRestoration = 'manual';
		window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
		html.style.overflow = 'hidden';
		body.style.overflow = 'hidden';
		releaseScroll = () => {
			if (!locked) return;
			locked = false;
			html.style.overflow = previous.htmlOverflow;
			body.style.overflow = previous.bodyOverflow;
		};
		motion = mountAnomaliAnimations(root);
		const interval = window.setInterval(() => {
			countdown = calculateCountdown(targetDate);
		}, 1000);
		return () => {
			disposed = true;
			window.clearInterval(interval);
			motion?.destroy();
			music?.pause();
			if (galleryOverflow !== undefined) body.style.overflow = galleryOverflow;
			releaseScroll();
			html.style.scrollBehavior = previous.scrollBehavior;
			window.history.scrollRestoration = previous.restoration;
		};
	});

	async function playMusic(): Promise<void> {
		try {
			await music?.play();
		} catch {
			musicPlaying = false;
		}
	}

	function toggleMusic(): void {
		if (music?.paused) void playMusic();
		else music?.pause();
	}

	async function openInvitation(): Promise<void> {
		if (opening) return;
		opening = true;
		opened = true;
		releaseScroll();
		void playMusic();
		await tick();
		if (disposed) return;
		const section = root?.querySelector<HTMLElement>('.couple-section');
		if (!section) {
			opening = false;
			return;
		}
		const complete = () => {
			if (disposed) return;
			opening = false;
			section.focus({ preventScroll: true });
		};
		if (motion) motion.open(section, complete);
		else {
			section.scrollIntoView({ behavior: 'instant' });
			complete();
		}
	}

	function showPhoto(index: number, origin?: HTMLButtonElement): void {
		if (!gallery || !wedding.gallery.length) return;
		galleryIndex = (index + wedding.gallery.length) % wedding.gallery.length;
		if (!gallery.open) {
			photoOrigin = origin;
			galleryOverflow = document.body.style.overflow;
			document.body.style.overflow = 'hidden';
			gallery.showModal();
		}
		motion?.revealPhoto();
	}

	function galleryClosed(): void {
		if (galleryOverflow !== undefined) {
			document.body.style.overflow = galleryOverflow;
			galleryOverflow = undefined;
		}
		photoOrigin?.focus({ preventScroll: true });
	}

	function galleryKeys(event: KeyboardEvent): void {
		if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
		event.preventDefault();
		showPhoto(galleryIndex + (event.key === 'ArrowRight' ? 1 : -1));
	}
</script>

{#snippet splitTitle(text: string)}
	<span class="heading-letters" aria-hidden="true">
		{#each text.split(' ') as word, wordIndex (wordIndex)}
			<span class="heading-word"
				>{#each Array.from(word) as letter, letterIndex (letterIndex)}<span data-heading-letter
						>{letter}</span
					>{/each}</span
			>{wordSeparator}
		{/each}
	</span>
{/snippet}

<main class="anomali-theme" bind:this={root}>
	<div class="theme-scroll-wrapper">
		<div data-theme-scroll-content>
			<section class="cover-section" aria-label="Sampul undangan">
				<div class="cover-media" aria-hidden="true">
					<div class="cover-image-scroll">
						{#if cover}
							<img class="cover-image" src={cover} alt="" fetchpriority="high" draggable="false" />
						{:else}
							<div class="photo-fallback">{groom.charAt(0)}<i>&amp;</i>{bride.charAt(0)}</div>
						{/if}
					</div>
				</div>
				<div class="cover-shade" aria-hidden="true"></div>
				<div class="cover-curtain curtain-left" aria-hidden="true"></div>
				<div class="cover-curtain curtain-right" aria-hidden="true"></div>
				<div class="cover-content">
					<p class="cover-greeting">Kepada Bapak/Ibu/Saudara/i,</p>
					<div class="hero-title-track">
						<h1 aria-label={couple} {@attach fitCoupleHeading}>
							<span class="name-mask"
								><span class="hero-name name-groom" aria-hidden="true"
									>{#each Array.from(groom) as letter, index (index)}<span data-name-letter
											>{letter === ' ' ? '\u00a0' : letter}</span
										>{/each}</span
								></span
							>
							<span class="hero-ampersand" aria-hidden="true">&amp;</span>
							<span class="name-mask"
								><span class="hero-name name-bride" aria-hidden="true"
									>{#each Array.from(bride) as letter, index (index)}<span data-name-letter
											>{letter === ' ' ? '\u00a0' : letter}</span
										>{/each}</span
								></span
							>
						</h1>
					</div>
					<div class="cover-bottom">
						<div class="countdown-block">
							<p>{eventDate.date}</p>
							{#if targetDate}
								<div class="countdown" role="timer" aria-label="Hitung mundur pernikahan">
									{#each [{ value: countdown.days, label: 'Hari' }, { value: countdown.hours, label: 'Jam' }, { value: countdown.minutes, label: 'Menit' }, { value: countdown.seconds, label: 'Detik' }] as item (item.label)}
										<div class="countdown-cell">
											<strong>{String(item.value).padStart(2, '0')}</strong><span>{item.label}</span
											>
										</div>
									{/each}
								</div>
							{/if}
						</div>
						<button class="open-button" type="button" onclick={openInvitation} disabled={opening}>
							Buka Undangan
						</button>
					</div>
				</div>
			</section>

			<div class="invitation-content" inert={mounted && !opened}>
				<section class="couple-section section-space" tabindex="-1" aria-label="Mempelai">
					<h2 class="section-title couple-title" data-split-heading aria-label="Mempelai">
						{@render splitTitle('Mempelai')}
					</h2>
					<div class="couple-grid">
						{#each [{ name: groom, image: wedding.groom_photo_url, father: wedding.groom_father_name, mother: wedding.groom_mother_name, label: 'Putra dari' }, { name: bride, image: wedding.bride_photo_url, father: wedding.bride_father_name, mother: wedding.bride_mother_name, label: 'Putri dari' }] as person, index (index)}
							<article class="person-card" data-person>
								<div class="portrait-frame">
									<div class="portrait-window">
										{#if person.image}<img
												src={person.image}
												alt={person.name}
												loading="lazy"
												draggable="false"
											/>{:else}<div class="photo-fallback">{person.name.charAt(0)}</div>{/if}
									</div>
								</div>
								<div class="person-copy">
									<h3>{person.name}</h3>
									{#if person.father || person.mother}
										<p>
											{person.label}<br /><span
												>{formatPersonName(person.father)}{person.father && person.mother
													? ' & '
													: ''}{formatPersonName(person.mother)}</span
											>
										</p>
									{/if}
								</div>
							</article>
						{/each}
					</div>
				</section>

				<section class="event-section section-space" aria-label="Waktu dan tempat">
					{#if cover}<div class="event-backdrop" aria-hidden="true">
							<img src={cover} alt="" loading="lazy" />
						</div>{/if}
					<div class="event-content">
						<h2 class="section-title event-title" data-split-heading aria-label="Waktu & tempat">
							{@render splitTitle('Waktu & tempat')}
						</h2>
						<div class="event-grid">
							{#each [{ label: 'Akad Nikah', value: wedding.akad }, { label: 'Resepsi', value: wedding.reception }] as event, index (index)}
								{@const date = formatEventDate(event.value)}
								<article class="event-ticket" data-event-ticket>
									<p class="small-label">{event.label}</p>
									<h3>{date.date}</h3>
									<p class="event-time">{date.time}</p>
									<div class="ticket-rule" data-rule aria-hidden="true"></div>
									{#if wedding.address}<p class="event-address">{wedding.address}</p>{/if}
								</article>
							{/each}
						</div>
						{#if maps}<a class="maps-button" href={maps} target="_blank" rel="noreferrer"
								>Buka Google Maps</a
							>{/if}
					</div>
				</section>

				{#if wedding.quote.trim()}
					<section class="quote-section" aria-label="Kutipan">
						<div class="quote-stage" data-quote-stage>
							<div class="quote-rule" data-quote-rule aria-hidden="true"></div>
							<blockquote aria-label={wedding.quote}>
								<span aria-hidden="true"
									>{#each wedding.quote.trim().split(/\s+/u) as word, index (index)}<span
											class="quote-word"
											data-quote-word>{word}</span
										>{wordSeparator}{/each}</span
								>
							</blockquote>
							<div class="quote-rule" data-quote-rule aria-hidden="true"></div>
						</div>
					</section>
				{/if}

				{#if wedding.stories.length}
					<section class="story-section section-space" aria-label="Cerita Kami">
						<h2 class="section-title story-title" data-split-heading aria-label="Cerita Kami">
							{@render splitTitle('Cerita Kami')}
						</h2>
						<div class="stories">
							<div class="story-track" aria-hidden="true"><span data-story-progress></span></div>
							{#each wedding.stories as story, index (story.id)}
								<article class="story-card" class:without-photo={!story.image_url} data-story>
									{#if story.image_url}
										<div class="story-visual">
											<img
												src={story.image_url}
												alt={story.title || 'Cerita ' + (index + 1)}
												loading="lazy"
												draggable="false"
											/>
										</div>
									{/if}
									<div class="story-copy">
										<h3>{story.title || 'Cerita ' + (index + 1)}</h3>
										{#if story.date}<time datetime={story.date}>{formatStoryDate(story.date)}</time
											>{/if}
										{#if story.content}<p>{story.content}</p>{/if}
									</div>
								</article>
							{/each}
						</div>
					</section>
				{/if}

				{#if wedding.gallery.length}
					<section class="gallery-section section-space" aria-label="Galeri kami">
						<h2 class="section-title gallery-title" data-split-heading aria-label="Galeri kami">
							{@render splitTitle('Galeri kami')}
						</h2>
						<div class="gallery-batches">
							{#each galleryBatches as photos, batch (batch)}
								<div class="gallery-batch" data-gallery-batch data-count={photos.length}>
									{#each photos as photo (photo.index)}
										<div class="gallery-slot">
											<button
												class="gallery-card"
												type="button"
												data-gallery-card
												aria-label={'Perbesar foto ' + (photo.index + 1)}
												onclick={(event) => showPhoto(photo.index, event.currentTarget)}
											>
												<img
													class="gallery-image"
													src={photo.url}
													alt={'Galeri pernikahan ' + (photo.index + 1)}
													loading="lazy"
													draggable="false"
												/>
											</button>
										</div>
									{/each}
								</div>
							{/each}
						</div>
					</section>
				{/if}

				{#if wedding.gift_enabled && giftAccounts.length}
					<section class="gift-section section-space" aria-label="Hadiah">
						<h2 class="section-title gift-title" data-split-heading aria-label="Hadiah">
							{@render splitTitle('Hadiah')}
						</h2>
						<div class="gift-grid">
							{#each giftAccounts as account, index (index)}
								<article class="gift-card" data-gift>
									<p class="small-label">{account.name}</p>
									<h3>{account.provider || 'Rekening / e-wallet'}</h3>
									<p class="account-number">{account.number}</p>
									{#if account.owner}
										<p class="account-owner">Atas nama {account.owner}</p>
									{/if}
								</article>
							{/each}
						</div>
					</section>
				{/if}

				<section class="rsvp-section section-space" aria-label="RSVP dan ucapan">
					<h2 class="section-title rsvp-title" data-split-heading aria-label="Ucapan & Doa">
						{@render splitTitle('Ucapan & Doa')}
					</h2>
					{#key wedding.id + ':' + token}
						<AnomaliRsvp slug={wedding.slug} {token} onLayoutChange={() => motion?.refresh()} />
					{/key}
				</section>

				<footer class="closing-section section-space">
					{#if cover}<div class="closing-photo" aria-hidden="true">
							<img src={cover} alt="" loading="lazy" />
						</div>{/if}
					<div class="closing-copy">
						<p>Terima kasih atas doa dan kehadiran Anda</p>
						<h2 aria-label={couple}><span>{groom}</span><i>&amp;</i><span>{bride}</span></h2>
						<small>Dibuat dengan Wedez</small>
					</div>
				</footer>
			</div>
		</div>
	</div>
	{#if wedding.music_url}
		<audio
			bind:this={music}
			src={wedding.music_url}
			loop
			preload="none"
			onplay={() => (musicPlaying = true)}
			onpause={() => (musicPlaying = false)}
		></audio>
		{#if opened}<button
				class="music-button"
				type="button"
				onclick={toggleMusic}
				aria-pressed={musicPlaying}>{musicPlaying ? 'Jeda musik' : 'Putar musik'}</button
			>{/if}
	{/if}

	<dialog
		class="photo-dialog"
		bind:this={gallery}
		aria-label="Galeri foto"
		onclose={galleryClosed}
		onkeydown={galleryKeys}
	>
		<div class="photo-dialog-top">
			<span>{galleryIndex + 1} / {wedding.gallery.length}</span>
			<button type="button" onclick={() => gallery?.close()}>Tutup</button>
		</div>
		<img src={wedding.gallery[galleryIndex]?.url} alt={'Galeri pernikahan ' + (galleryIndex + 1)} />
		{#if wedding.gallery.length > 1}
			<div class="photo-dialog-nav">
				<button type="button" onclick={() => showPhoto(galleryIndex - 1)}>Sebelumnya</button>
				<button type="button" onclick={() => showPhoto(galleryIndex + 1)}>Berikutnya</button>
			</div>
		{/if}
	</dialog>
</main>

<style>
	.anomali-theme {
		--a-paper: #f7f4ee;
		--a-surface: #fffdf8;
		--a-ink: #233b32;
		--a-muted: #5f6c62;
		--a-accent: #a2875e;
		--a-soft: #e9ece4;
		--a-line: #a2875e45;
		position: relative;
		isolation: isolate;
		overflow-x: clip;
		background: var(--a-paper);
		color: var(--a-ink);
		font-family: Inter, 'Helvetica Neue', Arial, sans-serif;
	}
	.anomali-theme :global(*) {
		box-sizing: border-box;
	}
	.anomali-theme :global(::selection) {
		background: #d9c8a8;
		color: #182b24;
	}
	.anomali-theme :global(:focus-visible) {
		outline: 2px solid #bba37e;
		outline-offset: 5px;
	}
	h1,
	h2,
	h3,
	p {
		margin: 0;
	}
	button,
	a {
		-webkit-tap-highlight-color: transparent;
	}
	button {
		font: inherit;
		cursor: pointer;
	}
	button:disabled {
		cursor: default;
		opacity: 0.65;
	}
	img {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.section-space {
		padding: clamp(4.5rem, 8vw, 8rem) max(1.5rem, calc((100% - 1140px) / 2));
	}
	.section-title {
		position: relative;
		font:
			400 clamp(2.45rem, 4.6vw, 4.4rem)/1.13 Georgia,
			'Times New Roman',
			serif;
		letter-spacing: -0.045em;
		text-align: center;
		margin-bottom: clamp(2.5rem, 5vw, 4.5rem);
		text-wrap: balance;
	}
	.heading-word {
		display: inline-block;
		white-space: nowrap;
		overflow: clip;
		vertical-align: bottom;
		padding-block: 0.09em;
	}
	.heading-word [data-heading-letter] {
		display: inline-block;
	}
	.small-label {
		font-size: 0.68rem;
		font-weight: 500;
		letter-spacing: 0.16em;
		text-transform: uppercase;
	}
	.cover-section {
		position: relative;
		display: grid;
		place-items: center;
		height: 100dvh;
		min-height: 0;
		overflow: clip;
		padding: max(1.2rem, env(safe-area-inset-top)) 1.5rem max(1.2rem, env(safe-area-inset-bottom));
		background: var(--a-ink);
		color: var(--a-surface);
	}
	.cover-media,
	.cover-image-scroll,
	.cover-shade {
		position: absolute;
		inset: 0;
	}
	.cover-media {
		overflow: clip;
	}
	.cover-image-scroll {
		inset: -5% -1%;
	}
	.cover-shade {
		background: #10241d85;
	}
	.cover-curtain {
		position: absolute;
		top: 0;
		bottom: 0;
		width: 50.1%;
		background: var(--a-ink);
		z-index: 2;
		transform: scaleX(0);
		pointer-events: none;
	}
	.curtain-left {
		left: 0;
		transform-origin: left center;
	}
	.curtain-right {
		right: 0;
		transform-origin: right center;
	}
	.cover-content {
		position: relative;
		z-index: 3;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: clamp(1.15rem, 3.2dvh, 2rem);
		width: min(100%, 68rem);
		text-align: center;
	}
	.cover-greeting {
		font-size: clamp(0.65rem, 1.2vw, 0.8rem);
		letter-spacing: 0.1em;
		line-height: 1.6;
	}
	.hero-title-track {
		width: 100%;
	}
	h1 {
		width: 100%;
		font:
			400 clamp(2.8rem, min(8vw, 12dvh), 7.5rem)/1.08 Georgia,
			'Times New Roman',
			serif;
		letter-spacing: -0.055em;
	}
	.name-mask {
		display: block;
		overflow: clip;
		padding: 0.04em 0 0.12em;
	}
	.hero-name {
		display: inline-block;
		font-size: var(--hero-stacked-font-size, 1em);
		white-space: nowrap;
	}
	.hero-name [data-name-letter] {
		display: inline-block;
	}
	.hero-ampersand {
		display: block;
		margin: -0.04em 0;
		font-size: 0.43em;
		font-weight: 400;
		font-style: italic;
		line-height: 1.1;
		color: #dfccaa;
	}
	.cover-bottom {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: clamp(1.2rem, 3.5dvh, 2.5rem);
	}
	.countdown-block > p {
		font-size: clamp(0.72rem, 1.2vw, 0.88rem);
		letter-spacing: 0.12em;
		margin-bottom: clamp(0.85rem, 2.2dvh, 1.5rem);
	}
	.countdown {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
	}
	.countdown-cell {
		display: grid;
		gap: 0.45rem;
		min-width: clamp(4rem, 7.5vw, 6rem);
		padding-inline: 1rem;
	}
	.countdown-cell + .countdown-cell {
		border-left: 1px solid #fffdf83d;
	}
	.countdown strong {
		font:
			400 clamp(1.7rem, 4dvh, 2.65rem)/1 Georgia,
			serif;
		font-variant-numeric: tabular-nums;
	}
	.countdown span {
		font-size: 0.6rem;
		letter-spacing: 0.15em;
		text-transform: uppercase;
		color: #e4ddd0;
	}
	.open-button {
		position: relative;
		overflow: hidden;
		min-height: 48px;
		border: 1px solid #fffdf878;
		padding: 1rem 2.5rem;
		background: var(--a-paper);
		color: var(--a-ink);
		font-size: 0.72rem;
		font-weight: 500;
		letter-spacing: 0.12em;
		transition:
			background 0.25s,
			color 0.25s;
	}
	.open-button:hover {
		background: #e9ddc8;
	}
	.photo-fallback {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
		gap: 0.15em;
		background: var(--a-soft);
		color: var(--a-ink);
		font:
			italic clamp(4rem, 12vw, 8rem)/1 Georgia,
			serif;
	}
	.photo-fallback i {
		font-size: 0.5em;
	}
	.couple-section {
		outline: none;
	}
	.couple-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: clamp(2rem, 10vw, 8rem);
		max-width: 880px;
		margin-inline: auto;
	}
	.person-card {
		min-width: 0;
		text-align: center;
	}
	.portrait-frame {
		position: relative;
		padding: 0.55rem;
		border: 1px solid var(--a-line);
		border-radius: 48% 48% 0 0;
	}
	.portrait-window {
		position: relative;
		overflow: clip;
		aspect-ratio: 3 / 4;
		border-radius: 48% 48% 0 0;
		background: var(--a-soft);
	}
	.portrait-window img {
		height: 114%;
		margin-top: -7%;
		object-position: center 35%;
	}
	.person-copy {
		margin-top: 1.75rem;
	}
	.person-copy h3 {
		font:
			400 clamp(2.25rem, 4.2vw, 3.5rem)/1.15 Georgia,
			serif;
		letter-spacing: -0.04em;
		overflow-wrap: anywhere;
	}
	.person-copy p {
		margin-top: 1rem;
		font-size: 0.78rem;
		line-height: 1.85;
		color: var(--a-muted);
	}
	.person-copy p span {
		color: var(--a-ink);
		font-size: 0.9rem;
	}
	.event-section {
		position: relative;
		overflow: clip;
		background: var(--a-ink);
		color: var(--a-surface);
	}
	.event-backdrop {
		position: absolute;
		inset: -8% 0;
	}
	.event-backdrop::after {
		content: '';
		position: absolute;
		inset: 0;
		background: #172e26d9;
	}
	.event-content {
		position: relative;
	}
	.event-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 1.5rem;
		max-width: 980px;
		margin-inline: auto;
	}
	.event-ticket {
		position: relative;
		padding: clamp(2rem, 4vw, 3.5rem);
		background: var(--a-paper);
		color: var(--a-ink);
		text-align: center;
	}
	.event-ticket h3 {
		margin-top: 1.6rem;
		font:
			400 clamp(1.9rem, 3.3vw, 3rem)/1.18 Georgia,
			serif;
		letter-spacing: -0.035em;
		text-wrap: balance;
	}
	.event-time {
		font-size: 0.9rem;
		margin-top: 1.1rem;
	}
	.ticket-rule {
		height: 1px;
		width: 3.5rem;
		background: var(--a-accent);
		margin: 1.7rem auto;
		transform-origin: center;
	}
	.event-address {
		font-size: 0.82rem;
		line-height: 1.85;
		white-space: pre-wrap;
		overflow-wrap: anywhere;
		color: var(--a-muted);
	}
	.maps-button {
		display: table;
		margin: 2.5rem auto 0;
		padding: 0.85rem 1.6rem;
		border: 1px solid #fffdf85e;
		color: inherit;
		text-decoration: none;
		font-size: 0.78rem;
		transition: background 0.25s;
	}
	.maps-button:hover {
		background: #fffdf81a;
	}
	.quote-section {
		background: #edeee6;
		padding: clamp(4rem, 7vw, 6rem) 1.5rem;
	}
	.quote-stage {
		max-width: 920px;
		margin-inline: auto;
		text-align: center;
	}
	.quote-rule {
		height: 1px;
		width: 4rem;
		margin-inline: auto;
		background: var(--a-accent);
		transform-origin: center;
	}
	blockquote {
		margin: clamp(2rem, 4vw, 3rem) 0;
		font:
			400 clamp(1.35rem, 2.35vw, 2.05rem)/1.6 Georgia,
			serif;
		letter-spacing: -0.02em;
		text-wrap: pretty;
	}
	.quote-word {
		display: inline-block;
	}
	.stories {
		position: relative;
		display: grid;
		gap: clamp(3rem, 6vw, 5rem);
	}
	.story-track {
		position: absolute;
		top: 0;
		bottom: 0;
		width: 1px;
		left: 50%;
		background: var(--a-line);
	}
	.story-track span {
		display: block;
		width: 100%;
		height: 100%;
		background: var(--a-accent);
		transform-origin: top;
	}
	.story-card {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		align-items: center;
		column-gap: 16%;
	}
	.story-visual {
		position: relative;
		overflow: clip;
		aspect-ratio: 5 / 4;
		background: var(--a-soft);
	}
	.story-visual img {
		height: 114%;
		margin-top: -7%;
	}
	.story-copy {
		padding-block: 1rem;
	}
	.story-copy h3 {
		font:
			400 clamp(1.8rem, 3.1vw, 2.9rem)/1.2 Georgia,
			serif;
		letter-spacing: -0.035em;
		overflow-wrap: anywhere;
	}
	.story-copy time {
		display: block;
		color: #786548;
		font-size: 0.73rem;
		letter-spacing: 0.06em;
		margin-top: 1rem;
	}
	.story-copy p {
		margin-top: 1.2rem;
		color: var(--a-muted);
		font-size: 0.9rem;
		line-height: 1.9;
		white-space: pre-wrap;
		overflow-wrap: anywhere;
	}
	.story-card:nth-of-type(even) .story-visual {
		grid-column: 2;
		grid-row: 1;
	}
	.story-card:nth-of-type(even) .story-copy {
		grid-column: 1;
		grid-row: 1;
		text-align: right;
	}
	.story-card.without-photo .story-copy {
		grid-column: 2;
	}
	.story-card.without-photo:nth-of-type(even) .story-copy {
		grid-column: 1;
	}
	.gallery-section {
		background: #1c3028;
		color: var(--a-paper);
	}
	.gallery-batches {
		display: grid;
		gap: clamp(0.9rem, 1.8vw, 1.5rem);
	}
	.gallery-batch {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: clamp(0.9rem, 1.8vw, 1.5rem);
		position: relative;
	}
	.gallery-slot {
		min-width: 0;
		overflow: clip;
		aspect-ratio: 3 / 2;
		background: #304b3e;
	}
	.gallery-batch[data-count='1'] {
		width: min(100%, 760px);
		margin-inline: auto;
		grid-template-columns: minmax(0, 1fr);
	}
	.gallery-batch[data-count='3'] .gallery-slot:last-child {
		grid-column: 1 / -1;
		width: calc(50% - 0.75rem);
		justify-self: center;
	}
	.gallery-card {
		width: 100%;
		height: 100%;
		display: block;
		padding: 0;
		border: 0;
		background: transparent;
		overflow: clip;
	}
	.gallery-image {
		height: 114%;
		margin-top: -7%;
		pointer-events: none;
	}
	.gift-section {
		background: var(--a-paper);
	}
	.gift-grid {
		display: flex;
		justify-content: center;
		align-items: stretch;
		flex-wrap: wrap;
		gap: 1.5rem;
	}
	.gift-card {
		flex: 1 1 260px;
		max-width: 480px;
		padding: clamp(1.75rem, 4vw, 3rem);
		background: var(--a-surface);
		border: 1px solid var(--a-line);
		min-width: 0;
		text-align: center;
	}
	.gift-card h3 {
		margin: 1.7rem 0 1rem;
		font:
			400 clamp(1.75rem, 3vw, 2.5rem)/1.15 Georgia,
			serif;
	}
	.account-number {
		font-size: clamp(1.1rem, 1.8vw, 1.5rem);
		letter-spacing: 0.05em;
		overflow-wrap: anywhere;
		font-variant-numeric: tabular-nums;
	}
	.account-owner {
		font-size: 0.78rem;
		line-height: 1.7;
		margin-top: 0.75rem;
		overflow-wrap: anywhere;
		color: var(--a-muted);
	}
	.rsvp-section {
		background: var(--a-soft);
	}
	.closing-section {
		position: relative;
		min-height: 75dvh;
		display: grid;
		place-items: center;
		overflow: clip;
		padding-bottom: 6rem;
		background: var(--a-ink);
		color: var(--a-surface);
	}
	.closing-photo {
		position: absolute;
		inset: -8% 0;
	}
	.closing-photo::after {
		content: '';
		position: absolute;
		inset: 0;
		background: #10241dab;
	}
	.closing-copy {
		position: relative;
		text-align: center;
		width: 100%;
	}
	.closing-copy p {
		font-size: 0.85rem;
		line-height: 1.75;
	}
	.closing-copy h2 {
		display: flex;
		flex-direction: column;
		align-items: center;
		font:
			400 clamp(2.7rem, 6vw, 6rem)/1.1 Georgia,
			serif;
		letter-spacing: -0.04em;
		margin: 2rem 0;
	}
	.closing-copy h2 span {
		max-width: 100%;
		overflow-wrap: anywhere;
	}
	.closing-copy i {
		font-size: 0.5em;
		line-height: 1.5;
		color: #dfccaa;
	}
	.closing-copy small {
		font-size: 0.65rem;
		letter-spacing: 0.04em;
		color: #dedfd7;
	}
	.music-button {
		position: fixed;
		right: 1rem;
		bottom: calc(1rem + env(safe-area-inset-bottom));
		z-index: 30;
		border: 1px solid #bba37e78;
		background: #1c3028f0;
		color: var(--a-paper);
		padding: 0.8rem 1rem;
		font-size: 0.68rem;
		border-radius: 2rem;
	}
	.photo-dialog {
		position: fixed;
		inset: 0;
		width: 100%;
		height: 100dvh;
		max-width: none;
		max-height: none;
		margin: 0;
		padding: clamp(1rem, 3vw, 3rem);
		border: 0;
		background: #14271ffb;
		color: var(--a-paper);
	}
	.photo-dialog[open] {
		display: grid;
		grid-template-rows: auto minmax(0, 1fr) auto;
		gap: 1.25rem;
	}
	.photo-dialog::backdrop {
		background: #14271f;
	}
	.photo-dialog > img {
		object-fit: contain;
		min-height: 0;
	}
	.photo-dialog-top,
	.photo-dialog-nav {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 0.75rem;
	}
	.photo-dialog button {
		border: 0;
		color: inherit;
		background: transparent;
		padding: 0.8rem;
		font-size: 0.8rem;
	}
	@media (max-width: 760px) {
		.section-space {
			padding: 4rem 1.5rem;
		}
		.cover-content {
			gap: 1.5rem;
		}
		h1 {
			font-size: clamp(2.6rem, min(16vw, 11dvh), 5.5rem);
		}
		.couple-grid {
			gap: 1.25rem;
		}
		.portrait-frame {
			padding: 0.35rem;
		}
		.person-copy h3 {
			font-size: clamp(1.6rem, 6vw, 2.5rem);
		}
		.person-copy p {
			font-size: 0.72rem;
		}
		.person-copy p span {
			font-size: 0.78rem;
		}
		.event-grid {
			grid-template-columns: minmax(0, 1fr);
			gap: 1.25rem;
		}
		.event-ticket {
			padding: 2rem;
		}
		.story-track {
			left: 0;
		}
		.stories {
			padding-left: 1.5rem;
			gap: 3rem;
		}
		.story-card {
			grid-template-columns: minmax(0, 1fr);
			gap: 1.25rem;
		}
		.story-card:nth-of-type(n) .story-visual,
		.story-card:nth-of-type(n) .story-copy {
			grid-column: auto;
			grid-row: auto;
			text-align: left;
		}
		.story-copy {
			padding: 0;
		}
		.gallery-slot {
			aspect-ratio: 4 / 5;
		}
		.gallery-batch[data-count='1'] .gallery-slot {
			aspect-ratio: 4 / 3;
		}
		.gallery-batch[data-count='3'] .gallery-slot:last-child {
			width: calc(50% - 0.45rem);
		}
		.closing-section {
			min-height: 65dvh;
			padding-bottom: 6rem;
		}
	}
	@media (max-width: 600px) {
		.couple-grid {
			grid-template-columns: minmax(0, 1fr);
			gap: 3rem;
			max-width: 320px;
		}
		.person-copy h3 {
			font-size: 2.4rem;
		}
	}
	@media (max-width: 380px) {
		.countdown-cell {
			min-width: 3.7rem;
			padding-inline: 0.75rem;
		}
	}
	@media (max-height: 540px) {
		.cover-section {
			padding-block: 0.8rem;
		}
		.cover-content {
			gap: 0.65rem;
		}
		.cover-greeting {
			font-size: 0.6rem;
		}
		h1 {
			font-size: clamp(1.65rem, min(6vw, 9dvh), 3rem);
		}
		.hero-ampersand {
			font-size: 0.4em;
		}
		.cover-bottom {
			gap: 0.85rem;
		}
		.countdown-block > p {
			margin-bottom: 0.6rem;
			font-size: 0.65rem;
		}
		.countdown strong {
			font-size: 1.6rem;
		}
		.countdown span {
			font-size: 0.5rem;
		}
		.countdown-cell {
			gap: 0.25rem;
		}
		.open-button {
			min-height: 38px;
			padding: 0.65rem 1.75rem;
			font-size: 0.65rem;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		button,
		a {
			transition: none;
		}
	}
</style>
