<script lang="ts">
	import { navigating, page } from '$app/state';
	import { afterNavigate, invalidate } from '$app/navigation';
	import type { Snippet } from 'svelte';
	import WorkspaceSkeleton from './WorkspaceSkeleton.svelte';
	let { children, area }: { children: Snippet; area: 'user' | 'affiliate' } = $props();
	let failedBoundary: { pathname: string; reset: () => void } | undefined;
	const changingPage = $derived(
		navigating.to?.url.pathname.startsWith(`/${area}/`) &&
			navigating.to.url.pathname !== navigating.from?.url.pathname
	);
	function rememberFailure(_cause: unknown, reset: () => void) {
		failedBoundary = { pathname: page.url.pathname, reset };
	}
	// A stable boundary must still recover when leaving a failed page. Reset only
	// after Kit has committed the new children, never while the old route is pending.
	afterNavigate(({ to }) => {
		if (failedBoundary && to && failedBoundary.pathname !== to.url.pathname) {
			const { reset } = failedBoundary;
			failedBoundary = undefined;
			reset();
		}
	});
	async function retry(reset: () => void) {
		if (area === 'affiliate') await invalidate('wedez:affiliate');
		failedBoundary = undefined;
		reset();
	}
</script>

{#if changingPage && navigating.to}
	<WorkspaceSkeleton pathname={navigating.to.url.pathname} />
{/if}
<!-- Kit owns the route subtree. Keying it by pathname can retain/reuse a pending
	branch on A → B → A, leaving the URL and rendered page out of sync. Keep one
	boundary and use navigating for subsequent loading states instead of remounting it. -->
<div hidden={changingPage}>
	<svelte:boundary onerror={rememberFailure}>
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
</div>
