<script lang="ts">
	import { TRANSFER_PROOF_TYPES, transferProofError } from '../model.js';

	let { file = $bindable<File | null>(null), disabled = false } = $props<{
		file?: File | null;
		disabled?: boolean;
	}>();
	let input: HTMLInputElement;
	let preview = $state('');
	let error = $state('');

	$effect(() => {
		const url = file ? URL.createObjectURL(file) : '';
		preview = url;
		return () => {
			if (url) URL.revokeObjectURL(url);
		};
	});

	function selectFile(event: Event) {
		const element = event.currentTarget as HTMLInputElement;
		const selected = element.files?.[0] ?? null;
		error = selected ? transferProofError(selected) : '';
		file = error ? null : selected;
		if (error) element.value = '';
	}

	function clearFile() {
		file = null;
		error = '';
		input.value = '';
		input.focus();
	}
</script>

<div class="mt-5">
	<label for="transfer-proof" class="block text-sm font-medium text-gray-700">Bukti transfer</label>
	<input
		bind:this={input}
		id="transfer-proof"
		name="transfer_proof"
		type="file"
		accept={TRANSFER_PROOF_TYPES.join(',')}
		required
		{disabled}
		onchange={selectFile}
		aria-invalid={error ? 'true' : undefined}
		aria-describedby={error ? 'transfer-proof-hint transfer-proof-error' : 'transfer-proof-hint'}
		class="admin-input mt-2 w-full text-sm file:mr-3 file:cursor-pointer file:border-0 file:bg-gray-50 file:px-4 file:py-3 file:text-sm file:font-semibold file:text-gray-700 hover:file:bg-gray-100 disabled:opacity-50"
	/>
	<p id="transfer-proof-hint" class="mt-2 text-xs text-gray-500">
		JPG, PNG, atau WebP. Maksimal 5 MB.
	</p>
	{#if error}
		<p id="transfer-proof-error" role="alert" class="mt-2 text-sm text-red-600">{error}</p>
	{/if}
	{#if file && preview}
		<div class="mt-3 rounded-xl border border-gray-200 p-3">
			<img
				src={preview}
				alt="Pratinjau bukti transfer"
				class="mx-auto max-h-52 rounded-lg object-contain"
			/>
			<div class="mt-3 flex items-center justify-between gap-3">
				<p class="min-w-0 truncate text-xs text-gray-500">{file.name}</p>
				<button
					type="button"
					onclick={clearFile}
					{disabled}
					class="shrink-0 text-xs font-semibold text-gray-600 hover:text-gray-900 disabled:opacity-50"
					>Hapus gambar</button
				>
			</div>
		</div>
	{/if}
</div>
