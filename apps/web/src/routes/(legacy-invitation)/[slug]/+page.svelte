<script lang="ts">
	import { page } from '$app/state';
	import { onMount } from 'svelte';

	import { getWeddingInvitationUrl } from '#lib/features/weddings/index.js';

	const rsvpToken = $derived(page.url.searchParams.get('rsvp')?.trim() || undefined);
	const targetUrl = $derived(getWeddingInvitationUrl(page.params.slug ?? '', rsvpToken));

	onMount(() => {
		if (targetUrl) window.location.replace(targetUrl);
	});
</script>

<svelte:head>
	<title>Mengalihkan undangan | Wedez</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<main class="grid min-h-screen place-items-center bg-gray-100 px-5 py-16 text-gray-900">
	<section class="w-full max-w-lg rounded-3xl bg-white p-8 text-center shadow-sm sm:p-12">
		<p class="text-xs font-bold tracking-[0.3em] text-gray-500 uppercase">Wedez</p>
		<h1 class="mt-5 text-2xl font-bold">Membuka undangan</h1>
		<p class="mt-3 text-gray-600">Anda akan dialihkan ke alamat undangan yang baru.</p>
		{#if targetUrl}
			<a
				href={targetUrl}
				class="mt-7 inline-flex rounded-full bg-gray-900 px-6 py-3 text-sm font-semibold text-white"
			>
				Buka undangan
			</a>
		{/if}
	</section>
</main>
