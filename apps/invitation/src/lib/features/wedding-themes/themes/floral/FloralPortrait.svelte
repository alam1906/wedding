<script lang="ts">
	import FloralOrnaments from './FloralOrnaments.svelte';
	let { photo, name, ornament }: { photo: string; name: string; ornament: string } = $props();
</script>

<div class="floral-portrait-wrap">
	<div class="edition-portrait">
		{#if photo}
			<img src={photo} alt={name} width="480" height="640" loading="lazy" decoding="async" />
		{:else}
			<span class="edition-initial" aria-hidden="true">{name.charAt(0)}</span>
		{/if}
	</div>
	<FloralOrnaments src={ornament} />
</div>
