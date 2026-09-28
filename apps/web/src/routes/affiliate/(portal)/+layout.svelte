<script lang="ts">
	import AffiliateShell from '#lib/features/affiliates/components/AffiliateShell.svelte';
	import type { LayoutProps } from './$types';
	let { data, children }: LayoutProps = $props();
</script>

<AffiliateShell name={data.name} email={data.email} hasWedding={data.hasWedding}>
	{@render children()}
</AffiliateShell>
