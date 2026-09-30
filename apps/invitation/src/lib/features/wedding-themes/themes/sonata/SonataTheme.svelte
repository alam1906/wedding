<script lang="ts">
	import type { WeddingThemeProps } from '../../model/wedding-theme.js';
	import EditionTheme from '../editions/EditionTheme.svelte';
	import '../editions/concepts.css';
	import './sonata.css';
	let { wedding }: WeddingThemeProps = $props();
</script>

<EditionTheme {wedding} theme="sonata" />
