<script lang="ts">
	import type { Snippet } from 'svelte';
	let {
		variant,
		cover,
		couple,
		names,
		date,
		dateValue,
		recipient,
		opening,
		onopen
	}: {
		variant: 1 | 2 | 3 | 4 | 5 | 6 | 7;
		cover: string;
		couple: string;
		names: Snippet;
		date: string;
		dateValue: string | null | undefined;
		recipient: string;
		opening: boolean;
		onopen: () => void;
	} = $props();
	const dateDigits = $derived.by(() => {
		if (!dateValue) return [];
		const value = new Date(dateValue);
		if (Number.isNaN(value.getTime())) return [];
		const parts = new Intl.DateTimeFormat('id-ID', {
			day: '2-digit',
			month: '2-digit',
			year: '2-digit',
			timeZone: 'Asia/Jakarta'
		}).formatToParts(value);
		return ['day', 'month', 'year'].map(
			(type) => parts.find((part) => part.type === type)?.value ?? ''
		);
	});
</script>

{#if variant === 2}
	<img
		class="minimal-botanical-leaf minimal-cover-leaf"
		src="/images/themes/minimalist/monstera.webp"
		alt=""
		aria-hidden="true"
		width="800"
		height="800"
		fetchpriority="high"
		decoding="async"
	/>
{:else}
	<div class="minimal-cover-art" aria-hidden="true">
		{#if cover}<img
				src={cover}
				alt=""
				width="1200"
				height="900"
				fetchpriority="high"
				decoding="async"
			/>{/if}
	</div>
{/if}
{#if variant === 4 && dateDigits.length}
	<div class="minimal-date-digits" aria-hidden="true">
		{#each dateDigits as part, index (index)}<span>{part}</span>{/each}
	</div>
{/if}
<div class="edition-cover-card minimal-cover-layout">
	<div class="edition-cover-heading">
		<h1 class="edition-cover-names" aria-label={couple}>{@render names()}</h1>
	</div>
	<p class="edition-cover-date">{date}</p>
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
</div>
