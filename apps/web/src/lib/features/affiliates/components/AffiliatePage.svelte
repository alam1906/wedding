<script lang="ts">
	import { invalidate } from '$app/navigation';
	import type { Snippet } from 'svelte';
	import type { AffiliateOverview } from '../model/affiliate.js';
	import WorkspaceSkeleton from '#lib/components/ui/WorkspaceSkeleton.svelte';
	import WorkspaceLoadError from '#lib/components/ui/WorkspaceLoadError.svelte';

	let {
		overview,
		pathname,
		children
	}: {
		overview: Promise<AffiliateOverview>;
		pathname: string;
		children: Snippet<[AffiliateOverview]>;
	} = $props();
</script>

<!-- An await block handles this page's promise independently of navigation.
	Do not use an awaited prop under a shared shell-wide async boundary. -->
{#await overview}
	<WorkspaceSkeleton {pathname} />
{:then result}
	{@render children(result)}
{:catch cause}
	<WorkspaceLoadError {cause} area="affiliate" onretry={() => invalidate('wedez:affiliate')} />
{/await}
