<script lang="ts">
	import type { WeddingThemeProps } from '../../model/wedding-theme.js';
	import WeddingThemeCanvas from '../shared/WeddingThemeCanvas.svelte';

	let { wedding }: WeddingThemeProps = $props();
</script>

<WeddingThemeCanvas theme="3d-design-3" {wedding} />
