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
				{disabled}
				onclick={() => (isPasswordVisible = !isPasswordVisible)}
				aria-label={isPasswordVisible ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
				aria-pressed={isPasswordVisible}
				class="absolute inset-y-0 right-0 grid w-12 place-items-center rounded-r-xl text-gray-500 transition hover:text-gray-900 focus:ring-2 focus:ring-[#9400ff] focus:outline-none disabled:cursor-not-allowed disabled:text-gray-400"
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
						<path d="M3 3l18 18"></path>
						<path d="M10.6 10.6a2 2 0 0 0 2.8 2.8"></path>
						<path
							d="M9.9 4.2A10.8 10.8 0 0 1 12 4c5.2 0 8.7 4.2 9.7 6.1a1.9 1.9 0 0 1 0 1.8 15.6 15.6 0 0 1-3.2 4"
						></path>
						<path
							d="M6.1 6.1A15.4 15.4 0 0 0 2.3 10a1.9 1.9 0 0 0 0 1.8C3.3 13.8 6.8 18 12 18c.8 0 1.6-.1 2.3-.3"
						></path>
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
						<path d="M2.3 12C3.4 9.9 6.9 6 12 6s8.6 3.9 9.7 6c-1.1 2.1-4.6 6-9.7 6s-8.6-3.9-9.7-6Z"
						></path>
						<circle cx="12" cy="12" r="2.75"></circle>
					</svg>
				{/if}
			</button>
		{/if}
	</div>
	{#if error}
		<p id={errorId} class="mt-2 text-sm text-red-600">{error}</p>
	{/if}
</div>
