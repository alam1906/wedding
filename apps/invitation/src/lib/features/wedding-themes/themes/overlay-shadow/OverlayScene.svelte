<script lang="ts">
	import type { Snippet } from 'svelte';
	import OverlayShadows from './OverlayShadows.svelte';
	let {
		variant,
		cover,
		couple,
		names,
		date,
		recipient = '',
		timer,
		opening = false,
		onopen
	}: {
		variant: 1 | 2 | 3;
		cover: string;
		couple: string;
		names: Snippet;
		date: string;
		recipient?: string;
		timer?: Snippet;
		opening?: boolean;
		onopen?: () => void;
	} = $props();
</script>

<div class="overlay-scene" class:overlay-scene-hero={!onopen}>
	{#if variant === 1 && cover}
		<div class="overlay-mobile-photo" aria-hidden="true">
			<img
				src={cover}
				alt=""
				width="1200"
				height="900"
				fetchpriority={onopen ? 'high' : 'auto'}
				decoding="async"
			/>
		</div>
	{/if}
	{#if variant !== 2}<OverlayShadows />{/if}
	{#if variant === 2 && cover}
		<div class="overlay-print overlay-scene-photo">
			<img
				src={cover}
				alt={couple}
				width="900"
				height="900"
				fetchpriority={onopen ? 'high' : 'auto'}
				decoding="async"
			/>
		</div>
	{/if}
	<div class={'overlay-scene-copy ' + (onopen ? 'edition-cover-card' : 'overlay-hero-copy')}>
		<div class="edition-cover-heading">
			{#if onopen}<h1 class="edition-cover-names" aria-label={couple}>{@render names()}</h1>
			{:else}<p class="edition-hero-names" aria-label={couple}>{@render names()}</p>{/if}
		</div>
		<p class="edition-cover-date">{date}</p>
		{#if timer && variant !== 3}{@render timer()}{/if}
		{#if onopen}
			<div class="edition-recipient">
				<p>Kepada Bapak/Ibu/Saudara/i,</p>
				{#if recipient}<p class="edition-recipient-name">{recipient}</p>{/if}
			</div>
			<button
				type="button"
				class="edition-outline edition-open-button"
				onclick={onopen}
				disabled={opening}>Buka Undangan</button
			>
		{/if}
	</div>
</div>
