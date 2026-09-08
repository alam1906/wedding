<script lang="ts">
	import { WeddingThemeRenderer } from '#lib/features/wedding-themes/index.js';
	import { formatPersonName } from '#lib/features/wedding-themes/shared/theme-utils.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const coupleName = $derived(
		data.wedding
			? (formatPersonName(data.wedding.groom_name) || 'Mempelai Pria') +
					' & ' +
					(formatPersonName(data.wedding.bride_name) || 'Mempelai Wanita')
			: 'Undangan Pernikahan'
	);
</script>

<svelte:head>
	<title>{coupleName} | Wedez</title>
	<meta
		name="description"
		content={data.wedding
			? 'Undangan pernikahan ' + coupleName + '. Lihat detail acara dan lokasi pernikahan.'
			: data.errorMessage}
	/>
</svelte:head>

{#if data.wedding}
	<WeddingThemeRenderer theme={data.wedding.theme} wedding={data.wedding} />
{:else}
	<main class="grid min-h-screen place-items-center bg-gray-100 px-5 py-16 text-gray-900">
		<section
			class="w-full max-w-lg rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-sm sm:p-12"
		>
			<p class="text-xs font-bold tracking-[0.3em] text-gray-500 uppercase">Wedez</p>
			<h1 class="mt-5 text-3xl font-bold">Undangan belum tersedia</h1>
			<p class="mt-4 leading-7 text-gray-600">{data.errorMessage}</p>
			<a
				href={data.mainWebsiteUrl}
				class="mt-8 inline-flex rounded-full bg-gray-900 px-6 py-3 text-sm font-semibold text-white hover:bg-gray-700"
				>Kembali ke beranda</a
			>
		</section>
	</main>
{/if}
