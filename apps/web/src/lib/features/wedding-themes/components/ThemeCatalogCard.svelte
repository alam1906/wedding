<script lang="ts">
	import type { ThemeCatalogItem } from '../model/theme-catalog.js';
	import { getWeddingThemePreviewUrl } from '../model/theme-preview-url.js';

	let { theme, headingTag = 'h2' }: { theme: ThemeCatalogItem; headingTag?: 'h2' | 'h3' } =
		$props();
</script>

<article class="min-w-0">
	<a
		class="group block border-2 border-[#191919] bg-white text-[#191919] shadow-[5px_5px_0_#191919] transition-[box-shadow,translate] duration-150 hover:shadow-[2px_2px_0_#191919] focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[#8030e4] motion-safe:hover:translate-x-[3px] motion-safe:hover:translate-y-[3px] motion-reduce:transition-none"
		href={getWeddingThemePreviewUrl(theme.key)}
		target="_blank"
		rel="noopener noreferrer"
		aria-label="Lihat tema {theme.name} (tab baru)"
	>
		<div
			class="flex items-center justify-between border-b-2 border-[#191919] bg-[#fffaf1] px-3 py-2.5"
			aria-hidden="true"
		>
			<span class="flex gap-1.5"
				><span class="size-2 rounded-full border border-[#191919] bg-[#ff96ca]"></span><span
					class="size-2 rounded-full border border-[#191919] bg-[#e5fa94]"
				></span><span class="size-2 rounded-full border border-[#191919] bg-[#e2d2ff]"></span></span
			>
			<span class="text-[9px] font-extrabold tracking-widest">PREVIEW</span>
		</div>
		<img
			src={theme.thumbnail}
			alt="Halaman pembuka tema {theme.name}"
			width="1200"
			height="900"
			loading="lazy"
			decoding="async"
			class="aspect-4/3 w-full bg-white object-contain"
		/>
		<div
			class="flex min-h-20 items-center justify-between gap-3 border-t-2 border-[#191919] px-4 py-4"
		>
			<svelte:element
				this={headingTag}
				class="text-base leading-snug font-extrabold tracking-tight underline-offset-4 group-hover:underline group-focus-visible:underline"
			>
				{theme.name}
			</svelte:element>
			<span
				class="grid size-8 shrink-0 place-items-center border-2 border-[#191919] bg-[#ff96ca] group-hover:bg-[#e5fa94]"
				aria-hidden="true"
				><svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
					><path d="M5 12h14M13 6l6 6-6 6" /></svg
				></span
			>
		</div>
	</a>
</article>
