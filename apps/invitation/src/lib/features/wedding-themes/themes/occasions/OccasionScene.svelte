<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { OccasionVariant } from './occasion-types.js';
	import OccasionOrnaments from './OccasionOrnaments.svelte';
	let {
		variant,
		cover,
		couple,
		names,
		date,
		recipient = '',
		opening = false,
		onopen
	}: {
		variant: OccasionVariant;
		cover: string;
		couple: string;
		names: Snippet;
		date: string;
		recipient?: string;
		opening?: boolean;
		onopen?: () => void;
	} = $props();
</script>

<div class="occasion-scene" class:occasion-scene-open={!onopen}>
	<div class="occasion-scene-photo">
		{#if cover}
			<img
				src={cover}
				alt={couple}
				width="1200"
				height="1200"
				fetchpriority={onopen ? 'high' : 'auto'}
				decoding="async"
			/>
		{/if}
	</div>
	{#if variant === 'luxury-1'}
		<OccasionOrnaments {variant} placement="cover" />
	{/if}
	<div class="occasion-scene-content">
		<div class="occasion-title">
			{#if onopen}
				<h1 class="occasion-names" aria-label={couple}>{@render names()}</h1>
			{:else}
				<h2 class="occasion-names" aria-label={couple}>{@render names()}</h2>
			{/if}
			{#if date}<p class="occasion-date">{date}</p>{/if}
		</div>
		{#if onopen}
			<div class="occasion-invite">
				<div class="edition-recipient">
					<p>Kepada Bapak/Ibu/Saudara/i,</p>
					{#if recipient}<p class="edition-recipient-name">{recipient}</p>{/if}
				</div>
				<button
					class="edition-outline edition-open-button"
					type="button"
					onclick={onopen}
					disabled={opening}>Buka Undangan</button
				>
			</div>
		{/if}
		{#if variant === 'wedding-anniversary-1'}
			<OccasionOrnaments {variant} placement="cover" />
		{/if}
	</div>
</div>
