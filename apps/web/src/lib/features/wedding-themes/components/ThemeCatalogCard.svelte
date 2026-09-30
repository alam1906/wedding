<script lang="ts">
	import type { ThemeCatalogItem } from '../model/theme-catalog.js';
	import { getWeddingThemePreviewUrl } from '../model/theme-preview-url.js';

	let { theme, headingTag = 'h2' }: { theme: ThemeCatalogItem; headingTag?: 'h2' | 'h3' } =
		$props();
</script>

<article class="min-w-0">
	<a
		class="group block overflow-hidden rounded-2xl border border-gray-200 bg-white transition-[border-color,box-shadow,transform] duration-300 hover:border-violet-300 hover:shadow-xl hover:shadow-violet-950/5 focus-visible:outline-violet-600 motion-safe:hover:-translate-y-1"
		href={getWeddingThemePreviewUrl(theme.key)}
		target="_blank"
		rel="noopener noreferrer"
		aria-label="Lihat tema {theme.name} (tab baru)"
	>
		<img
			src={theme.thumbnail}
			alt="Halaman pembuka tema {theme.name}"
			width="1200"
			height="900"
			loading="lazy"
			decoding="async"
			class="aspect-4/3 w-full bg-gray-100 object-contain"
		/>
		<div class="flex min-h-18 items-center justify-center border-t border-gray-900/5 px-5 py-5">
			<svelte:element
				this={headingTag}
				class="text-center text-base font-semibold text-gray-900 transition-colors group-hover:text-violet-700 group-focus-visible:text-violet-700"
			>
				{theme.name}
			</svelte:element>
		</div>
	</a>
</article>
