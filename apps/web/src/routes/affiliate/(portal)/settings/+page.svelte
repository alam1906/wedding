<script lang="ts">
	import AffiliateBank from '#lib/features/affiliates/components/AffiliateBank.svelte';
	import type { PageProps } from './$types';
	let { data }: PageProps = $props();
</script>

<AffiliateBank affiliate={data.overview.affiliate} />
