<script lang="ts">
	import { getWeddingTheme } from '../registry/wedding-theme-registry.js';
	import type { WeddingThemeKey, WeddingThemeProps } from '../model/wedding-theme.js';
	import KinetikaTheme from '../themes/kinetika/KinetikaTheme.svelte';
	import WeddingThemeCanvas from '../themes/shared/WeddingThemeCanvas.svelte';

	type Props = WeddingThemeProps & {
		theme: string;
	};

	let { wedding, theme }: Props = $props();
	let definition = $derived(getWeddingTheme(theme));
	function isCanvasTheme(
		key: WeddingThemeKey
	): key is Exclude<
		WeddingThemeKey,
		| 'kinetika'
		| 'anomali'
		| 'selaras'
		| 'pramesti'
		| 'seruni'
		| 'arsir'
		| 'kusuma'
		| 'aurelia'
		| 'arunika'
		| 'zamrud'
		| 'cendana'
		| 'lentera'
		| 'safira'
		| 'renjana'
		| 'monokrom'
		| 'swarna'
		| 'sonata'
		| 'jelajah'
		| 'folio'
		| 'pusaka'
		| 'sinema'
		| 'adikara'
		| 'komika'
		| 'warta'
		| 'retro'
		| 'kristal'
		| 'amerta'
		| 'niskala'
		| 'sakura'
		| 'lazuardi'
	> {
		return (
			key !== 'kinetika' &&
			key !== 'anomali' &&
			key !== 'selaras' &&
			key !== 'pramesti' &&
			key !== 'seruni' &&
			key !== 'arsir' &&
			key !== 'kusuma' &&
			key !== 'aurelia' &&
			key !== 'arunika' &&
			key !== 'zamrud' &&
			key !== 'cendana' &&
			key !== 'lentera' &&
			key !== 'safira' &&
			key !== 'renjana' &&
			key !== 'monokrom' &&
			key !== 'swarna' &&
			key !== 'sonata' &&
			key !== 'jelajah' &&
			key !== 'folio' &&
			key !== 'pusaka' &&
			key !== 'sinema' &&
			key !== 'adikara' &&
			key !== 'komika' &&
			key !== 'warta' &&
			key !== 'retro' &&
			key !== 'kristal' &&
			key !== 'amerta' &&
			key !== 'niskala' &&
			key !== 'sakura' &&
			key !== 'lazuardi'
		);
	}
	const canvasTheme = $derived(isCanvasTheme(definition.key) ? definition.key : 'minimalist-1');
</script>

{#if definition.key === 'kinetika'}
	<KinetikaTheme {wedding} />
{:else if !isCanvasTheme(definition.key)}
	{#await definition.load()}
		<div class="theme-loading" role="status">Memuat undangan...</div>
	{:then { default: Theme }}
		{#key wedding.id}
			<Theme {wedding} />
		{/key}
	{:catch}
		<div class="theme-loading" role="alert">
			Undangan belum dapat dimuat. Silakan muat ulang halaman.
		</div>
	{/await}
{:else}
	<WeddingThemeCanvas theme={canvasTheme} {wedding} />
{/if}

<style>
	.theme-loading {
		display: grid;
		min-height: 100dvh;
		place-items: center;
		padding: 2rem;
		background: #f7f4ee;
		color: #233b32;
		text-align: center;
	}
</style>
