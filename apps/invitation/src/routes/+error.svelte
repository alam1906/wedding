<script lang="ts">
	import { page } from '$app/state';
</script>

<svelte:head>
	<title>Tema gagal dimuat | Wedez</title>
</svelte:head>

<main class="grid min-h-screen place-items-center bg-gray-100 px-5 py-16 text-gray-900">
	<section class="w-full max-w-lg rounded-3xl bg-white p-8 text-center shadow-sm sm:p-12">
		<p class="text-xs font-bold tracking-[0.3em] text-gray-500 uppercase">Wedez</p>
		<h1 class="mt-5 text-3xl font-bold">Tema gagal dimuat</h1>
		<p class="mt-4 leading-7 text-gray-600">
			{page.error?.message || 'Silakan muat ulang halaman undangan.'}
		</p>
	</section>
</main>
