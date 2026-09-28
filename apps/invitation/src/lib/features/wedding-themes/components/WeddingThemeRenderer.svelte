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
	): key is Exclude<WeddingThemeKey, 'kinetika' | 'anomali' | 'selaras'> {
		return key !== 'kinetika' && key !== 'anomali' && key !== 'selaras';
	}
	const canvasTheme = $derived(isCanvasTheme(definition.key) ? definition.key : 'minimalist-1');
</script>

{#if definition.key === 'kinetika'}
	<KinetikaTheme {wedding} />
{:else if definition.key === 'anomali' || definition.key === 'selaras'}
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
