<script lang="ts">
	let { facets = false }: { facets?: boolean } = $props();
</script>

<svg
	class="floral-frame"
	viewBox="0 0 400 460"
	fill="none"
	aria-hidden="true"
	preserveAspectRatio="none"
>
	<polygon points="200,8 391,119 391,341 200,452 9,341 9,119" vector-effect="non-scaling-stroke" />
	{#if facets}
		<polygon
			points="200,8 391,119 391,341 200,452 9,341 9,119"
			transform="rotate(8 200 230)"
			vector-effect="non-scaling-stroke"
		/>
		<polygon
			points="200,8 391,119 391,341 200,452 9,341 9,119"
			transform="rotate(-8 200 230)"
			vector-effect="non-scaling-stroke"
		/>
	{/if}
</svg>
