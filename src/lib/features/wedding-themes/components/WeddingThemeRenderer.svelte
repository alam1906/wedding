<script lang="ts">
	import { getWeddingTheme } from '../registry/wedding-theme-registry.js';
	import type { WeddingThemeProps } from '../model/wedding-theme.js';

	type Props = WeddingThemeProps & {
		theme: string;
	};

	let { wedding, theme }: Props = $props();
	let definition = $derived(getWeddingTheme(theme));
</script>

{#await definition.load() then module}
	{@const Theme = module.default}
	<Theme {wedding} />
{:catch}
	<div class="grid min-h-screen place-items-center bg-gray-100 px-5 text-center text-gray-900">
		<div>
			<h1 class="text-2xl font-bold">Tema gagal dimuat</h1>
			<p class="mt-2 text-gray-600">Silakan muat ulang halaman undangan.</p>
		</div>
	</div>
{/await}
