<script lang="ts">
	import { onDestroy } from 'svelte';
	import { setWeddingContext, WeddingState } from '#lib/features/weddings/index.js';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
	const wedding = setWeddingContext(new WeddingState());
	onDestroy(() => wedding.reset());
</script>

{@render children()}
