<script lang="ts">
	import { untrack } from 'svelte';

	import { WeddingThemeRenderer } from '#lib/features/wedding-themes/index.js';
	import { formatPersonName } from '#lib/features/wedding-themes/shared/theme-utils.js';
	import {
		WeddingDataError,
		getWeddingBySlug,
		type WeddingData
	} from '#lib/features/weddings/index.js';
	import type { PageProps } from './$types';

	let { params }: PageProps = $props();

	async function loadWedding(
		slug: string
	): Promise<{ wedding: WeddingData | null; errorMessage: string }> {
		try {
			return { wedding: await getWeddingBySlug(slug), errorMessage: '' };
		} catch (error) {
			return {
				wedding: null,
				errorMessage:
					error instanceof WeddingDataError && error.message === 'Tidak dapat terhubung ke server.'
						? error.message
						: 'Undangan tidak ditemukan atau belum dipublikasikan.'
			};
		}
	}

	const { wedding, errorMessage } = await loadWedding(untrack(() => params.slug));
	const coupleName = wedding
		? (formatPersonName(wedding.groom_name) || 'Mempelai Pria') +
			' & ' +
			(formatPersonName(wedding.bride_name) || 'Mempelai Wanita')
		: 'Undangan Pernikahan';
</script>

<svelte:head>
	<title>{coupleName} | Wedez</title>
	<meta
		name="description"
		content={wedding
			? 'Undangan pernikahan ' + coupleName + '. Lihat detail acara dan lokasi pernikahan.'
			: errorMessage}
	/>
</svelte:head>

{#if wedding}
	<WeddingThemeRenderer theme={wedding.theme} {wedding} />
{:else}
	<main class="grid min-h-screen place-items-center bg-gray-100 px-5 py-16 text-gray-900">
		<section
			class="w-full max-w-lg rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-sm sm:p-12"
		>
			<p class="text-xs font-bold tracking-[0.3em] text-gray-500 uppercase">Wedez</p>
			<h1 class="mt-5 text-3xl font-bold">Undangan belum tersedia</h1>
			<p class="mt-4 leading-7 text-gray-600">{errorMessage}</p>
			<a
				href="/"
				class="mt-8 inline-flex rounded-full bg-gray-900 px-6 py-3 text-sm font-semibold text-white hover:bg-gray-700"
				>Kembali ke beranda</a
			>
		</section>
	</main>
{/if}
