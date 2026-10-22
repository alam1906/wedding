<script lang="ts">
	import AffiliateHistory from '#lib/features/affiliates/components/AffiliateHistory.svelte';
	import AffiliatePage from '#lib/features/affiliates/components/AffiliatePage.svelte';
	import type { PageProps } from './$types';
	let { data }: PageProps = $props();
</script>

<AffiliatePage overview={data.overview} pathname="/affiliate/payouts">
	{#snippet children(overview)}<AffiliateHistory kind="payouts" {overview} />{/snippet}
</AffiliatePage>
