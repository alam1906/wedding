<script lang="ts">
	import { page } from '$app/state';
	import RefreshIcon from '#lib/features/affiliates/components/RefreshIcon.svelte';
</script>

<svelte:head><title>Affiliate - Wedez</title></svelte:head>
<main class="workspace grid min-h-screen place-items-center px-6">
	<div class="ws-panel max-w-md p-8 text-center">
		<h1 class="text-xl font-extrabold text-[#191919]">Halaman affiliate belum dapat dimuat</h1>
		<p class="mt-3 text-sm text-[#5c554e]">
			{page.status === 401 || page.status === 403
				? 'Silakan masuk kembali untuk melanjutkan.'
				: 'Periksa koneksi internet, lalu coba lagi.'}
		</p>
		<div class="mt-6 flex justify-center gap-4">
			<button
				type="button"
				onclick={() => window.location.reload()}
				aria-label="Segarkan halaman"
				class="ws-button ws-button--icon ws-button--primary group grid size-11 cursor-pointer place-items-center transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700"
			>
				<RefreshIcon />
			</button><a href="/login" class="px-4 py-3 text-sm font-semibold text-violet-700">Masuk</a>
		</div>
	</div>
</main>
