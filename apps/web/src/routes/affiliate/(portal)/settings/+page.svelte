<script lang="ts">
	import AffiliateBank from '#lib/features/affiliates/components/AffiliateBank.svelte';
	import AffiliatePage from '#lib/features/affiliates/components/AffiliatePage.svelte';
	import type { PageProps } from './$types';
	let { data }: PageProps = $props();
</script>

<AffiliatePage overview={data.overview} pathname="/affiliate/settings">
	{#snippet children(overview)}<AffiliateBank affiliate={overview.affiliate} />{/snippet}
</AffiliatePage>
