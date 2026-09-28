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
		<label for={id} class="text-sm font-medium text-gray-700">{label}</label>
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
			class="w-full rounded-xl border border-[#cbd5e1] bg-white px-4 py-3 text-sm text-gray-900 transition outline-none placeholder:text-gray-400 focus:border-[#9400ff] focus:ring-0 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
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
				class="absolute top-1/2 right-2 grid size-7 -translate-y-1/2 place-items-center rounded-md text-[#8500e8] transition hover:bg-purple-50 focus-visible:ring-2 focus-visible:ring-[#9400ff] focus-visible:outline-none disabled:cursor-not-allowed disabled:text-gray-400"
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
		<p id={errorId} class="mt-2 text-sm text-red-600">{error}</p>
	{/if}
</div>
