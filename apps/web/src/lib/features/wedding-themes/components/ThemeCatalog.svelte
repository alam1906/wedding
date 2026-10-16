<script lang="ts">
	import ThemeCatalogCard from './ThemeCatalogCard.svelte';
	import {
		THEME_CATEGORIES,
		WEDDING_THEME_CATALOG,
		type ThemeCategory
	} from '../model/theme-catalog.js';

	const reversedThemes = [...WEDDING_THEME_CATALOG].reverse();
	let selectedCategory = $state<ThemeCategory>('all');
	const visibleThemes = $derived(
		selectedCategory === 'all'
			? reversedThemes
			: reversedThemes.filter((theme) => theme.category === selectedCategory)
	);
</script>

<a
	class="fixed top-3 left-3 z-100 -translate-y-20 border-2 border-[#191919] bg-[#e5fa94] px-4 py-3 text-sm font-bold text-[#191919] focus:translate-y-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#8030e4]"
	href="#theme-catalog">Lewati ke daftar tema</a
>

<div class="catalog flex min-h-dvh flex-col bg-[#fffaf1] text-[#191919]">
	<main
		id="theme-catalog"
		class="mx-auto w-full max-w-7xl flex-1 px-6 pt-7 pb-16 sm:px-8 sm:pt-10 lg:pb-24 2xl:max-w-[1600px] 2xl:px-10"
	>
		<a
			href="/#tema"
			class="inline-flex min-h-11 items-center gap-2 border-2 border-[#191919] bg-white px-4 py-2 text-xs font-extrabold shadow-[3px_3px_0_#191919] hover:bg-[#e5fa94] sm:text-sm"
		>
			<svg
				class="size-4 shrink-0"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				aria-hidden="true"><path d="M20 12H4m7-7-7 7 7 7" /></svg
			>
			Kembali ke beranda
		</a>
		<div
			class="mt-10 flex flex-wrap items-center justify-between gap-5 border-b-[3px] border-[#191919] pb-8 sm:mt-12 sm:pb-10"
		>
			<h1
				class="text-[clamp(2.75rem,6vw,5rem)] leading-none font-black tracking-[-0.05em] uppercase"
			>
				Pilihan tema<span class="text-[#8030e4]">.</span>
			</h1>
			<p
				class="border-2 border-[#191919] bg-[#e5fa94] px-4 py-2 text-sm font-extrabold shadow-[3px_3px_0_#191919] sm:px-5 sm:py-3"
				role="status"
				aria-live="polite"
				aria-atomic="true"
			>
				{visibleThemes.length} tema
			</p>
		</div>

		<div class="my-8 flex flex-wrap gap-3 sm:my-10" role="group" aria-label="Filter kategori tema">
			{#each THEME_CATEGORIES as category (category.key)}
				<button
					type="button"
					class={[
						'min-h-11 border-2 border-[#191919] px-4 py-2 text-xs font-extrabold shadow-[3px_3px_0_#191919] sm:px-5 sm:text-sm',
						selectedCategory === category.key ? 'bg-[#ff96ca]' : 'bg-white hover:bg-[#e5fa94]'
					]}
					aria-pressed={selectedCategory === category.key}
					aria-controls="theme-grid"
					onclick={() => (selectedCategory = category.key)}>{category.label}</button
				>
			{/each}
		</div>

		<div
			id="theme-grid"
			class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-7"
		>
			{#each visibleThemes as theme (theme.key)}
				<ThemeCatalogCard {theme} />
			{/each}
		</div>
	</main>

	<footer
		class="flex min-h-24 items-center justify-center border-t-2 border-[#191919] px-6 py-8 text-center"
	>
		<p class="text-sm">© 2026 Wedez</p>
	</footer>
</div>

<style>
	.catalog :global(:focus-visible) {
		outline: 3px solid #8030e4;
		outline-offset: 4px;
	}
</style>
