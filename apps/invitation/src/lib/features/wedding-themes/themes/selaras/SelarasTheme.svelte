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
		getEventLocation
	} from '../../shared/theme-utils.js';
	import SelarasRsvp from './SelarasRsvp.svelte';
	import { mountSelarasAnimations, type SelarasMotion } from './selaras-animations.js';

	let { wedding }: WeddingThemeProps = $props();
	const groom = $derived(formatPersonName(wedding.groom_name) || 'Mempelai Pria');
	const bride = $derived(formatPersonName(wedding.bride_name) || 'Mempelai Wanita');
	const couple = $derived(groom + ' & ' + bride);
	const targetDate = $derived(wedding.akad || wedding.reception || '');
	const eventDate = $derived(formatEventDate(wedding.reception || wedding.akad));
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
	let motion: SelarasMotion | undefined;
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
		motion = mountSelarasAnimations(root);
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

{#snippet title(text: string)}
	<span class="title-words" aria-hidden="true">
		{#each text.split(' ') as word, index (index)}
			<span class="word-mask"><span data-title-word>{word}</span></span>{wordSeparator}
		{/each}
	</span>
{/snippet}

<main class="selaras-theme" bind:this={root}>
	<div class="theme-scroll-wrapper">
		<div data-theme-scroll-content>
			<section class="cover-section" aria-label="Sampul undangan">
				<div class="cover-photo" aria-hidden="true">
					<div class="cover-photo-inner">
						{#if cover}<img src={cover} alt="" fetchpriority="high" draggable="false" />
						{:else}<div class="photo-placeholder">
								{groom.charAt(0)}<i>&amp;</i>{bride.charAt(0)}
							</div>{/if}
					</div>
				</div>
				<div class="cover-panel">
					<div class="cover-content">
						<p class="cover-greeting">Kepada Bapak/Ibu/Saudara/i,</p>
						<h1 aria-label={couple} {@attach fitCoupleHeading}>
							<span class="name-line"
								><span class="hero-name" aria-hidden="true">{groom}</span></span
							>
							<span class="ampersand" aria-hidden="true">&amp;</span>
							<span class="name-line"
								><span class="hero-name" aria-hidden="true">{bride}</span></span
							>
						</h1>
						<div class="cover-details">
							<p class="cover-date">{eventDate.date}</p>
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
						<button class="open-button" type="button" onclick={openInvitation} disabled={opening}
							>Buka Undangan</button
						>
					</div>
				</div>
			</section>

			<div class="invitation-content" inert={mounted && !opened}>
				<section class="couple-section section-space" tabindex="-1" aria-label="Mempelai">
					<h2 class="section-title" data-title aria-label="Mempelai">
						{@render title('Mempelai')}
					</h2>
					<div class="couple-grid">
						{#each [{ name: groom, photo: wedding.groom_photo_url, father: wedding.groom_father_name, mother: wedding.groom_mother_name, label: 'Putra dari' }, { name: bride, photo: wedding.bride_photo_url, father: wedding.bride_father_name, mother: wedding.bride_mother_name, label: 'Putri dari' }] as person, index (index)}
							<article class="person" data-person>
								<div class="portrait-window">
									{#if person.photo}<img
											src={person.photo}
											alt={person.name}
											loading="lazy"
											draggable="false"
										/>
									{:else}<div class="photo-placeholder">{person.name.charAt(0)}</div>{/if}
								</div>
								<div class="person-copy">
									<h3>{person.name}</h3>
									{#if person.father || person.mother}<p>
											{person.label}<br /><span
												>{formatPersonName(person.father)}{person.father && person.mother
													? ' & '
													: ''}{formatPersonName(person.mother)}</span
											>
										</p>{/if}
								</div>
							</article>
						{/each}
					</div>
				</section>

				<section class="event-section" aria-label="Waktu dan tempat">
					<div class="event-stage section-space">
						<h2 class="section-title" data-title aria-label="Waktu & tempat">
							{@render title('Waktu & tempat')}
						</h2>
						<div class="event-track">
							{#each [{ label: 'Akad Nikah', value: wedding.akad, ...getEventLocation(wedding, 'akad') }, { label: 'Resepsi', value: wedding.reception, ...getEventLocation(wedding, 'reception') }] as event, index (index)}
								{@const date = formatEventDate(event.value)}
								<article class="event-slide" data-event-slide>
									<div class="event-image" aria-hidden="true">
										{#if cover}<img src={cover} alt="" loading="lazy" />{:else}<div
												class="photo-placeholder"
											>
												{groom.charAt(0)}<i>&amp;</i>{bride.charAt(0)}
											</div>{/if}
									</div>
									<div class="event-copy">
										<p class="eyebrow">{event.label}</p>
										<h3>{date.date}</h3>
										<p class="event-time">{date.time}</p>
										<div class="fine-rule" aria-hidden="true"></div>
										{#if event.address}<p class="event-address">{event.address}</p>{/if}
										{#if event.maps}<a
												href={event.maps}
												target="_blank"
												rel="noreferrer"
												class="text-link">Buka Google Maps</a
											>{/if}
									</div>
								</article>
							{/each}
						</div>
					</div>
				</section>

				{#if wedding.quote.trim()}
					<section class="quote-section section-space" aria-label="Kutipan">
						<div class="quote-inner">
							<div class="fine-rule" aria-hidden="true"></div>
							<blockquote aria-label={wedding.quote}>
								<span aria-hidden="true"
									>{#each wedding.quote.trim().split(/\s+/u) as word, index (index)}<span
											data-quote-word>{word}</span
										>{wordSeparator}{/each}</span
								>
							</blockquote>
							<div class="fine-rule" aria-hidden="true"></div>
						</div>
					</section>
				{/if}

				{#if wedding.stories.length}
					<section class="story-section" aria-label="Cerita Kami">
						<h2 class="section-title" data-title aria-label="Cerita Kami">
							{@render title('Cerita Kami')}
						</h2>
						<div class="story-stage scene-stage" data-story-stage data-motion={undefined}>
							<div class="story-viewport">
								<div class="story-track" data-count={wedding.stories.length}>
									{#each wedding.stories as story, index (story.id)}
										<article
											class="story-slide"
											class:without-image={!story.image_url}
											data-story-slide
										>
											{#if story.image_url}<div class="story-image">
													<img
														src={story.image_url}
														alt={story.title || 'Cerita ' + (index + 1)}
														loading="lazy"
														draggable="false"
													/>
												</div>{/if}
											<div class="story-copy">
												<h3>{story.title || 'Cerita ' + (index + 1)}</h3>
												{#if story.date}<time datetime={story.date}
														>{formatStoryDate(story.date)}</time
													>{/if}
												{#if story.content}<p>{story.content}</p>{/if}
											</div>
										</article>
									{/each}
								</div>
							</div>
						</div>
					</section>
				{/if}

				{#if wedding.gallery.length}
					<section class="gallery-section section-space" aria-label="Galeri kami">
						<h2 class="section-title" data-title aria-label="Galeri kami">
							{@render title('Galeri kami')}
						</h2>
						<div class="gallery-grid" data-count={wedding.gallery.length}>
							{#each wedding.gallery as photo, index (index)}
								<button
									class="gallery-card"
									type="button"
									aria-label={'Perbesar foto ' + (index + 1)}
									onclick={(event) => showPhoto(index, event.currentTarget)}
								>
									<img
										src={photo.url}
										alt={'Galeri pernikahan ' + (index + 1)}
										loading="lazy"
										draggable="false"
									/>
								</button>
							{/each}
						</div>
					</section>
				{/if}

				{#if wedding.gift_enabled && giftAccounts.length}
					<section class="gift-section section-space" aria-label="Hadiah">
						<h2 class="section-title" data-title aria-label="Hadiah">{@render title('Hadiah')}</h2>
						<div class="gift-grid">
							{#each giftAccounts as account, index (index)}
								<article class="gift-card" data-gift>
									<p class="eyebrow">{account.name}</p>
									<h3>{account.provider || 'Rekening / e-wallet'}</h3>
									<p class="account-number">{account.number}</p>
									{#if account.owner}<p class="account-owner">Atas nama {account.owner}</p>{/if}
								</article>
							{/each}
						</div>
					</section>
				{/if}

				<section class="rsvp-section section-space" aria-label="RSVP dan ucapan">
					<h2 class="section-title" data-title aria-label="Ucapan & Doa">
						{@render title('Ucapan & Doa')}
					</h2>
					<div class="rsvp-content">
						{#key wedding.id + ':' + token}<SelarasRsvp
								slug={wedding.slug}
								{token}
								onLayoutChange={() => motion?.refresh()}
							/>{/key}
					</div>
				</section>

				<div class="closing-reveal">
					<footer class="closing-section">
						{#if cover}<div class="closing-image" aria-hidden="true">
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
	</div>
	{#if wedding.music_url}
		<audio
			bind:this={music}
			src={wedding.music_url}
			preload="none"
			loop
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
			<span>{galleryIndex + 1} / {wedding.gallery.length}</span><button
				type="button"
				onclick={() => gallery?.close()}>Tutup</button
			>
		</div>
		<img src={wedding.gallery[galleryIndex]?.url} alt={'Galeri pernikahan ' + (galleryIndex + 1)} />
		{#if wedding.gallery.length > 1}<div class="photo-dialog-nav">
				<button type="button" onclick={() => showPhoto(galleryIndex - 1)}>Sebelumnya</button><button
					type="button"
					onclick={() => showPhoto(galleryIndex + 1)}>Berikutnya</button
				>
			</div>{/if}
	</dialog>
</main>

<style>
	.selaras-theme {
		--s-cream: #f5efe6;
		--s-surface: #fffcf7;
		--s-ink: #39282a;
		--s-wine: #562f38;
		--s-copper: #b18565;
		--s-muted: #796868;
		--s-soft: #eae0d5;
		--s-line: #b1856555;
		position: relative;
		isolation: isolate;
		overflow-x: clip;
		background: var(--s-cream);
		color: var(--s-ink);
		font-family: Inter, 'Helvetica Neue', Arial, sans-serif;
	}
	.selaras-theme :global(*) {
		box-sizing: border-box;
	}
	.selaras-theme :global(::selection) {
		background: #dfc3a5;
		color: var(--s-ink);
	}
	.selaras-theme :global(:focus-visible) {
		outline: 2px solid var(--s-copper);
		outline-offset: 5px;
	}
	h1,
	h2,
	h3,
	p {
		margin: 0;
	}
	img {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	button {
		font: inherit;
		cursor: pointer;
	}
	button:disabled {
		opacity: 0.6;
		cursor: default;
	}
	button,
	a {
		-webkit-tap-highlight-color: transparent;
	}
	.section-space {
		padding: clamp(4rem, 7.5vw, 7rem) max(1.5rem, calc((100% - 1160px) / 2));
	}
	.section-title {
		font:
			400 clamp(2.5rem, 4.8vw, 4.5rem)/1.12 Georgia,
			serif;
		letter-spacing: -0.045em;
		margin-bottom: clamp(2rem, 4vw, 3.5rem);
		text-align: center;
	}
	.word-mask {
		display: inline-block;
		overflow: clip;
		padding-block: 0.1em;
		vertical-align: bottom;
	}
	.word-mask > span {
		display: inline-block;
	}
	.eyebrow {
		font-size: 0.69rem;
		letter-spacing: 0.16em;
		text-transform: uppercase;
	}
	.fine-rule {
		width: 3.5rem;
		height: 1px;
		background: var(--s-copper);
		transform-origin: left;
		margin-block: 1.7rem;
	}
	.cover-section {
		position: relative;
		z-index: 2;
		display: grid;
		grid-template-columns: 1.06fr 1fr;
		height: 100dvh;
		min-height: 0;
		overflow: clip;
		background: var(--s-wine);
	}
	.cover-photo {
		position: relative;
		overflow: clip;
	}
	.cover-photo-inner {
		position: absolute;
		inset: -5%;
	}
	.cover-photo::after {
		content: '';
		position: absolute;
		inset: 0;
		background: #39282a26;
		pointer-events: none;
	}
	.cover-panel {
		display: grid;
		place-items: center;
		position: relative;
		background: var(--s-cream);
		padding: max(1.25rem, env(safe-area-inset-top)) clamp(1.5rem, 4vw, 4.5rem)
			max(1.25rem, env(safe-area-inset-bottom));
	}
	.cover-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: clamp(1.1rem, 3.2dvh, 2.25rem);
		width: 100%;
		text-align: center;
	}
	.cover-greeting {
		font-size: 0.7rem;
		line-height: 1.6;
		letter-spacing: 0.06em;
	}
	h1 {
		width: 100%;
		font:
			400 clamp(2.6rem, min(6vw, 12dvh), 6.2rem)/1.08 Georgia,
			serif;
		letter-spacing: -0.05em;
	}
	.name-line {
		display: block;
		overflow: clip;
		padding: 0.06em 0 0.12em;
	}
	.hero-name {
		display: inline-block;
		white-space: nowrap;
		font-size: var(--hero-stacked-font-size, 1em);
	}
	.ampersand {
		display: block;
		font-size: 0.42em;
		font-style: italic;
		color: #927050;
	}
	.cover-date {
		font-size: 0.76rem;
		letter-spacing: 0.08em;
		margin-bottom: 1.3rem;
	}
	.countdown {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
	}
	.countdown-cell {
		display: grid;
		gap: 0.45rem;
		min-width: 3.8rem;
		padding: 0 clamp(0.65rem, 1.4vw, 1.3rem);
	}
	.countdown-cell + .countdown-cell {
		border-left: 1px solid var(--s-line);
	}
	.countdown strong {
		font:
			400 clamp(1.65rem, 4dvh, 2.4rem)/1 Georgia,
			serif;
		font-variant-numeric: tabular-nums;
	}
	.countdown span {
		font-size: 0.54rem;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--s-muted);
	}
	.open-button {
		border: 1px solid var(--s-wine);
		min-height: 48px;
		padding: 1rem 2rem;
		background: var(--s-wine);
		color: var(--s-surface);
		font-size: 0.72rem;
		letter-spacing: 0.1em;
		transition: background 0.25s;
	}
	.open-button:hover {
		background: #78424b;
	}
	.photo-placeholder {
		height: 100%;
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 0.12em;
		background: var(--s-soft);
		font:
			italic clamp(4rem, 12vw, 9rem)/1 Georgia,
			serif;
		color: var(--s-wine);
	}
	.photo-placeholder i {
		font-size: 0.45em;
	}
	.couple-section {
		outline: none;
	}
	.invitation-content > section {
		position: relative;
		z-index: 1;
	}
	.couple-section,
	.story-section,
	.gift-section {
		background: var(--s-cream);
	}
	.couple-grid {
		max-width: 970px;
		margin-inline: auto;
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: clamp(2rem, 8vw, 7rem);
	}
	.person {
		min-width: 0;
		text-align: center;
	}
	.portrait-window {
		overflow: clip;
		aspect-ratio: 4 / 5;
		background: var(--s-soft);
	}
	.portrait-window img {
		height: 116%;
		margin-top: -8%;
	}
	.person-copy {
		padding: 1.6rem 0.5rem 0;
	}
	.person-copy h3 {
		font:
			400 clamp(2.3rem, 4vw, 3.8rem)/1.12 Georgia,
			serif;
		letter-spacing: -0.04em;
		overflow-wrap: anywhere;
	}
	.person-copy p {
		margin-top: 1rem;
		font-size: 0.76rem;
		color: var(--s-muted);
		line-height: 1.85;
	}
	.person-copy p span {
		font-size: 0.88rem;
		color: var(--s-ink);
	}
	.event-section {
		background: var(--s-soft);
	}
	.event-track {
		position: relative;
		display: grid;
		gap: 1.5rem;
	}
	.event-slide {
		display: grid;
		grid-template-columns: 0.85fr 1.15fr;
		min-width: 0;
		background: var(--s-surface);
	}
	.event-image {
		overflow: clip;
		min-height: 300px;
	}
	.event-copy {
		padding: clamp(2rem, 4vw, 3.5rem);
		align-self: center;
		min-width: 0;
	}
	.event-copy h3 {
		margin-top: 1.5rem;
		font:
			400 clamp(2rem, 3.3vw, 3.5rem)/1.14 Georgia,
			serif;
		letter-spacing: -0.04em;
		text-wrap: balance;
	}
	.event-time {
		font-size: 0.9rem;
		margin-top: 1rem;
	}
	.event-address {
		font-size: 0.86rem;
		line-height: 1.85;
		white-space: pre-wrap;
		overflow-wrap: anywhere;
		color: var(--s-muted);
	}
	.text-link {
		display: inline-block;
		margin-top: 1.5rem;
		border-bottom: 1px solid var(--s-copper);
		padding-bottom: 0.5rem;
		color: var(--s-ink);
		text-decoration: none;
		font-size: 0.79rem;
	}
	.scene-stage {
		--rail-gutter: clamp(1.5rem, 7vw, 8rem);
		padding-block: clamp(2rem, 5svh, 4rem);
	}
	.scene-stage[data-motion] {
		box-sizing: border-box;
		height: 100svh;
		display: flex;
		flex-direction: column;
	}
	.scene-stage[data-motion] .story-viewport {
		flex: 1;
		min-height: 0;
		overflow: clip;
		padding-bottom: 0;
	}
	.quote-section {
		background: var(--s-wine);
		color: var(--s-surface);
	}
	.quote-inner {
		max-width: 880px;
		margin-inline: auto;
		text-align: center;
	}
	.quote-inner .fine-rule {
		margin: 0 auto;
		background: #d4b18f;
		transform-origin: center;
	}
	blockquote {
		margin: 2.25rem 0;
		font:
			400 clamp(1.35rem, 2.3vw, 2.1rem)/1.6 Georgia,
			serif;
		letter-spacing: -0.02em;
		text-wrap: pretty;
	}
	[data-quote-word] {
		display: inline-block;
	}
	.story-track {
		position: relative;
		display: grid;
		gap: 2rem;
		width: calc(100% - 2 * var(--rail-gutter));
		max-width: 1160px;
		margin-inline: auto;
	}
	.story-section > .section-title {
		margin: 0;
		padding: clamp(4rem, 7.5vw, 7rem) 1.5rem clamp(1.5rem, 3svh, 2.5rem);
	}
	.story-stage {
		padding-top: 0;
	}
	.story-slide {
		box-sizing: border-box;
		display: grid;
		grid-template-columns: minmax(0, 1.2fr) minmax(0, 0.8fr);
		align-items: center;
		gap: clamp(1.5rem, 4vw, 4rem);
		min-width: 0;
		padding: clamp(1.5rem, 4vw, 3.5rem);
		border: 1px solid var(--s-line);
		border-radius: clamp(1.25rem, 2vw, 1.8rem);
		background: var(--s-surface);
		box-shadow: 0 12px 32px -24px #562f3840;
		transform-origin: center top;
	}
	.story-image {
		grid-area: 1 / 2;
		position: relative;
		overflow: clip;
		aspect-ratio: 4 / 5;
		border-radius: 0.8rem;
		background: var(--s-soft);
	}
	.story-image img {
		position: absolute;
		top: -8%;
		left: 0;
		height: 116%;
	}
	.story-copy {
		grid-area: 1 / 1;
		min-width: 0;
		padding: 1rem 0;
	}
	.story-copy h3 {
		color: var(--s-wine);
		font:
			400 clamp(1.9rem, 3.3vw, 3.25rem)/1.15 Georgia,
			serif;
		letter-spacing: -0.035em;
		overflow-wrap: anywhere;
	}
	.story-copy time {
		display: block;
		margin-top: 1rem;
		font-size: 0.75rem;
		letter-spacing: 0.05em;
		color: #925a40;
	}
	.story-copy p {
		margin-top: 1.25rem;
		font-size: 0.88rem;
		line-height: 1.9;
		white-space: pre-wrap;
		overflow-wrap: anywhere;
		color: var(--s-muted);
	}
	.story-slide.without-image {
		grid-template-columns: 1fr;
	}
	.without-image .story-copy {
		max-width: 640px;
		margin-inline: auto;
	}
	.story-stage[data-motion='stack'] .story-track {
		height: 100%;
		display: block;
	}
	.story-stage[data-motion='stack'] {
		padding: 0;
	}
	.story-stage[data-motion='stack'] .story-slide {
		position: absolute;
		inset: clamp(5rem, 12svh, 7rem) 0;
	}
	.story-stage[data-motion='stack'] .story-image {
		min-height: 0;
		height: 100%;
		aspect-ratio: auto;
	}
	.gallery-section {
		background: #30242a;
		color: var(--s-cream);
	}
	.gallery-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 15rem), 1fr));
		gap: clamp(0.75rem, 1.5vw, 1.25rem);
		max-width: 1160px;
		margin-inline: auto;
	}
	.gallery-grid[data-count='1'] {
		grid-template-columns: minmax(0, 1fr);
		max-width: 520px;
	}
	.gallery-grid[data-count='2'] {
		max-width: 860px;
	}
	.gallery-card {
		display: block;
		width: 100%;
		aspect-ratio: 4 / 5;
		padding: 0;
		border: 0;
		background: #654a50;
		overflow: clip;
	}
	.gallery-card img {
		height: 100%;
	}
	.gift-section.section-space,
	.rsvp-section.section-space {
		height: 100dvh;
		min-height: 0;
		padding-block: clamp(1rem, 3dvh, 2.5rem);
		display: flex;
		flex-direction: column;
	}
	.gift-section.section-space {
		justify-content: safe center;
		overflow-x: clip;
		overflow-y: auto;
	}
	.gift-section > .section-title,
	.rsvp-section > .section-title {
		flex: none;
		margin-bottom: clamp(0.75rem, 2.5dvh, 1.75rem);
	}
	.gift-grid {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 1.5rem;
		width: 100%;
		max-width: 1040px;
		margin-inline: auto;
	}
	.gift-card {
		flex: 1 1 260px;
		max-width: 480px;
		min-width: 0;
		padding: clamp(1.25rem, 3dvh, 2.5rem);
		background: var(--s-surface);
		border: 1px solid var(--s-line);
	}
	.gift-card h3 {
		font:
			400 clamp(1.8rem, 3vw, 2.5rem)/1.15 Georgia,
			serif;
		margin: clamp(1rem, 2dvh, 1.5rem) 0 0.75rem;
	}
	.account-number {
		font-size: clamp(1.1rem, 1.8vw, 1.45rem);
		font-variant-numeric: tabular-nums;
		letter-spacing: 0.035em;
		overflow-wrap: anywhere;
	}
	.account-owner {
		margin-top: 0.8rem;
		font-size: 0.8rem;
		color: var(--s-muted);
		line-height: 1.7;
		overflow-wrap: anywhere;
	}
	.rsvp-section {
		background: var(--s-soft);
		overflow: hidden;
	}
	.rsvp-content {
		flex: 1;
		min-height: 0;
		width: 100%;
		max-width: 1160px;
		margin-inline: auto;
	}
	.closing-reveal {
		display: contents;
	}
	.closing-section {
		position: sticky;
		bottom: 0;
		z-index: 0;
		display: flex;
		height: 70dvh;
		background: var(--s-wine);
		color: var(--s-surface);
		overflow: clip;
	}
	.closing-image {
		flex: 1;
		min-width: 0;
		overflow: clip;
	}
	.closing-image img {
		height: 100%;
	}
	.closing-copy {
		flex: 1;
		min-width: 0;
		padding: 4rem 2rem 5rem;
		display: flex;
		flex-direction: column;
		justify-content: center;
		text-align: center;
	}
	.closing-copy p {
		font-size: 0.8rem;
		line-height: 1.75;
	}
	.closing-copy h2 {
		display: flex;
		flex-direction: column;
		font:
			400 clamp(2.5rem, 5vw, 5rem)/1.1 Georgia,
			serif;
		letter-spacing: -0.04em;
		margin: 2rem 0;
		overflow-wrap: anywhere;
	}
	.closing-copy i {
		font-size: 0.5em;
		line-height: 1.5;
		color: #dfc1a1;
	}
	.closing-copy small {
		font-size: 0.65rem;
		opacity: 0.8;
	}
	.music-button {
		position: fixed;
		right: 1rem;
		bottom: calc(1rem + env(safe-area-inset-bottom));
		z-index: 30;
		border: 1px solid #d4b18f99;
		border-radius: 2rem;
		padding: 0.8rem 1rem;
		background: #4a2831f5;
		color: var(--s-cream);
		font-size: 0.68rem;
	}
	.photo-dialog {
		position: fixed;
		inset: 0;
		height: 100dvh;
		width: 100%;
		max-width: none;
		max-height: none;
		margin: 0;
		border: 0;
		padding: clamp(1rem, 3vw, 3rem);
		background: #241c22fc;
		color: var(--s-cream);
	}
	.photo-dialog[open] {
		display: grid;
		grid-template-rows: auto minmax(0, 1fr) auto;
		gap: 1.25rem;
	}
	.photo-dialog::backdrop {
		background: #241c22;
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
		background: transparent;
		border: 0;
		color: inherit;
		padding: 0.8rem;
		font-size: 0.8rem;
	}
	@media (max-width: 899px) {
		.cover-section {
			grid-template-columns: 1fr;
		}
		.cover-photo {
			position: absolute;
			inset: 0;
		}
		.cover-photo::after {
			background: #2b182596;
		}
		.cover-panel {
			background: transparent;
			color: var(--s-surface);
			padding-inline: 1.5rem;
		}
		h1 {
			font-size: clamp(2.7rem, min(15vw, 11dvh), 5.7rem);
		}
		.ampersand {
			color: #e7c8a2;
		}
		.countdown span {
			color: #eee1d6;
		}
		.countdown-cell + .countdown-cell {
			border-color: #fffcf744;
		}
		.open-button {
			background: var(--s-cream);
			border-color: var(--s-cream);
			color: var(--s-wine);
		}
		.open-button:hover {
			background: #e5d4c0;
		}
		.story-slide {
			grid-template-columns: minmax(0, 1fr);
			gap: 1.25rem;
		}
		.story-image,
		.story-copy {
			grid-area: auto;
		}
		.story-image {
			aspect-ratio: 16 / 9;
		}
		.story-stage[data-motion='stack'] .story-slide:not(.without-image) {
			grid-template-rows: minmax(120px, 1fr) auto;
			align-items: stretch;
		}
		.story-copy {
			padding: 0;
		}
		.story-copy h3 {
			font-size: clamp(1.8rem, 5vw, 2.6rem);
		}
		.story-copy time,
		.story-copy p {
			margin-top: 0.75rem;
		}
		.gallery-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}
	@media (max-width: 600px) {
		.section-space {
			padding: 4rem 1.5rem;
		}
		.couple-grid {
			grid-template-columns: 1fr;
			max-width: 320px;
			gap: 3rem;
		}
		.event-slide {
			grid-template-columns: 1fr;
		}
		.event-image {
			height: 200px;
			min-height: 0;
		}
		.event-copy {
			padding: 1.8rem;
		}
		.event-copy h3 {
			font-size: 2.15rem;
		}
		.closing-section {
			flex-direction: column;
		}
		.closing-image {
			flex: none;
			height: 35%;
		}
		.closing-copy {
			padding: clamp(1rem, 3dvh, 2rem) 1.5rem;
		}
		.closing-copy h2 {
			margin: 1rem 0;
		}
	}
	@media (max-height: 540px) {
		.cover-content {
			gap: 0.7rem;
		}
		.cover-greeting {
			font-size: 0.6rem;
		}
		h1 {
			font-size: clamp(1.65rem, min(5.5vw, 9dvh), 3rem);
		}
		.cover-date {
			font-size: 0.65rem;
			margin-bottom: 0.6rem;
		}
		.countdown strong {
			font-size: 1.5rem;
		}
		.countdown-cell {
			gap: 0.25rem;
		}
		.countdown span {
			font-size: 0.5rem;
		}
		.open-button {
			min-height: 38px;
			padding: 0.65rem 1.5rem;
			font-size: 0.65rem;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		button {
			transition: none;
		}
	}
</style>
