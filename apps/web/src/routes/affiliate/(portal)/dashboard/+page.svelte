<script lang="ts">
	import AffiliateDashboard from '#lib/features/affiliates/components/AffiliateDashboard.svelte';
	import AffiliatePage from '#lib/features/affiliates/components/AffiliatePage.svelte';
	import type { PageProps } from './$types';
	let { data }: PageProps = $props();
</script>

<AffiliatePage overview={data.overview} pathname="/affiliate/dashboard">
	{#snippet children(overview)}<AffiliateDashboard {overview} />{/snippet}
</AffiliatePage>
