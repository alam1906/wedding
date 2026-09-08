<script lang="ts">
	import { getWeddingTheme } from '../registry/wedding-theme-registry.js';
	import type { WeddingThemeProps } from '../model/wedding-theme.js';
	import WeddingThemeCanvas from '../themes/shared/WeddingThemeCanvas.svelte';

	type Props = WeddingThemeProps & {
		theme: string;
	};

	let { wedding, theme }: Props = $props();
	let definition = $derived(getWeddingTheme(theme));
</script>

<WeddingThemeCanvas theme={definition.key} {wedding} />
