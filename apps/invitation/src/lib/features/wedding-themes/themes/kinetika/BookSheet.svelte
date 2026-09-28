<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { WeddingData } from '#lib/features/weddings/index.js';
	import { formatEventDate, formatPersonName, safeExternalURL } from '../../shared/theme-utils.js';
	import type { BookPage } from './book-content.js';

	let {
		leaf,
		wedding,
		number = 0,
		guestContent,
		onPhoto
	}: {
		leaf: BookPage;
		wedding: WeddingData;
		number?: number;
		guestContent?: Snippet<[BookPage['kind']]>;
		onPhoto?: (index: number) => void;
	} = $props();
	const person = $derived(leaf.person ?? 'groom');
	const name = $derived(
		formatPersonName(wedding[`${person}_name`]) ||
			(person === 'groom' ? 'Mempelai Pria' : 'Mempelai Wanita')
	);
	const father = $derived(formatPersonName(wedding[`${person}_father_name`]));
	const mother = $derived(formatPersonName(wedding[`${person}_mother_name`]));
	const groom = $derived(formatPersonName(wedding.groom_name) || 'Mempelai Pria');
	const bride = $derived(formatPersonName(wedding.bride_name) || 'Mempelai Wanita');
	const maps = $derived(safeExternalURL(wedding.maps));
	const giftPeople = $derived(
		(['groom', 'bride'] as const).filter((person) => wedding[`${person}_payment_number`])
	);
</script>

<section
	class="book-sheet"
	class:verso={number % 2 === 1}
	aria-label={leaf.label || 'Halaman buku'}
