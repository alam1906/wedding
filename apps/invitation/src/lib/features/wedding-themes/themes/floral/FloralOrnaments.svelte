<script lang="ts">
	let {
		src,
		placement = 'corners',
		eager = false
	}: {
		src: string;
		placement?: 'corners' | 'bottom' | 'sides';
		eager?: boolean;
	} = $props();
</script>

<div class={'floral-ornaments floral-ornaments-' + placement} aria-hidden="true">
	{#each ['left', 'right'] as side (side)}
		<span class={'floral-spray floral-spray-' + side}>
			<img
				{src}
				alt=""
				width="800"
				height="800"
				loading={eager ? 'eager' : 'lazy'}
				decoding="async"
				data-floral-spray
			/>
		</span>
	{/each}
</div>
