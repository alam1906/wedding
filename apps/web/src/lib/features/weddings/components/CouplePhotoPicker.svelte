<script lang="ts">
	import { OPTIMIZABLE_IMAGE_ACCEPT } from '#lib/shared/image/optimize-image.js';

	type Props = {
		preview: string;
		label: string;
		disabled?: boolean;
		onchange: (event: Event) => void | Promise<void>;
		onremove: () => void;
	};

	let { preview, label, disabled = false, onchange, onremove }: Props = $props();
	let input = $state<HTMLInputElement>();

	function removePhoto() {
		if (disabled) return;
		if (input) input.value = '';
		onremove();
	}
</script>

<div class="mt-4 flex w-fit flex-col items-center">
	{#if preview}
		<img src={preview} alt={`Preview ${label}`} class="size-22 rounded-full object-cover" />
		<button
			type="button"
			onclick={removePhoto}
			{disabled}
			aria-label={`Hapus foto ${label}`}
			class="group mt-1 inline-flex min-h-11 cursor-pointer items-center justify-center gap-1.5 border-0 bg-transparent px-1 py-2 text-xs font-bold text-red-600 shadow-none transition-colors hover:text-red-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:cursor-not-allowed disabled:opacity-50"
		>
			<svg
				aria-hidden="true"
				class="size-4 shrink-0"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5"></path>
			</svg>
			<span class="underline-offset-4 group-hover:underline">Hapus foto</span>
		</button>
	{:else}
		<button
			type="button"
			onclick={() => input?.click()}
			{disabled}
			aria-label={`Pilih foto ${label}`}
			class="grid size-22 cursor-pointer place-items-center rounded-full border-2 border-dashed border-[#191919] bg-transparent p-0 text-[#5c554e] transition-colors hover:text-[#191919] disabled:cursor-not-allowed disabled:opacity-50"
		>
			<svg
				aria-hidden="true"
				class="size-7"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<path d="m14 5 5 5M4 20l3.5-.7L19 7.8a2.1 2.1 0 0 0-3-3L4.7 16.5 4 20Z"></path>
			</svg>
		</button>
	{/if}
	<input
		bind:this={input}
		type="file"
		accept={OPTIMIZABLE_IMAGE_ACCEPT}
		{onchange}
		{disabled}
		aria-label={`Pilih file foto ${label}`}
		class="hidden"
	/>
</div>