>
	<header class="running-head">
		<span>{leaf.label}</span><span aria-hidden="true">{leaf.kind === 'endpaper' ? '' : '❧'}</span>
	</header>
	<div
		class="sheet-body"
		class:person-page={leaf.kind === 'person'}
		class:event-page={leaf.kind === 'event' || leaf.kind === 'location'}
		class:quote-page={leaf.kind === 'quote'}
		class:gallery-page={leaf.kind === 'gallery'}
		class:gift-page={leaf.kind === 'gift'}
		class:closing-page={leaf.kind === 'closing' || leaf.kind === 'endpaper'}
	>
		{#if leaf.kind === 'person'}
			<div class="printed-portrait">
				{#if wedding[`${person}_photo_url`]}<img
						src={wedding[`${person}_photo_url`]}
						alt={name}
						draggable="false"
					/>{:else}<span>{name.charAt(0)}</span>{/if}
			</div>
			<h2 class="person-name">{name}</h2>
			{#if father || mother}<p class="parents">
					{person === 'groom' ? 'Putra' : 'Putri'} dari<br /><strong
						>{father}{father && mother ? ' & ' : ''}{mother}</strong
					>
				</p>{/if}
		{:else if leaf.kind === 'event' || leaf.kind === 'location'}
			<h2>{leaf.date || leaf.title}</h2>
			{#if leaf.time}<p class="event-time">{leaf.time}</p>{/if}
			<span class="little-rule" aria-hidden="true"></span>
			<p class="body-copy location-copy">{leaf.text}</p>
			{#if maps}<a class="paper-link" href={maps} target="_blank" rel="noreferrer"
					>Buka Google Maps <span aria-hidden="true">↗</span></a
				>{/if}
		{:else if leaf.kind === 'quote'}
			{#if leaf.quoteStart}<span class="quotation-mark" aria-hidden="true">“</span>{/if}
			<blockquote>{leaf.text}</blockquote>
			{#if leaf.quoteEnd}<span class="quotation-mark closing-mark" aria-hidden="true">”</span>{/if}
		{:else if leaf.kind === 'story'}
			<div class="story-page">
				{#if leaf.image}<div class="story-image" style:height={`${leaf.imageHeight}px`}>
						<img src={leaf.image} alt={leaf.title || 'Foto cerita kami'} draggable="false" />
					</div>{/if}
				<h2>{leaf.title}</h2>
				{#if leaf.date}<p class="story-date">{leaf.date}</p>{/if}
				<p class="body-copy">{leaf.text}</p>
			</div>
		{:else if leaf.kind === 'gallery'}
			<div class="gallery-grid" data-count={leaf.galleryImages?.length}>
				{#each leaf.galleryImages ?? [] as photo (photo.index)}
					<button
						type="button"
						class="printed-photo"
						onclick={() => onPhoto?.(photo.index)}
						aria-label={`Perbesar foto ${photo.index + 1}`}
						><img
							src={photo.url}
							alt={`Galeri pernikahan ${photo.index + 1}`}
							draggable="false"
						/></button
					>
				{/each}
			</div>
		{:else if leaf.kind === 'gift'}
			<svg
				class="rings"
				viewBox="0 0 100 70"
				fill="none"
				stroke="currentColor"
				stroke-width="1.2"
				aria-hidden="true"
				><circle cx="38" cy="38" r="23" /><circle cx="62" cy="38" r="23" /><path
					d="m31 12 7-9 7 9M55 12l7-9 7 9"
				/></svg
			>
			<div class="gift-accounts">
				{#each giftPeople as recipient (recipient)}
					<div class="gift-account">
						<p class="gift-recipient">{recipient === 'groom' ? groom : bride}</p>
						<h2>{wedding[`${recipient}_payment_provider`] || 'Rekening / e-wallet'}</h2>
						<p class="account-number">{wedding[`${recipient}_payment_number`]}</p>
						{#if wedding[`${recipient}_payment_account_name`]}<p class="parents">
								Atas nama <strong>{wedding[`${recipient}_payment_account_name`]}</strong>
							</p>{/if}
					</div>
				{/each}
			</div>
		{:else if leaf.kind === 'rsvp' || leaf.kind === 'wishes'}
			{@render guestContent?.(leaf.kind)}
		{:else if leaf.kind === 'closing'}
			{#if wedding.cover_url}<div class="closing-print">
					<img src={wedding.cover_url} alt="" draggable="false" />
				</div>{/if}
			<h2 class="closing-names">{groom}<em>&amp;</em>{bride}</h2>
			<p class="closing-date">{formatEventDate(wedding.reception || wedding.akad).date}</p>
		{:else}
			<div class="endpaper-monogram" aria-hidden="true">
				<span>{groom.charAt(0)}</span><i>&amp;</i><span>{bride.charAt(0)}</span>
			</div>
		{/if}
	</div>
	<footer class="folio">{String(number).padStart(2, '0')}</footer>
</section>

<style>
	.book-sheet {
		width: 100%;
		height: 100%;
		box-sizing: border-box;
		display: grid;
		grid-template-rows: 22px minmax(0, 1fr) 20px;
		gap: 2px;
		padding: var(--page-pad);
		color: #44382d;
		background:
			radial-gradient(ellipse at 20% 10%, #fffdf6 0, transparent 75%),
			repeating-linear-gradient(0deg, #886b4603 0 1px, transparent 1px 3px), #f8f2e5;
		font-family: Georgia, 'Times New Roman', serif;
		overflow-wrap: anywhere;
		overflow: clip;
		-webkit-font-smoothing: antialiased;
	}
	.book-sheet * {
		box-sizing: border-box;
	}
	.book-sheet :is(button, a):focus-visible {
		outline: 2px solid #937245;
		outline-offset: 4px;
	}
	.running-head {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 10px;
		font:
			600 9px/1.3 'Avenir Next',
			Avenir,
			sans-serif;
		text-transform: uppercase;
		letter-spacing: 0.15em;
		color: #93806a;
		border-bottom: 1px solid #d8c9b0;
	}
	.running-head span:last-child {
		font-size: 15px;
		line-height: 0.7;
	}
	.sheet-body {
		min-height: 0;
		padding-block: 10px;
		font-size: var(--body-font);
	}
	h2 {
		margin: 0;
		font-weight: 400;
		font-size: var(--title-font);
		line-height: 1.15;
		letter-spacing: -0.035em;
		overflow-wrap: anywhere;
	}
	p {
		margin: 0;
	}
	.folio {
		display: flex;
		align-items: flex-end;
		justify-content: flex-end;
		color: #95836d;
		font-size: 10px;
		font-style: italic;
	}
	.verso .folio {
		justify-content: flex-start;
	}
	.person-page {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 16px;
		text-align: center;
	}
	.printed-portrait {
		min-height: 0;
		flex: 1 1 0;
		max-height: 61%;
		width: 86%;
		padding: 6px;
		border: 1px solid #d6c7af;
		background: #fffdf5;
		box-shadow: 1px 4px 8px #5d432710;
		display: grid;
		place-items: center;
	}
	.printed-portrait img {
		display: block;
		width: 100%;
		height: 100%;
		min-height: 0;
		object-fit: cover;
	}
	.printed-portrait > span {
		font-size: 70px;
		color: #b29874;
	}
	.person-name {
		font-size: calc(var(--title-font) * 1.1);
		line-height: 1.02;
	}
	.parents {
		font-size: calc(var(--body-font) * 0.84);
		line-height: 1.5;
		color: #8a7761;
	}
	.parents strong {
		font-weight: 400;
		color: #544333;
	}
	.event-page {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: flex-start;
	}
	.event-time {
		color: #90724e;
		font-size: var(--body-font);
		line-height: 1.6;
		margin-top: 12px;
	}
	.little-rule {
		width: 42px;
		height: 1px;
		flex: 0 0 1px;
		margin: 18px 0;
		background: #b99b6f;
	}
	.body-copy {
		font-size: var(--body-font);
		line-height: 1.65;
		white-space: pre-wrap;
		overflow-wrap: anywhere;
	}
	.location-copy {
		line-height: 1.6;
	}
	.paper-link {
		margin-top: 18px;
		padding-block: 4px;
		color: #81623d;
		border-bottom: 1px solid #ad9370;
		text-decoration: none;
		font:
			600 10px/1.5 'Avenir Next',
			Avenir,
			sans-serif;
		letter-spacing: 0.035em;
	}
	.paper-link span {
		padding-left: 8px;
	}
	.quote-page {
		display: flex;
		flex-direction: column;
		justify-content: center;
	}
	.quotation-mark {
		color: #bfa57a;
		font-size: 64px;
		height: 32px;
		line-height: 1;
	}
	.quotation-mark:not(.closing-mark) {
		margin-bottom: 12px;
	}
	.closing-mark {
		align-self: flex-end;
		margin-top: 8px;
	}
	blockquote {
		margin: 0;
		font-size: var(--quote-font);
		line-height: 1.42;
		white-space: pre-wrap;
		overflow-wrap: anywhere;
	}
	.story-page {
		display: flex;
		flex-direction: column;
		gap: 8px;
		min-height: 0;
	}
	.story-image {
		flex: none;
		width: 100%;
		padding: 4px;
		border: 1px solid #d6c7af;
		background: #fffdf5;
		box-shadow: 1px 4px 8px #5d432710;
	}
	.story-image img {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.story-date {
		color: #9a7d58;
		margin: 0;
		font:
			600 10px/1.6 'Avenir Next',
			Avenir,
			sans-serif;
		letter-spacing: 0.04em;
	}
	.gallery-page {
		display: grid;
	}
	.gallery-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		grid-template-rows: repeat(2, minmax(0, 1fr));
		gap: clamp(5px, 1.5vw, 12px);
		min-height: 0;
	}
	.gallery-grid[data-count='1'] .printed-photo {
		grid-column: 1 / -1;
		grid-row: 1 / -1;
	}
	.gallery-grid[data-count='2'] .printed-photo {
		grid-row: 1 / -1;
		align-self: center;
		height: min(62%, 250px);
		background: transparent;
		box-shadow: none;
	}
	.gallery-grid[data-count='2'] .printed-photo img {
		object-fit: contain;
	}
	.gallery-grid[data-count='3'] .printed-photo:last-child {
		grid-column: 1 / -1;
	}
	.printed-photo {
		display: block;
		width: 100%;
		height: 100%;
		min-height: 0;
		border: 0;
		padding: 3px;
		background: #fffdf5;
		box-shadow: 1px 3px 8px #5d43271c;
		cursor: zoom-in;
	}
	.printed-photo img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}
	.gift-page {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		gap: clamp(8px, 2vh, 16px);
		text-align: center;
	}
	.rings {
		width: 72px;
		height: 46px;
		flex: none;
		color: #a3895c;
	}
	.gift-accounts {
		display: grid;
		gap: clamp(9px, 2vh, 18px);
		width: 100%;
		min-height: 0;
	}
	.gift-account {
		padding: clamp(7px, 1.6vh, 13px) 4px;
		border-top: 1px solid #d7c5a8;
	}
	.gift-account h2 {
		font-size: calc(var(--title-font) * 0.68);
		margin-block: 4px;
	}
	.gift-recipient {
		font-size: var(--body-font);
		color: #8b765a;
	}
	.account-number {
		font-size: calc(var(--body-font) * 1.25);
		font-variant-numeric: tabular-nums;
		overflow-wrap: anywhere;
	}
	.closing-page {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 18px;
		text-align: center;
	}
	.closing-print {
		width: 100%;
		min-height: 0;
		flex: 1;
		max-height: 43%;
		padding: 6px;
		background: #fffdf6;
		box-shadow: 1px 3px 6px #49321a20;
		transform: rotate(-2deg);
	}
	.closing-print img {
		width: 100%;
		height: 100%;
		display: block;
		object-fit: cover;
	}
	.closing-names {
		display: flex;
		flex-direction: column;
		align-items: center;
	}
	.closing-names em {
		font-size: 0.6em;
		color: #aa8d5e;
	}
	.closing-date {
		font-size: 11px;
		color: #937e62;
	}
	.endpaper-monogram {
		display: flex;
		align-items: center;
		gap: 9px;
		color: #b49d76;
		font-size: calc(var(--title-font) * 1.4);
		border-top: 1px solid #d1bd99;
		border-bottom: 1px solid #d1bd99;
		padding-block: 18px;
	}
	.endpaper-monogram i {
		font-size: 0.5em;
	}
	@media (max-height: 460px) {
		.sheet-body {
			padding-block: 4px;
		}
		.person-page,
		.closing-page,
		.gift-page {
			gap: 8px;
		}
		.printed-portrait {
			max-height: 42%;
		}
		.person-name {
			font-size: 24px;
		}
		.parents {
			font-size: 11px;
			line-height: 1.3;
		}
		.rings {
			display: none;
		}
		.event-time {
			margin-top: 6px;
		}
		.little-rule {
			margin-block: 8px;
		}
		.paper-link {
			margin-top: 8px;
			font-size: 9px;
		}
	}
</style>
