<script lang="ts">
	import { page } from '$app/state';
	import RefreshIcon from '#lib/features/affiliates/components/RefreshIcon.svelte';
</script>

<svelte:head><title>Affiliate - Wedez</title></svelte:head>
<main class="grid min-h-screen place-items-center bg-gray-100 px-4">
	<div class="max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center">
		<h1 class="text-xl font-bold text-gray-900">Halaman affiliate belum dapat dimuat</h1>
		<p class="mt-3 text-sm text-gray-500">
			{page.status === 401 || page.status === 403
				? 'Silakan masuk kembali untuk melanjutkan.'
				: 'Periksa koneksi internet, lalu coba lagi.'}
		</p>
		<div class="mt-6 flex justify-center gap-4">
			<button
				type="button"
				onclick={() => window.location.reload()}
				aria-label="Segarkan halaman"
				class="group grid size-11 cursor-pointer place-items-center rounded-full bg-linear-to-br from-[#9400ff] to-[#7200e8] text-white shadow-md shadow-violet-500/25 transition hover:shadow-lg hover:shadow-violet-500/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700 active:scale-95"
			>
				<RefreshIcon />
			</button><a href="/login" class="px-4 py-3 text-sm font-semibold text-violet-700">Masuk</a>
		</div>
	</div>
</main>
