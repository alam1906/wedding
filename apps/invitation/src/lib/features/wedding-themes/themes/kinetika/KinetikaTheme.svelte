<script lang="ts">
	import { page } from '$app/state';
	import { onMount, tick, untrack } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import {
		getPublicGuestRsvp,
		getPublicRsvpMessages,
		submitPublicGuestRsvp,
		PublicRsvpError,
		type PublicRsvpGuest,
		type PublicRsvpMessage,
		type PublicRsvpStatus
	} from '#lib/features/guests/index.js';
	import type { WeddingThemeProps } from '../../model/wedding-theme.js';
	import {
		calculateCountdown,
		formatEventDate,
		formatPersonName
	} from '../../shared/theme-utils.js';
	import BookSheet from './BookSheet.svelte';
	import {
		buildBookPages,
		createTextMeasurer,
		getBookGeometry,
		paginateBookText,
		type BookPage
	} from './book-content.js';
	import {
		mountKinetikaAnimations,
		type BookAnimationController,
		type BookDirection
	} from './kinetika-animations.js';

	let { wedding }: WeddingThemeProps = $props();
	const groom = $derived(formatPersonName(wedding.groom_name) || 'Mempelai Pria');
	const bride = $derived(formatPersonName(wedding.bride_name) || 'Mempelai Wanita');
	const token = $derived(page.url.searchParams.get('rsvp')?.trim() ?? '');
	const target = $derived(wedding.akad || wedding.reception || '');
	let countdown = $state(calculateCountdown(untrack(() => target)));
	let root = $state<HTMLDivElement>();
	let music = $state<HTMLAudioElement>();
	let gallery = $state<HTMLDialogElement>();
	let galleryIndex = $state(0);
	let musicPlaying = $state(false);
	let phase = $state<'closed' | 'opening' | 'open'>('closed');
	let geometry = $state(getBookGeometry(1200, 800));
	let leaves = $state<BookPage[]>([]);
	let index = $state(0);
	let turning = $state<{ from: number; to: number; direction: BookDirection }>();
	let motion: BookAnimationController | undefined;
	let destroyed = false;
	const prefetchedImages = new SvelteSet<string>();
	let initialized = $state(false);
	let visibleHeight = $state(0);
	const step = $derived(geometry.single ? 1 : 2);
	const leftIndex = $derived(turning?.direction === 'previous' ? turning.to : index);
	const rightIndex = $derived(
		geometry.single
			? turning?.direction === 'next'
				? turning.to
				: index
			: turning?.direction === 'next'
				? turning.to + 1
				: index + 1
	);
	const frontIndex = $derived(
		turning
			? (turning.direction === 'next' ? turning.from : turning.to) + (geometry.single ? 0 : 1)
			: index
	);
	const backIndex = $derived(
		turning ? (turning.direction === 'next' ? turning.to : turning.from) : index
	);
	let guest = $state<PublicRsvpGuest | null>(null);
	let guestLoading = $state(true);
	let attendance = $state<PublicRsvpStatus | ''>('');
	let message = $state('');
	let sending = $state(false);
	let guestError = $state('');
	let feedback = $state('');
	let wishes = $state<PublicRsvpMessage[]>([]);
	let wishPages = $state<Array<Array<{ name: string; text: string; status: string }>>>([]);
	let wishIndex = $state(0);
	let wishesPage = 0;
	let wishesMore = $state(true);
	let wishesLoading = $state(false);
	let wishesError = $state('');

	function preloadAdjacentImages(): void {
		for (const leaf of leaves.slice(index, index + (geometry.single ? 3 : 6))) {
			const source =
				leaf.image ||
				(leaf.person
					? wedding[`${leaf.person}_photo_url`]
					: leaf.kind === 'closing'
						? wedding.cover_url
						: '');
			for (const url of [source, ...(leaf.galleryImages?.map((photo) => photo.url) ?? [])]) {
				if (!url || prefetchedImages.has(url)) continue;
				prefetchedImages.add(url);
				const image = new Image();
				image.src = url;
			}
		}
	}

	function paginateWishes(): void {
		const measurer = createTextMeasurer(geometry.innerWidth);
		try {
			const pages: typeof wishPages = [];
			const availableHeight = Math.max(geometry.bodyFont * 3, geometry.bodyHeight - 64);
			let current: (typeof wishPages)[number] = [];
			let usedHeight = 0;
			for (const wish of wishes) {
				const nameHeight = measurer.measure(wish.name, geometry.titleFont * 0.65, 1.15);
				const entryChrome = nameHeight + 38;
				const status =
					wish.rsvp_status === 'attending'
						? 'Hadir'
						: wish.rsvp_status === 'not_attending'
							? 'Tidak hadir'
							: '';
				for (const text of paginateBookText(
					wish.message,
					availableHeight - entryChrome,
					geometry.bodyFont,
					1.65,
					measurer.measure
				)) {
					const entryHeight = entryChrome + measurer.measure(text, geometry.bodyFont, 1.65);
					if (
						current.length === 3 ||
						(current.length && usedHeight + entryHeight > availableHeight)
					) {
						pages.push(current);
						current = [];
						usedHeight = 0;
					}
					current.push({ name: wish.name, text, status });
					usedHeight += entryHeight;
				}
			}
			if (current.length) pages.push(current);
			wishPages = pages;
			wishIndex = Math.min(wishIndex, Math.max(0, wishPages.length - 1));
		} finally {
			measurer.destroy();
		}
	}

	function resizeBook(): void {
		if (!root || destroyed) return;
		motion?.settle();
		const previous = leaves[index];
		const viewport = window.visualViewport;
		const height = Math.min(
			root.clientHeight,
			viewport?.scale === 1 ? viewport.height : root.clientHeight
		);
		visibleHeight = height;
		const next = getBookGeometry(root.clientWidth, height);
		if (
			initialized &&
			next.width === geometry.width &&
			next.height === geometry.height &&
			next.single === geometry.single
		)
			return;
		geometry = next;
		const measurer = createTextMeasurer(geometry.innerWidth);
		try {
			leaves = buildBookPages(wedding, geometry, measurer.measure);
		} finally {
			measurer.destroy();
		}
		let position = previous ? leaves.findIndex((leaf) => leaf.id === previous.id) : 0;
		if (position < 0) position = leaves.findIndex((leaf) => leaf.group === previous?.group);
		const count = geometry.single ? 1 : 2;
		index = Math.floor(Math.max(0, position) / count) * count;
		paginateWishes();
		preloadAdjacentImages();
		initialized = true;
	}

	onMount(() => {
		if (!root) return;
		const html = document.documentElement;
		const body = document.body;
		const oldHtmlOverflow = html.style.overflow;
		const oldBodyOverflow = body.style.overflow;
		const oldOverscroll = body.style.overscrollBehavior;
		html.style.overflow = 'hidden';
		body.style.overflow = 'hidden';
		body.style.overscrollBehavior = 'none';
		motion = mountKinetikaAnimations(root);
		resizeBook();
		const resize = new ResizeObserver(resizeBook);
		resize.observe(root);
		window.visualViewport?.addEventListener('resize', resizeBook);
		const interval = window.setInterval(() => {
			countdown = calculateCountdown(target);
		}, 1000);
		void loadGuest();
		void loadWishes();
		let gesture: { x: number; y: number } | undefined;
		const pointerDown = (event: PointerEvent) => {
			if (event.pointerType === 'mouse' && !geometry.single) return;
			if (
				event.target instanceof Element &&
				event.target.closest('button, a, input, textarea, select, form, dialog') &&
				!event.target.closest('.printed-photo')
			)
				return;
			gesture = { x: event.clientX, y: event.clientY };
		};
		const pointerUp = (event: PointerEvent) => {
			if (!gesture) return;
			const x = event.clientX - gesture.x;
			const y = event.clientY - gesture.y;
			gesture = undefined;
			if (Math.abs(x) > 55 && Math.abs(x) > Math.abs(y) * 1.5)
				void turnPage(x < 0 ? 'next' : 'previous');
		};
		const cancelGesture = () => {
			gesture = undefined;
		};
		const keyboard = (event: KeyboardEvent) => {
			if (
				gallery?.open ||
				(event.target instanceof Element && event.target.closest('input, textarea, select, form'))
			)
				return;
			if (phase === 'open' && (event.key === 'ArrowRight' || event.key === 'ArrowLeft')) {
				event.preventDefault();
				void turnPage(event.key === 'ArrowRight' ? 'next' : 'previous');
			}
		};
		root.addEventListener('pointerdown', pointerDown, { passive: true });
		root.addEventListener('pointerup', pointerUp, { passive: true });
		root.addEventListener('pointercancel', cancelGesture);
		window.addEventListener('keydown', keyboard);
		const element = root;
		return () => {
			destroyed = true;
			motion?.destroy();
			resize.disconnect();
			window.visualViewport?.removeEventListener('resize', resizeBook);
			window.clearInterval(interval);
			window.removeEventListener('keydown', keyboard);
			element.removeEventListener('pointerdown', pointerDown);
			element.removeEventListener('pointerup', pointerUp);
			element.removeEventListener('pointercancel', cancelGesture);
			music?.pause();
			html.style.overflow = oldHtmlOverflow;
			body.style.overflow = oldBodyOverflow;
			body.style.overscrollBehavior = oldOverscroll;
		};
	});

	async function playMusic(): Promise<void> {
		try {
			await music?.play();
		} catch {
			musicPlaying = false;
		}
	}
	async function openBook(): Promise<void> {
		if (phase !== 'closed' || !initialized) return;
		phase = 'opening';
		void playMusic();
		await tick();
		const complete = () => {
			if (!destroyed) phase = 'open';
		};
		if (motion) await motion.open(geometry.single, complete);
		else complete();
	}
	async function turnPage(direction: BookDirection): Promise<void> {
		if (phase !== 'open' || turning || gallery?.open) return;
		const next = index + (direction === 'next' ? step : -step);
		if (next < 0 || next >= leaves.length) return;
		turning = { from: index, to: next, direction };
		await tick();
		if (destroyed) return;
		const host = root?.querySelector<HTMLElement>('.turning-paper');
		const front = root?.querySelector<HTMLElement>('.front-source .book-sheet');
		const back = root?.querySelector<HTMLElement>('.back-source .book-sheet');
		const complete = () => {
			if (!destroyed) {
				index = next;
				turning = undefined;
				preloadAdjacentImages();
			}
		};
		if (host && front && back && motion)
			await motion.turn({
				host,
				front,
				back,
				width: geometry.width,
				height: geometry.height,
				direction,
				complete
			});
		else complete();
	}

	async function loadGuest(): Promise<void> {
		if (!token) {
			guestLoading = false;
			return;
		}
		try {
			const result = await getPublicGuestRsvp(wedding.slug, token);
			if (destroyed) return;
			guest = result;
			attendance = result.rsvp_status === 'pending' ? '' : result.rsvp_status;
			message = result.message;
		} catch (error) {
			if (!destroyed)
				guestError =
					error instanceof PublicRsvpError ? error.message : 'Data RSVP belum dapat dimuat.';
		} finally {
			if (!destroyed) guestLoading = false;
		}
	}
	async function loadWishes(reset = false): Promise<void> {
		if (wishesLoading || (!wishesMore && !reset)) return;
		wishesLoading = true;
		wishesError = '';
		try {
			const next = reset ? 1 : wishesPage + 1;
			const result = await getPublicRsvpMessages(wedding.slug, next);
			if (destroyed) return;
			wishes = reset ? result.items : [...wishes, ...result.items];
			wishesPage = next;
			wishesMore = result.has_more;
			paginateWishes();
		} catch (error) {
			if (!destroyed)
				wishesError =
					error instanceof PublicRsvpError ? error.message : 'Ucapan belum dapat dimuat.';
		} finally {
			if (!destroyed) wishesLoading = false;
		}
	}
	async function nextWish(): Promise<void> {
		if (wishIndex + 1 < wishPages.length) {
			wishIndex += 1;
			return;
		}
		const next = wishIndex + 1;
		await loadWishes();
		if (next < wishPages.length) wishIndex = next;
	}
	async function sendRsvp(event: SubmitEvent): Promise<void> {
		event.preventDefault();
		if (sending) return;
		feedback = '';
		if (!attendance) {
			feedback = 'Pilih kehadiran terlebih dahulu.';
			return;
		}
		sending = true;
		try {
			const result = await submitPublicGuestRsvp({
				slug: wedding.slug,
				token,
				rsvp_status: attendance,
				message
			});
			if (destroyed) return;
			guest = result;
			message = result.message;
			feedback = 'Jawaban dan ucapan Anda sudah tersimpan.';
			void loadWishes(true);
		} catch (error) {
			if (!destroyed)
				feedback = error instanceof PublicRsvpError ? error.message : 'RSVP belum dapat dikirim.';
		} finally {
			if (!destroyed) sending = false;
		}
	}
	function showGallery(photoIndex: number): void {
		if (!wedding.gallery.length || turning) return;
		galleryIndex = (photoIndex + wedding.gallery.length) % wedding.gallery.length;
		if (!gallery?.open) gallery?.showModal();
	}
	function galleryKeys(event: KeyboardEvent): void {
		if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
			event.preventDefault();
			event.stopPropagation();
			showGallery(galleryIndex + (event.key === 'ArrowRight' ? 1 : -1));
		}
	}
