<script lang="ts">
	import AffiliateHistory from '#lib/features/affiliates/components/AffiliateHistory.svelte';
	import AffiliatePage from '#lib/features/affiliates/components/AffiliatePage.svelte';
	import type { PageProps } from './$types';
	let { data }: PageProps = $props();
</script>

<AffiliatePage overview={data.overview} pathname="/affiliate/commissions">
	{#snippet children(overview)}<AffiliateHistory kind="commissions" {overview} />{/snippet}
</AffiliatePage>
