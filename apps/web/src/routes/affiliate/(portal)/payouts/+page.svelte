<script lang="ts">
	import AffiliateHistory from '#lib/features/affiliates/components/AffiliateHistory.svelte';
	import type { PageProps } from './$types';
	let { data }: PageProps = $props();
</script>

<AffiliateHistory kind="payouts" overview={data.overview} />
