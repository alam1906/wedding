<script lang="ts">
	import ThemeCatalogCard from './ThemeCatalogCard.svelte';
	import {
		THEME_CATEGORIES,
		WEDDING_THEME_CATALOG,
		type ThemeCategory
	} from '../model/theme-catalog.js';

	let selectedCategory = $state<ThemeCategory>('all');
	const visibleThemes = $derived(
		selectedCategory === 'all'
			? WEDDING_THEME_CATALOG
			: WEDDING_THEME_CATALOG.filter((theme) => theme.category === selectedCategory)
	);
</script>

<a
	class="fixed top-3 left-3 z-100 -translate-y-20 rounded-lg bg-gray-900 px-4 py-3 text-sm font-semibold text-white focus:translate-y-0"
	href="#theme-catalog">Lewati ke daftar tema</a
>

<div class="flex min-h-dvh flex-col bg-gray-50">
	<header class="sticky top-0 z-50 shrink-0 border-b border-gray-200 bg-white">
		<div
			class="mx-auto grid w-full max-w-7xl grid-cols-2 items-center gap-x-4 px-4 py-3 sm:px-6 md:grid-cols-[1fr_auto_1fr] lg:px-8 2xl:max-w-[1600px] 2xl:px-10"
		>
			<a href="/" class="flex w-fit items-center gap-2" aria-label="Wedez, kembali ke beranda">
				<img
					src="/images/hero/logo-wedez.webp"
					alt=""
					width="256"
					height="256"
					class="size-10 shrink-0 object-contain sm:size-12"
				/>
				<span
					class="bg-linear-to-r from-[#9400ff] to-[#7200e8] bg-clip-text text-xl font-bold tracking-[-0.04em] text-transparent"
					>wedez.id</span
				>
			</a>
			<nav
				class="col-span-2 row-start-2 mt-3 flex justify-center gap-8 border-t border-gray-100 pt-3 text-sm font-medium md:col-span-1 md:col-start-2 md:row-start-1 md:mt-0 md:border-0 md:pt-0"
				aria-label="Navigasi utama"
			>
				<a href="/" class="text-gray-600 hover:text-violet-700">Beranda</a>
				<a href="/tema" aria-current="page" class="text-violet-700">Tema</a>
				<a href="/#harga" class="text-gray-600 hover:text-violet-700">Harga</a>
			</nav>
			<a
				href="/login"
				class="col-start-2 row-start-1 justify-self-end rounded-full bg-linear-to-r from-[#9400ff] to-[#7200e8] px-4 py-2.5 text-xs font-semibold text-white sm:px-5 sm:text-sm md:col-start-3"
				>Buat Undangan</a
			>
		</div>
	</header>

	<main
		id="theme-catalog"
		class="mx-auto w-full max-w-7xl flex-1 scroll-mt-12 px-4 pt-10 pb-16 sm:px-6 sm:pt-16 md:scroll-mt-0 lg:px-8 lg:pb-24 2xl:max-w-[1600px] 2xl:px-10"
	>
		<div
			class="flex flex-wrap items-end justify-between gap-4 border-b border-gray-200 pb-8 sm:pb-10"
		>
			<h1 class="text-4xl font-bold tracking-[-0.05em] text-gray-950 sm:text-5xl lg:text-6xl">
				Pilihan tema<span class="text-violet-600">.</span>
			</h1>
			<p
				class="pb-1 text-sm font-medium text-gray-500"
				role="status"
				aria-live="polite"
				aria-atomic="true"
			>
				{visibleThemes.length} tema
			</p>
		</div>

		<div class="my-7 flex flex-wrap gap-2 sm:my-9" role="group" aria-label="Filter kategori tema">
			{#each THEME_CATEGORIES as category (category.key)}
				<button
					type="button"
					class={selectedCategory === category.key
						? 'min-h-11 rounded-full border border-violet-700 bg-violet-700 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors focus-visible:outline-violet-600 sm:px-5'
						: 'min-h-11 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:border-violet-300 hover:text-violet-700 focus-visible:outline-violet-600 sm:px-5'}
					aria-pressed={selectedCategory === category.key}
					aria-controls="theme-grid"
					onclick={() => (selectedCategory = category.key)}>{category.label}</button
				>
			{/each}
		</div>

		<div
			id="theme-grid"
			class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:gap-6 2xl:grid-cols-4"
		>
			{#each visibleThemes as theme (theme.key)}
				<ThemeCatalogCard {theme} />
			{/each}
		</div>
	</main>

	<footer class="border-t border-gray-200 bg-white px-4 py-8 text-center">
		<p class="text-sm text-gray-500">© 2026 Wedez</p>
	</footer>
</div>
