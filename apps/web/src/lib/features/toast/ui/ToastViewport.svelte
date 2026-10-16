<script lang="ts">
	import { fly } from 'svelte/transition';
	import { prefersReducedMotion } from 'svelte/motion';
	import { getToastContext, type ToastVariant } from '../model/toast.svelte.js';

	const toast = getToastContext();

	const variantClasses: Record<ToastVariant, string> = {
		error: 'bg-[#ffb8a5]',
		success: 'bg-[#6bdd8b]',
		info: 'bg-[#c5e7ff]'
	};
</script>

<div
	class="pointer-events-none fixed inset-x-4 top-4 z-100 flex flex-col items-end gap-4 sm:left-auto sm:w-full sm:max-w-sm"
	aria-live="polite"
	aria-atomic="false"
>
	{#each toast.items as item (item.id)}
		<div
			role={item.variant === 'error' ? 'alert' : 'status'}
			class={`pointer-events-auto flex min-h-16 w-full items-center gap-3 border-2 border-[#191919] p-4 text-[#191919] shadow-[5px_5px_0_#191919] ${variantClasses[item.variant]}`}
			transition:fly={{
				y: prefersReducedMotion.current ? 0 : -12,
				duration: prefersReducedMotion.current ? 0 : 180
			}}
		>
			<span class="grid size-5 shrink-0 place-items-center text-lg font-black" aria-hidden="true">
				{item.variant === 'success' ? '\u2713' : item.variant === 'error' ? '!' : 'i'}
			</span>

			<p class="min-w-0 flex-1 text-sm leading-6 font-extrabold [overflow-wrap:anywhere]">
				{item.message}
			</p>

			<button
				type="button"
				class="grid size-7 shrink-0 cursor-pointer place-items-center border-2 border-[#191919] text-current hover:bg-white/30 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#191919]"
				onclick={() => toast.dismiss(item.id)}
				aria-label="Tutup notifikasi"
			>
				<svg viewBox="0 0 20 20" class="size-4" fill="none" aria-hidden="true">
					<path d="m5 5 10 10M15 5 5 15" stroke="currentColor" stroke-width="2.5" />
				</svg>
			</button>
		</div>
	{/each}
</div>
