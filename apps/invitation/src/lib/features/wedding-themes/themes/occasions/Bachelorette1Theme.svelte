<script lang="ts">
	import type { WeddingThemeProps } from '../../model/wedding-theme.js';
	import EditionTheme from '../editions/EditionTheme.svelte';
	import './occasions.css';
	let { wedding }: WeddingThemeProps = $props();
</script>

<EditionTheme {wedding} theme="bachelorette-1" />
