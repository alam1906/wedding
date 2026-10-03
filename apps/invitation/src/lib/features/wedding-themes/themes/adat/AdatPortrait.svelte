<script lang="ts">
	let {
		photo,
		name,
		frame,
		eager = false
	}: {
		photo: string | null | undefined;
		name: string;
		frame: 'arch' | 'oval';
		eager?: boolean;
	} = $props();
</script>

<div class={'adat-portrait-frame adat-frame-' + frame}>
	<div class="edition-portrait">
		{#if photo}
			<img
				src={photo}
				alt={name}
				width="480"
				height="640"
				loading={eager ? 'eager' : 'lazy'}
				decoding="async"
			/>
		{:else}
			<span class="edition-initial" aria-hidden="true">{name.charAt(0)}</span>
		{/if}
	</div>
	<img
		class="adat-frame-ornament"
		src={'/images/themes/adat/' + frame + '-frame.webp'}
		alt=""
		aria-hidden="true"
		width="600"
		height="800"
		loading={eager ? 'eager' : 'lazy'}
		decoding="async"
	/>
</div>
