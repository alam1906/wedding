<script lang="ts">
	import { navigating } from '$app/state';
	import type { Snippet } from 'svelte';
	import WorkspaceSkeleton from './WorkspaceSkeleton.svelte';
	let { children, area }: { children: Snippet; area: 'user' | 'affiliate' } = $props();
	const changingPage = $derived(
		navigating.to?.url.pathname.startsWith(`/${area}/`) &&
			navigating.to.url.pathname !== navigating.from?.url.pathname
	);
</script>

{#if changingPage && navigating.to}
	<WorkspaceSkeleton pathname={navigating.to.url.pathname} />
{/if}
<!-- Only cover route/code loading here. Each page owns its API loading state,
	so an abandoned request cannot hold the router's render batch open. Keep the
	Kit-owned subtree mounted and unkeyed while navigation is in progress. -->
<div hidden={changingPage}>
	{@render children()}
</div>
