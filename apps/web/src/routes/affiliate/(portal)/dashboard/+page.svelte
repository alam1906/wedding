<script lang="ts">
	import AffiliateDashboard from '#lib/features/affiliates/components/AffiliateDashboard.svelte';
	import type { PageProps } from './$types';
	let { data }: PageProps = $props();
</script>

<AffiliateDashboard overview={await data.overview} />
