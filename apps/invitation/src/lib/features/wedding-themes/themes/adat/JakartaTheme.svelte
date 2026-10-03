<script lang="ts">
	import type { WeddingThemeProps } from '../../model/wedding-theme.js';
	import EditionTheme from '../editions/EditionTheme.svelte';
	import './adat.css';
	let { wedding }: WeddingThemeProps = $props();
</script>

<EditionTheme {wedding} theme="jakarta" />
