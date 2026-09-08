<script lang="ts">
	type Props = {
		checked?: boolean;
		label: string;
		description: string;
		ariaLabel?: string;
	};

	let {
		checked = $bindable(false),
		label,
		description,
		ariaLabel = `Aktifkan ${label.toLowerCase()}`
	}: Props = $props();
</script>

<div class="flex items-center justify-between gap-5 py-4 first:pt-0 last:pb-0">
	<div>
		<p class="text-sm font-semibold text-gray-900">{label}</p>
		<p class="mt-1 text-sm text-gray-500">{description}</p>
	</div>
	<button
		type="button"
		role="switch"
		aria-label={ariaLabel}
		aria-checked={checked}
		onclick={() => (checked = !checked)}
		class={[
			'relative h-6 w-11 shrink-0 rounded-full transition',
			checked ? 'bg-gray-900' : 'bg-gray-300'
		]}
	>
		<span
			aria-hidden="true"
			class={[
				'absolute top-1 size-4 rounded-full bg-white transition',
				checked ? 'left-6' : 'left-1'
			]}
		></span>
	</button>
</div>
