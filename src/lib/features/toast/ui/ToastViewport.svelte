<script lang="ts">
	import { fly } from 'svelte/transition';
	import { toast, type ToastVariant } from '../model/toast.svelte.js';

	const variantClasses: Record<ToastVariant, string> = {
		error: 'border-red-200 bg-red-50 text-red-950',
		success: 'border-emerald-200 bg-emerald-50 text-emerald-950',
		info: 'border-sky-200 bg-sky-50 text-sky-950'
	};

	const iconClasses: Record<ToastVariant, string> = {
		error: 'bg-red-600 text-white',
		success: 'bg-emerald-600 text-white',
		info: 'bg-sky-600 text-white'
	};
</script>

<div
	class="pointer-events-none fixed inset-x-4 top-4 z-100 flex flex-col items-end gap-3 sm:left-auto sm:w-full sm:max-w-sm"
	aria-live="polite"
	aria-atomic="false"
>
	{#each toast.items as item (item.id)}
		<div
			role={item.variant === 'error' ? 'alert' : 'status'}
			class={`pointer-events-auto flex w-full items-start gap-3 rounded-xl border p-4 shadow-lg ${variantClasses[item.variant]}`}
			transition:fly={{ y: -12, duration: 180 }}
		>
			<span
				class={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-full text-sm font-bold ${iconClasses[item.variant]}`}
				aria-hidden="true"
			>
				{item.variant === 'success' ? '\u2713' : item.variant === 'error' ? '!' : 'i'}
			</span>

			<p class="min-w-0 flex-1 text-sm leading-5 font-medium">{item.message}</p>

			<button
				type="button"
				class="-m-1 grid size-7 shrink-0 place-items-center rounded-lg text-current opacity-60 transition hover:bg-black/5 hover:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
				onclick={() => toast.dismiss(item.id)}
				aria-label="Tutup notifikasi"
			>
				<svg viewBox="0 0 20 20" class="size-4" fill="none" aria-hidden="true">
					<path d="m5 5 10 10M15 5 5 15" stroke="currentColor" stroke-width="1.75" />
				</svg>
			</button>
		</div>
	{/each}
</div>
