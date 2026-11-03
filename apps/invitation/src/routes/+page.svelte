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
	{#if data.wedding.plan_tier === 'free'}
		<p class="wedez-watermark">Dibuat dengan <strong>Wedez</strong></p>
	{/if}
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

<style>
	.wedez-watermark {
		position: fixed;
		z-index: 2147483647;
		bottom: calc(env(safe-area-inset-bottom, 0px) + 12px);
		left: calc(env(safe-area-inset-left, 0px) + 12px);
		margin: 0;
		padding: 7px 11px;
		border: 1px solid rgb(0 0 0 / 8%);
		border-radius: 999px;
		background: rgb(255 255 255 / 92%);
		color: #4b5563;
		box-shadow: 0 2px 10px rgb(0 0 0 / 6%);
		font-family: Arial, sans-serif;
		font-size: 11px;
		font-weight: 400;
		line-height: 1.4;
		white-space: nowrap;
		pointer-events: none;
		user-select: none;
	}

	.wedez-watermark strong {
		color: #24212e;
		font-weight: 600;
	}
</style>
