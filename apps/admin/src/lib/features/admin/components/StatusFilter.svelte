<script lang="ts">
	import { onMount } from 'svelte';

	type Props = {
		value: string;
		options: string[];
		labels: Record<string, string>;
		onchange: (value: string) => void;
	};

	let { value, options, labels, onchange }: Props = $props();
	let open = $state(false);
	let container: HTMLDivElement;
	let trigger: HTMLButtonElement;
	const selectedLabel = $derived(value ? (labels[value] ?? value) : 'Semua status');

	onMount(() => {
		function closeOnOutsideClick(event: PointerEvent) {
			if (event.target instanceof Node && !container.contains(event.target)) open = false;
		}

		function closeOnEscape(event: KeyboardEvent) {
			if (event.key !== 'Escape' || !open) return;
			open = false;
			trigger.focus();
		}

		document.addEventListener('pointerdown', closeOnOutsideClick);
		document.addEventListener('keydown', closeOnEscape);
		return () => {
			document.removeEventListener('pointerdown', closeOnOutsideClick);
			document.removeEventListener('keydown', closeOnEscape);
		};
	});

	function select(next: string) {
		open = false;
		trigger.focus();
		if (next !== value) onchange(next);
	}
</script>

<div class="relative z-20 w-full shrink-0 sm:w-48" bind:this={container}>
	<button
		bind:this={trigger}
		type="button"
		aria-label="Filter status: {selectedLabel}"
		aria-expanded={open}
		aria-controls={open ? 'admin-status-options' : undefined}
		onclick={() => (open = !open)}
		class="admin-button h-full w-full justify-between gap-3 text-left"
	>
		<span class="truncate">{selectedLabel}</span>
		<svg
			aria-hidden="true"
			class:rotate-180={open}
			class="size-4 shrink-0 transition-transform"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
		>
			<path d="m6 9 6 6 6-6" />
		</svg>
	</button>
	{#if open}
		<div
			id="admin-status-options"
			role="group"
			aria-label="Pilihan status"
			class="admin-menu absolute top-full right-0 z-30 mt-3 w-full p-1.5"
		>
			{#each [{ value: '', label: 'Semua status' }, ...options.map( (option) => ({ value: option, label: labels[option] ?? option }) )] as option (option.value)}
				<button
					type="button"
					aria-pressed={value === option.value}
					onclick={() => select(option.value)}
					class="admin-menu-option"
				>
					<span>{option.label}</span>
					{#if value === option.value}
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
							<path d="m5 12 4 4L19 6" />
						</svg>
					{/if}
				</button>
			{/each}
		</div>
	{/if}
</div>
