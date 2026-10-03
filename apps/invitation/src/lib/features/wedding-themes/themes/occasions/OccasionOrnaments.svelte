<script lang="ts">
	import type { OccasionVariant } from './occasion-types.js';
	let {
		variant,
		placement = 'section'
	}: { variant: OccasionVariant; placement?: 'cover' | 'section' } = $props();
	const floral = $derived(
		variant === 'post-wedding-1' ? 'aster' : variant === 'wedding-anniversary-1' ? 'gardenia' : null
	);
</script>

{#if floral}
	<div class={'occasion-flowers occasion-flowers-' + placement} aria-hidden="true">
		{#each ['left', 'right'] as side (side)}
			<span class={'occasion-flowers-' + side}
				><img
					src={'/images/themes/floral/' + floral + '.webp'}
					alt=""
					width="800"
					height="800"
					loading={placement === 'cover' ? 'eager' : 'lazy'}
					decoding="async"
					data-occasion-ornament
				/></span
			>
		{/each}
	</div>
{:else if variant === 'islamic-1' || variant === 'islamic-2'}
	<div class="occasion-lanterns" aria-hidden="true">
		{#each ['left', 'right'] as side (side)}
			<svg
				class={'occasion-lantern occasion-lantern-' + side}
				viewBox="0 0 100 270"
				fill="none"
				data-occasion-ornament
			>
				<path d="M50 0v106" stroke="#b18a45" stroke-width="1" />
				<circle cx="50" cy="111" r="5" stroke="#b18a45" />
				<path d="M50 117c-2 15-10 15-10 23h20c0-8-8-8-10-23Z" fill="#cca455" />
				<path d="m40 139-17 20h54l-17-20Z" fill="#e6c580" stroke="#ad8132" />
				<path d="m27 163 5 64h36l5-64Z" fill="#fff3cc" stroke="#ba9248" stroke-width="2" />
				<path d="m27 163 13 7 2 57H32Zm46 0-13 7-2 57h10Z" fill="#e7c171" />
				<path
					d="M42 227v-43q8-18 16 0v43M50 170v55M24 161h52M30 229h40"
					stroke="#b68b3c"
					stroke-width="2"
				/>
				<path d="m30 233 20 21 20-21Zm17 21 3 8 3-8Z" fill="#d3aa5c" />
			</svg>
		{/each}
	</div>
	{#if variant === 'islamic-1'}
		<svg
			class="occasion-domes"
			viewBox="0 0 1200 180"
			preserveAspectRatio="none"
			fill="currentColor"
			aria-hidden="true"
		>
			<path
				d="M0 180V88h18V53l7-17 7 17v35h16v92h23v-58c0-21 41-31 49-50 8 19 49 29 49 50v58h28v-81h16V62l7-19 7 19v37h16v81h81v-43c0-32 76-44 86-75 10 31 86 43 86 75v43h75V77h12V40l8-24 8 24v37h12v103h30v-26c0-36 89-45 105-93 16 48 105 57 105 93v26h45V88h15V52l7-18 7 18v36h15v92h45v-55c0-21 44-34 53-57 9 23 53 36 53 57v55h72v-76h12V70l7-20 7 20v34h12v76Z"
			/>
		</svg>
	{/if}
{:else if variant === 'luxury-1'}
	<div class={'occasion-waves occasion-waves-' + placement} aria-hidden="true">
		{#each ['left', 'right'] as side (side)}
			<svg
				class={'occasion-wave occasion-wave-' + side}
				viewBox="0 0 420 560"
				fill="none"
				data-occasion-ornament
			>
				{#each Array.from({ length: 18 }, (_, index) => index) as line (line)}
					<path
						d={`M${-80 + line * 10} -30C${180 + line * 5} ${70 + line * 7} ${275 - line * 6} ${330 + line * 3} ${-30 + line * 14} 590`}
						stroke="currentColor"
						stroke-width="0.8"
					/>
				{/each}
			</svg>
		{/each}
	</div>
{/if}
