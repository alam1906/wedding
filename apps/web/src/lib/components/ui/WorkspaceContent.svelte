<script lang="ts">
	import { navigating, page } from '$app/state';
	import { invalidate } from '$app/navigation';
	import type { Snippet } from 'svelte';
	import WorkspaceSkeleton from './WorkspaceSkeleton.svelte';
	let { children, area }: { children: Snippet; area: 'user' | 'affiliate' } = $props();
	const changingPage = $derived(
		navigating.to?.url.pathname.startsWith(`/${area}/`) &&
			navigating.to.url.pathname !== navigating.from?.url.pathname
	);
	async function retry(reset: () => void) {
		if (area === 'affiliate') await invalidate('wedez:affiliate');
		reset();
	}
</script>

{#if changingPage && navigating.to}
	<WorkspaceSkeleton pathname={navigating.to.url.pathname} />
{/if}
<!-- Keep the mounted page alive during code/load requests; never refetch it just to show loading. -->
<div hidden={changingPage}>
	{#key page.url.pathname}
		<svelte:boundary>
			{@render children()}
			{#snippet pending()}<WorkspaceSkeleton pathname={page.url.pathname} />{/snippet}
			{#snippet failed(cause, reset)}
				{@const unauthorized = Boolean(
					cause &&
					typeof cause === 'object' &&
					'status' in cause &&
					(cause.status === 401 || cause.status === 403)
				)}
				<div class={area === 'user' ? 'px-4 py-8 sm:px-6 lg:px-10 lg:py-10' : ''}>
					<div class="ws-panel p-6" role="alert">
						<h2 class="text-lg font-extrabold">Halaman belum dapat dimuat</h2>
						<p class="mt-2 text-sm text-[#5c554e]">
							{unauthorized
								? 'Silakan masuk kembali untuk melanjutkan.'
								: 'Periksa koneksi internet, lalu coba lagi.'}
						</p>
						{#if unauthorized}<a href="/login" class="ws-button mt-5">Masuk</a>{:else}<button
								type="button"
								class="ws-button mt-5"
								onclick={() => retry(reset)}>Coba lagi</button
							>{/if}
					</div>
				</div>
			{/snippet}
		</svelte:boundary>
	{/key}
</div>
