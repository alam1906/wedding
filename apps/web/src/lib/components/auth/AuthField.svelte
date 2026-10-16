<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLInputAttributes } from 'svelte/elements';

	type Props = Pick<
		HTMLInputAttributes,
		'type' | 'autocomplete' | 'placeholder' | 'required' | 'disabled' | 'oninput'
	> & {
		id: string;
		name: string;
		label: string;
		error?: string;
		labelAction?: Snippet;
	};

	let {
		id,
		name,
		label,
		type = 'text',
		autocomplete,
		placeholder,
		required = false,
		disabled = false,
		oninput,
		error,
		labelAction
	}: Props = $props();

	const errorId = $derived(`${id}-error`);
	let isPasswordVisible = $state(false);
	const isPasswordField = $derived(type === 'password');
	const inputType = $derived(isPasswordField && isPasswordVisible ? 'text' : type);
</script>

<div>
	<div class="mb-2 flex items-center justify-between gap-4">
		<label for={id} class="form-label">{label}</label>
		{#if labelAction}
			{@render labelAction()}
		{/if}
	</div>
	<div class="relative">
		<input
			{id}
			{name}
			type={inputType}
			{autocomplete}
			{placeholder}
			{required}
			{disabled}
			{oninput}
			aria-invalid={error ? 'true' : undefined}
			aria-describedby={error ? errorId : undefined}
			class="form-control"
			class:pr-12={isPasswordField}
		/>
		{#if isPasswordField}
			<button
				type="button"
				tabindex={-1}
				{disabled}
				onclick={() => (isPasswordVisible = !isPasswordVisible)}
				aria-label={isPasswordVisible ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
				aria-pressed={isPasswordVisible}
				class="absolute top-1/2 right-2 grid size-8 -translate-y-1/2 place-items-center text-[#8500e8] hover:bg-[#ffd1e6] disabled:cursor-not-allowed disabled:text-gray-400"
			>
				{#if isPasswordVisible}
					<svg
						aria-hidden="true"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="1.8"
						stroke-linecap="round"
						stroke-linejoin="round"
						class="size-5"
					>
						<path
							d="M2.3 12C4.4 8.2 7.7 6.2 12 6.2s7.6 2 9.7 5.8c-2.1 3.8-5.4 5.8-9.7 5.8S4.4 15.8 2.3 12Z"
						></path>
						<circle cx="12" cy="12" r="2.75"></circle>
					</svg>
				{:else}
					<svg
						aria-hidden="true"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="1.8"
						stroke-linecap="round"
						stroke-linejoin="round"
						class="size-5"
					>
						<path
							d="M2.3 12C4.4 8.2 7.7 6.2 12 6.2s7.6 2 9.7 5.8c-2.1 3.8-5.4 5.8-9.7 5.8S4.4 15.8 2.3 12Z"
						></path>
						<circle cx="12" cy="12" r="2.75"></circle>
						<path d="M3 20 21 4"></path>
					</svg>
				{/if}
			</button>
		{/if}
	</div>
	{#if error}
		<p id={errorId} class="mt-2 text-sm leading-6 text-rose-700">{error}</p>
	{/if}
</div>