</script>

{#snippet guestContent(kind: BookPage['kind'])}
	{#if kind === 'wishes'}
		<div class="wishes-page">
			{#if wishPages[wishIndex]}
				<div class="wish-list">
					{#each wishPages[wishIndex] as wish, position (`${wishIndex}-${position}`)}
						<article class="wish-entry">
							<h2>{wish.name}</h2>
							{#if wish.status}<span class="wish-status">{wish.status}</span>{/if}
							<p class="wish-message">{wish.text}</p>
						</article>
					{/each}
				</div>
			{:else}<p class="guest-notice">
					{wishesLoading ? 'Memuat ucapan…' : wishesError || 'Belum ada ucapan.'}
				</p>{/if}
			{#if wishesError && wishPages.length}<p class="form-feedback" role="status">
					{wishesError}
				</p>{/if}
			<div class="wish-navigation">
				<button
					type="button"
					onclick={() => (wishIndex -= 1)}
					disabled={wishIndex === 0 || wishesLoading}
					aria-label="Ucapan sebelumnya">←</button
				><span>{wishPages.length ? wishIndex + 1 : 0} / {wishPages.length}</span><button
					type="button"
					onclick={nextWish}
					disabled={wishesLoading || (wishIndex + 1 >= wishPages.length && !wishesMore)}
					aria-label="Ucapan berikutnya">{wishesLoading ? '…' : '→'}</button
				>
			</div>
		</div>
	{:else if guestLoading}<p class="guest-notice">Memuat RSVP…</p>
	{:else if !token}<p class="guest-notice">
			Gunakan tautan undangan pribadi yang dikirimkan mempelai untuk mengisi RSVP.
		</p>
	{:else if !guest}<p class="guest-notice">{guestError || 'Tautan RSVP tidak tersedia.'}</p>
	{:else}
		<form class="rsvp-form" onsubmit={sendRsvp}>
			<p class="guest-caption">Undangan untuk</p>
			<h2>{guest.name}</h2>
			<fieldset>
				<legend>Apakah Anda akan hadir?</legend><label class:selected={attendance === 'attending'}
					><input
						type="radio"
						name="book-attendance"
						value="attending"
						bind:group={attendance}
					/><span>Ya, saya hadir</span></label
				><label class:selected={attendance === 'not_attending'}
					><input
						type="radio"
						name="book-attendance"
						value="not_attending"
						bind:group={attendance}
					/><span>Maaf, tidak bisa hadir</span></label
				>
			</fieldset>
			<label class="message-field"
				><span>Ucapan &amp; Doa <small>{message.length}/1000</small></span><textarea
					bind:value={message}
					maxlength={1000}
					rows="3"
					placeholder="Tulis ucapan untuk mempelai"></textarea></label
			>
			<button type="submit" disabled={sending}>{sending ? 'Mengirim…' : 'Kirim RSVP'}</button>
			<p class="form-feedback" role="status">{feedback}</p>
		</form>
	{/if}
{/snippet}

{#snippet sheet(at: number)}
	{#if leaves[at]}<BookSheet
			leaf={leaves[at]}
			{wedding}
			number={at + 1}
			{guestContent}
			onPhoto={showGallery}
		/>{/if}
{/snippet}

<div
	class="book-room"
	class:single={geometry.single}
	class:revealed={phase !== 'closed'}
	class:opened={phase === 'open'}
	class:ready={initialized}
	bind:this={root}
	style:--visible-height={visibleHeight ? `${visibleHeight}px` : '100dvh'}
	style:--page-width={`${geometry.width}px`}
	style:--page-height={`${geometry.height}px`}
	style:--book-width={`${geometry.width * (geometry.single ? 1 : 2)}px`}
	style:--page-pad={`${geometry.padding}px`}
	style:--body-font={`${geometry.bodyFont}px`}
	style:--quote-font={`${geometry.quoteFont}px`}
	style:--title-font={`${geometry.titleFont}px`}
>
	<main class="book-stage" aria-label="Undangan pernikahan berbentuk buku">
		<div class="book-object" aria-busy={phase === 'opening' || Boolean(turning)}>
			<div
				class="open-book"
				inert={phase !== 'open' || Boolean(turning)}
				aria-hidden={phase !== 'open'}
			>
				{#if !geometry.single}<div class="page-bed left-bed">
						<div class="page-surface">{@render sheet(leftIndex)}</div>
					</div>{/if}
				<div class="page-bed right-bed">
					<div class="page-surface">{@render sheet(rightIndex)}</div>
				</div>
				{#if !geometry.single}<div class="book-gutter" aria-hidden="true"></div>{/if}
			</div>
			<div class="page-cast-shadow" aria-hidden="true"></div>
			{#if phase !== 'open'}
				<div class="hard-cover">
					<div class="cover-front">
						<div class="cover-content">
							<p class="cover-caption">Undangan Pernikahan</p>
							<div class="cover-print">
								{#if wedding.cover_url}<img
										src={wedding.cover_url}
										alt=""
										fetchpriority="high"
										draggable="false"
									/>{:else}<span>{groom.charAt(0)}<i>&amp;</i>{bride.charAt(0)}</span>{/if}
							</div>
							<h1>{groom}<i>&amp;</i>{bride}</h1>
							<p class="cover-date">{formatEventDate(wedding.reception || wedding.akad).date}</p>
							{#if target}<div class="countdown" aria-label="Hitung mundur pernikahan">
									{#each [{ value: countdown.days, label: 'Hari' }, { value: countdown.hours, label: 'Jam' }, { value: countdown.minutes, label: 'Menit' }, { value: countdown.seconds, label: 'Detik' }] as item (item.label)}<div
										>
											<strong>{String(item.value).padStart(2, '0')}</strong><small
												>{item.label}</small
											>
										</div>{/each}
								</div>{/if}
							<p class="recipient">Kepada Bapak/Ibu/Saudara/i,</p>
							<button
								type="button"
								class="open-button"
								onclick={openBook}
								disabled={!initialized || phase === 'opening'}
								>Buka Undangan <span aria-hidden="true">→</span></button
							>
						</div>
					</div>
					<div class="cover-back" aria-hidden="true" inert>{@render sheet(0)}</div>
				</div>
			{/if}
			{#if turning}
				<div class="turning-paper" aria-hidden="true" inert></div>
				<div class="turn-sources" aria-hidden="true" inert>
					<div class="front-source">{@render sheet(frontIndex)}</div>
					<div class="back-source">{@render sheet(backIndex)}</div>
				</div>
			{/if}
		</div>
	</main>
	{#if phase === 'open' && !geometry.single}
		<nav class="book-controls" aria-label="Navigasi halaman buku">
			<button
				class="previous-page"
				type="button"
				aria-label="Halaman sebelumnya"
				onclick={() => turnPage('previous')}
				disabled={index === 0 || Boolean(turning)}><span aria-hidden="true">←</span></button
			>
			<button
				class="next-page"
				type="button"
				aria-label="Halaman berikutnya"
				onclick={() => turnPage('next')}
				disabled={index + step >= leaves.length || Boolean(turning)}
				><span aria-hidden="true">→</span></button
			>
		</nav>
	{/if}
	{#if wedding.music_url}<audio
			bind:this={music}
			src={wedding.music_url}
			loop
			preload="none"
			onplay={() => (musicPlaying = true)}
			onpause={() => (musicPlaying = false)}
		></audio>{#if phase === 'open'}<button
				type="button"
				class="music-control"
				aria-label={musicPlaying ? 'Jeda musik' : 'Putar musik'}
				onclick={() => {
					if (music?.paused) void playMusic();
					else music?.pause();
				}}>{musicPlaying ? 'Ⅱ' : '♫'}</button
			>{/if}{/if}
	{#if wedding.gallery.length}<dialog
			class="photo-dialog"
			bind:this={gallery}
			aria-label="Galeri pernikahan"
			onkeydown={galleryKeys}
			onclick={(event) => {
				if (event.target === event.currentTarget) gallery?.close();
			}}
		>
			<button
				type="button"
				class="close-photo"
				aria-label="Tutup foto"
				onclick={() => gallery?.close()}>×</button
			><button
				type="button"
				aria-label="Foto sebelumnya"
				onclick={() => showGallery(galleryIndex - 1)}
				disabled={wedding.gallery.length < 2}>←</button
			><img
				src={wedding.gallery[galleryIndex]?.url}
				alt={`Galeri pernikahan ${galleryIndex + 1}`}
			/><button
				type="button"
				aria-label="Foto berikutnya"
				onclick={() => showGallery(galleryIndex + 1)}
				disabled={wedding.gallery.length < 2}>→</button
			>
		</dialog>{/if}
</div>

<style>
	.book-room {
		position: fixed;
		inset: 0;
		width: 100%;
		height: 100dvh;
		overflow: hidden;
		overscroll-behavior: none;
		color: #493b2e;
		background:
			radial-gradient(ellipse at 18% 7%, #f9f6ed 0%, transparent 62%),
			radial-gradient(ellipse at 84% 93%, #c8b9a3 0%, transparent 70%), #e9e1d3;
		isolation: isolate;
		font-family: Georgia, 'Times New Roman', serif;
	}
	.book-room::before {
		content: '';
		position: absolute;
		inset: 0;
		opacity: 0.2;
		background: repeating-linear-gradient(113deg, #ffffff0a 0 2px, #6e553909 2px 3px);
		pointer-events: none;
	}
	.book-room * {
		box-sizing: border-box;
	}
	.book-stage {
		position: absolute;
		inset: 0;
		display: grid;
		place-items: center;
		perspective: 2400px;
		height: var(--visible-height);
		touch-action: pan-y pinch-zoom;
	}
	.book-room:not(.ready) .book-object {
		visibility: hidden;
	}
	.book-object {
		width: var(--book-width);
		height: var(--page-height);
		position: relative;
		transform: translateX(-25%);
		transform-style: preserve-3d;
	}
	.single .book-object,
	.opened .book-object {
		transform: translateX(0);
	}
	.book-object::before {
		content: '';
		position: absolute;
		left: 50%;
		right: -4px;
		top: 8px;
		bottom: -9px;
		border-radius: 5px;
		box-shadow:
			12px 28px 35px #56412c37,
			2px 5px 8px #2e1e1545;
		transform: translateZ(-6px);
	}
	.revealed .book-object::before,
	.single .book-object::before {
		left: -4px;
	}
	.open-book {
		position: absolute;
		inset: 0;
		visibility: hidden;
	}
	.revealed .open-book {
		visibility: visible;
	}
	.page-bed {
		position: absolute;
		top: 0;
		width: var(--page-width);
		height: var(--page-height);
	}
	.left-bed {
		left: 0;
	}
	.right-bed {
		right: 0;
	}
	.page-bed::before {
		content: '';
		position: absolute;
		inset: -4px -7px -10px;
		background: #69543c;
		border: 1px solid #58432f;
		border-radius: 3px;
		box-shadow: inset 0 0 0 2px #b8a080;
	}
	.page-bed::after {
		content: '';
		position: absolute;
		inset: 0 -3px -6px;
		background: repeating-linear-gradient(0deg, #d3c4ab 0 1px, #f5ecd8 1px 2px);
		border-radius: 1px;
		box-shadow: 0 2px 2px #59472d39;
	}
	.page-surface {
		position: absolute;
		inset: 0;
		z-index: 1;
	}
	.page-surface::after {
		content: '';
		position: absolute;
		inset: 0;
		pointer-events: none;
		box-shadow: inset 0 0 18px #7956330b;
	}
	.left-bed .page-surface::after {
		background: linear-gradient(
			90deg,
			#bc98710b 0%,
			transparent 8%,
			transparent 78%,
			#76563512 91%,
			#4c311d26 99%,
			#4b301b2b 100%
		);
	}
	.right-bed .page-surface::after {
		background: linear-gradient(
			90deg,
			#5d3d243a 0%,
			#af876216 4%,
			transparent 12%,
			transparent 88%,
			#ab8c590c 100%
		);
	}
	.book-gutter {
		position: absolute;
		top: 0;
		bottom: 0;
		left: 50%;
		width: 26px;
		transform: translateX(-50%);
		background: linear-gradient(
			90deg,
			transparent,
			#593b2615 32%,
			#fff9e735 43%,
			#4e311b45 51%,
			#79563611 66%,
			transparent
		);
		z-index: 3;
		pointer-events: none;
	}
	.page-cast-shadow {
		position: absolute;
		inset: 0;
		opacity: 0;
		z-index: 4;
		background: linear-gradient(
			90deg,
			transparent 5%,
			#3b24181a 20%,
			#3b2418 49%,
			#3b241870 63%,
			transparent 97%
		);
		pointer-events: none;
	}
	.hard-cover {
		position: absolute;
		left: 50%;
		top: -3px;
		width: var(--page-width);
		height: calc(var(--page-height) + 6px);
		transform-origin: left center;
		transform-style: preserve-3d;
		z-index: 6;
		--cover-shade: 0;
	}
	.single .hard-cover {
		left: 0;
	}
	.cover-front,
	.cover-back {
		position: absolute;
		inset: 0;
		backface-visibility: hidden;
		border-radius: 2px 5px 5px 2px;
	}
	.cover-front {
		color: #4d422e;
		background:
			repeating-linear-gradient(0deg, #d8c7a920 0 1px, transparent 1px 3px),
			repeating-linear-gradient(90deg, #fffae72b 0 1px, transparent 1px 3px), #dbcfb5;
		box-shadow:
			inset 10px 0 9px -7px #fff8df,
			inset 15px 0 10px -9px #5b463a82,
			inset -1px 0 1px #fff8e2,
			3px 4px 5px #5c442831;
		border: 1px solid #b8a588;
	}
	.cover-front::before {
		content: '';
		position: absolute;
		inset: 13px 12px 13px 19px;
		border: 1px solid #ae946c;
		box-shadow:
			0 0 0 1px #f6edd159,
			inset 0 0 0 1px #f9eac53d;
		pointer-events: none;
	}
	.cover-front::after,
	.cover-back::after {
		content: '';
		position: absolute;
		inset: 0;
		background: #503b25;
		opacity: var(--cover-shade);
		pointer-events: none;
	}
	.cover-back {
		transform: rotateY(180deg);
		padding-block: 3px;
		background: #f8f2e5;
		box-shadow: inset 5px 0 14px #95755122;
	}
	.cover-content {
		position: absolute;
		inset: 0;
		padding: calc(var(--page-pad) * 0.8) var(--page-pad);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: clamp(7px, 1.3dvh, 13px);
		text-align: center;
	}
	.cover-caption {
		margin: 0;
		font:
			600 9px/1.4 'Avenir Next',
			Avenir,
			sans-serif;
		letter-spacing: 0.22em;
		text-transform: uppercase;
		color: #806b49;
	}
	.cover-print {
		min-height: 0;
		width: 88%;
		flex: 1 1 0;
		max-height: 31%;
		border: 5px solid #f0e6cf;
		outline: 1px solid #bba781;
		box-shadow: 0 3px 6px #6e4d2c24;
		overflow: hidden;
		display: grid;
		place-items: center;
		color: #998260;
		font-size: var(--title-font);
	}
	.cover-print img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}
	.cover-print i {
		font-size: 0.6em;
		margin-inline: 8px;
	}
	h1 {
		margin: 0;
		font-size: calc(var(--title-font) * 1.04);
		line-height: 0.96;
		font-weight: 400;
		letter-spacing: -0.04em;
		max-width: 100%;
		display: flex;
		flex-direction: column;
		overflow-wrap: anywhere;
		text-shadow: 0 1px 0 #fff4d9;
	}
	h1 i {
		font-size: 0.52em;
		line-height: 1.35;
		color: #a1824e;
	}
	.cover-date {
		margin: 0;
		color: #8a7453;
		font:
			600 10px/1.5 'Avenir Next',
			Avenir,
			sans-serif;
	}
	.countdown {
		display: flex;
		width: 100%;
		justify-content: center;
		padding-block: 3px;
	}
	.countdown div {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 3px;
		border-right: 1px solid #b4a0837d;
	}
	.countdown div:last-child {
		border: 0;
	}
	.countdown strong {
		font-weight: 400;
		font-size: calc(var(--body-font) * 1.55);
		line-height: 1;
		font-variant-numeric: tabular-nums;
	}
	.countdown small {
		font:
			600 8px/1.4 'Avenir Next',
			Avenir,
			sans-serif;
		text-transform: uppercase;
		letter-spacing: 0.12em;
		color: #8c7656;
	}
	.recipient {
		margin: 0;
		font:
			500 9px/1.3 'Avenir Next',
			Avenir,
			sans-serif;
		color: #827055;
	}
	.open-button {
		border: 1px solid #9b8056;
		color: #f8efd8;
		background: #63583f;
		min-height: 37px;
		width: 100%;
		padding: 9px 15px;
		font:
			600 10px/1.5 'Avenir Next',
			Avenir,
			sans-serif;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		display: flex;
		justify-content: space-between;
		align-items: center;
		cursor: pointer;
		box-shadow: 0 2px 0 #af9770;
	}
	.open-button:disabled {
		cursor: wait;
		opacity: 0.7;
	}
	.turning-paper {
		position: absolute;
		top: 0;
		left: 50%;
		width: var(--page-width);
		height: var(--page-height);
		transform-style: preserve-3d;
		z-index: 5;
		pointer-events: none;
	}
	.single .turning-paper {
		left: 0;
	}
	.turn-sources {
		position: absolute;
		top: 0;
		left: 0;
		visibility: hidden;
		pointer-events: none;
	}
	.front-source,
	.back-source {
		width: var(--page-width);
		height: var(--page-height);
	}
	.book-controls {
		--nav-size: clamp(34px, 4vw, 44px);
		--nav-gap: clamp(2px, 0.5vw, 12px);
		position: absolute;
		left: 50%;
		top: calc(var(--visible-height) / 2);
		transform: translate(-50%, -50%);
		width: var(--book-width);
		height: var(--nav-size);
		pointer-events: none;
		z-index: 8;
	}
	.book-controls button {
		position: absolute;
		top: 0;
		width: var(--nav-size);
		height: var(--nav-size);
		display: grid;
		place-items: center;
		padding: 0;
		border: 1px solid #a58e6c88;
		border-radius: 50%;
		background: #f8f2e5ed;
		color: #68563e;
		cursor: pointer;
		pointer-events: auto;
		box-shadow: 0 5px 14px #5c493425;
		transition:
			background 180ms ease,
			transform 180ms ease,
			box-shadow 180ms ease;
	}
	.book-controls .previous-page {
		left: calc(-1 * (var(--nav-size) + var(--nav-gap)));
	}
	.book-controls .next-page {
		right: calc(-1 * (var(--nav-size) + var(--nav-gap)));
	}
	.book-controls button span {
		font:
			24px/1 Georgia,
			serif;
		transform: translateY(-1px);
	}
	.book-controls button:hover:not(:disabled) {
		background: #fffaf0;
		box-shadow: 0 7px 18px #5c49343b;
		transform: translateY(-2px);
	}
	.book-controls button:disabled {
		opacity: 0.35;
		cursor: default;
	}
	@media (pointer: coarse) {
		.book-controls {
			display: none;
		}
	}
	.music-control {
		position: absolute;
		right: 20px;
		top: calc(var(--visible-height) - 59px - env(safe-area-inset-bottom));
		width: 40px;
		height: 40px;
		border-radius: 50%;
		border: 1px solid #ad95733d;
		background: #f9f2e37d;
		color: #806747;
		cursor: pointer;
		font:
			16px Georgia,
			serif;
	}
	.book-room :is(button, input, textarea):focus-visible {
		outline: 2px solid #937245;
		outline-offset: 4px;
	}
	.rsvp-form,
	.wishes-page {
		height: 100%;
		min-height: 0;
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: clamp(5px, 1.2vh, 10px);
	}
	.rsvp-form h2,
	.wishes-page h2 {
		margin: 0;
		font-size: calc(var(--title-font) * 0.8);
		font-weight: 400;
		line-height: 1.15;
		overflow-wrap: anywhere;
	}
	.guest-caption,
	.guest-notice,
	.form-feedback {
		margin: 0;
		font-size: calc(var(--body-font) * 0.84);
		line-height: 1.5;
		color: #937d60;
	}
	.guest-notice {
		height: 100%;
		display: flex;
		align-items: center;
	}
	.rsvp-form fieldset {
		border: 0;
		padding: 0;
		margin: 0;
	}
	.rsvp-form legend {
		font-size: var(--body-font);
		margin-bottom: 8px;
	}
	.rsvp-form fieldset label {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 9px 10px;
		border: 1px solid #cbb99a;
		margin-bottom: 6px;
		cursor: pointer;
		font-size: calc(var(--body-font) * 0.88);
	}
	.rsvp-form fieldset label.selected {
		background: #e9dfcb;
		border-color: #9a835e;
	}
	.rsvp-form input {
		width: 14px;
		height: 14px;
		accent-color: #87724c;
	}
	.rsvp-form .message-field {
		display: flex;
		flex-direction: column;
		gap: 6px;
		flex: 1 1 70px;
		min-height: 54px;
	}
	.rsvp-form .message-field > span {
		display: flex;
		justify-content: space-between;
		font:
			500 11px/1.4 'Avenir Next',
			Avenir,
			sans-serif;
		color: #937d60;
	}
	.rsvp-form textarea {
		width: 100%;
		min-height: 36px;
		max-height: 140px;
		flex: 1;
		resize: none;
		border: 1px solid #c7b598;
		border-radius: 0;
		color: #58442e;
		background: #fffdf45c;
		padding: 10px;
		font:
			16px/1.5 Georgia,
			serif;
	}
	.rsvp-form button {
		min-height: 38px;
		border: 1px solid #78603d;
		background: #756246;
		color: #fff7e8;
		padding: 9px 12px;
		font:
			600 11px/1.3 'Avenir Next',
			Avenir,
			sans-serif;
		cursor: pointer;
	}
	.rsvp-form button:disabled {
		opacity: 0.6;
	}
	.form-feedback {
		min-height: 1.5em;
		color: #785332;
	}
	.wishes-page {
		justify-content: flex-start;
		gap: 9px;
	}
	.wish-list {
		display: flex;
		flex-direction: column;
		gap: 10px;
		min-height: 0;
	}
	.wish-entry {
		padding-bottom: 9px;
		border-bottom: 1px solid #d9c9ae;
	}
	.wish-entry:last-child {
		border-bottom: 0;
	}
	.wish-entry h2 {
		font-size: calc(var(--title-font) * 0.65);
	}
	.wish-status {
		font:
			600 10px/1.4 'Avenir Next',
			Avenir,
			sans-serif;
		color: #9a805d;
	}
	.wish-message {
		white-space: pre-wrap;
		overflow-wrap: anywhere;
		margin: 5px 0 0;
		font-size: var(--body-font);
		line-height: 1.65;
	}
	.wish-navigation {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-top: auto;
		min-height: 32px;
		color: #9b8463;
		font-size: 10px;
	}
	.wish-navigation button {
		width: 35px;
		height: 32px;
		border: 1px solid #c9b797;
		color: #816b47;
		background: transparent;
		cursor: pointer;
		font-size: 18px;
	}
	.wish-navigation button:disabled {
		opacity: 0.3;
	}
	.photo-dialog {
		position: fixed;
		inset: 0;
		max-width: none;
		max-height: none;
		width: 100%;
		height: 100dvh;
		border: 0;
		padding: 50px 25px;
		background: #201a13ed;
		color: #fff4df;
		overflow: hidden;
	}
	.photo-dialog[open] {
		display: grid;
		grid-template-columns: 40px minmax(0, 1fr) 40px;
		align-items: center;
		gap: 12px;
	}
	.photo-dialog::backdrop {
		background: #201a13e6;
	}
	.photo-dialog img {
		width: 100%;
		height: 100%;
		min-height: 0;
		object-fit: contain;
	}
	.photo-dialog button {
		width: 38px;
		height: 38px;
		border: 1px solid #c5af8573;
		color: inherit;
		background: #0002;
		font-size: 24px;
		cursor: pointer;
	}
	.photo-dialog button:disabled {
		opacity: 0.25;
	}
	.close-photo {
		position: absolute;
		top: 15px;
		right: 18px;
	}
	@media (max-width: 759px) {
		.photo-dialog {
			padding-inline: 8px;
		}
		.photo-dialog[open] {
			grid-template-columns: 32px minmax(0, 1fr) 32px;
			gap: 5px;
		}
		.photo-dialog button {
			width: 30px;
			height: 34px;
		}
	}
	@media (max-height: 460px) {
		.cover-content {
			gap: 5px;
			padding-block: 12px;
		}
		.cover-caption,
		.recipient {
			display: none;
		}
		.cover-print {
			display: none;
		}
		h1 {
			font-size: 26px;
		}
		.countdown strong {
			font-size: 18px;
		}
		.cover-date {
			font-size: 9px;
		}
		.music-control {
			top: calc(var(--visible-height) - 41px);
			width: 34px;
			height: 34px;
		}
		.rsvp-form,
		.wishes-page {
			gap: 4px;
		}
		.rsvp-form .guest-caption {
			display: none;
		}
		.rsvp-form h2 {
			font-size: 18px;
		}
		.rsvp-form legend {
			margin-bottom: 3px;
		}
		.rsvp-form fieldset label {
			padding: 4px 6px;
			margin-bottom: 3px;
		}
		.form-feedback {
			min-height: 1.5em;
			font-size: 11px;
		}
		.rsvp-form button {
			min-height: 28px;
			padding: 5px;
		}
		.rsvp-form textarea {
			padding: 5px;
		}
	}
</style>
