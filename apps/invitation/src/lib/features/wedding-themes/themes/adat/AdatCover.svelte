<script lang="ts">
	import type { Snippet } from 'svelte';
	let {
		theme,
		motif,
		cover,
		couple,
		names,
		date,
		recipient,
		opening,
		onopen
	}: {
		theme: string;
		motif: string;
		cover: string;
		couple: string;
		names: Snippet;
		date: string;
		recipient: string;
		opening: boolean;
		onopen: () => void;
	} = $props();
</script>

<div class="adat-cover-shell">
	<div class="adat-cover-scenery" aria-hidden="true">
		<img
			src={theme === 'jawa-timur' && cover ? cover : '/images/themes/adat/tropical-engraving.webp'}
			alt=""
			fetchpriority="high"
			decoding="async"
		/>
	</div>
	<div class="adat-cover-panel" aria-hidden="true"></div>
	{#if theme === 'sumatera-utara'}
		<div class="adat-ulos" aria-hidden="true"></div>
		<div class="adat-envelope" aria-hidden="true"><span></span><span></span></div>
	{/if}
	{#if theme === 'jawa-timur' || theme === 'bali'}
		<div class="adat-cover-sides" aria-hidden="true">
			{#each ['left', 'right'] as side (side)}
				<img
					class={'adat-side-' + side}
					src={'/images/themes/adat/' + (theme === 'bali' ? 'penjor' : 'gunungan') + '.webp'}
					alt=""
					decoding="async"
				/>
			{/each}
		</div>
	{/if}
	<div class="edition-cover-card adat-cover-layout">
		{#if theme !== 'jawa-timur'}
			<div class="adat-cover-emblem" aria-hidden="true">
				<img
					src={'/images/themes/adat/' + motif + '.webp'}
					alt=""
					fetchpriority="high"
					decoding="async"
				/>
			</div>
		{/if}
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
</div>
