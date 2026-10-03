<script lang="ts">
	let { motif }: { motif: string } = $props();
</script>

<div class="adat-section-ornament" aria-hidden="true" data-adat-ornament>
	<img
		src={'/images/themes/adat/' + motif + '.webp'}
		alt=""
		width="480"
		height="480"
		loading="lazy"
		decoding="async"
	/>
</div>
