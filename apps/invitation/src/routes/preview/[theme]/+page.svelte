<script lang="ts">
	import { WeddingThemeRenderer } from '#lib/features/wedding-themes/index.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>Preview Tema — {data.wedding.groom_name} &amp; {data.wedding.bride_name} | Wedez</title>
	<meta name="robots" content="noindex, nofollow" />
	<meta name="description" content="Preview tema undangan Wedez dengan data contoh." />
</svelte:head>

{#key data.wedding.theme}
	<WeddingThemeRenderer theme={data.wedding.theme} wedding={data.wedding} />
{/key}
