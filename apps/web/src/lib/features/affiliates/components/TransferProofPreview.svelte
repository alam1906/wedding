<script lang="ts">
	import { onDestroy } from 'svelte';
	import { getTransferProofUrl } from '../api/affiliate.js';
	import { rupiah, shortDate, type Payout } from '../model/affiliate.js';

	let { payout }: { payout: Payout } = $props();
	const id = $props.id();
	let dialog: HTMLDialogElement;
	let proofUrl = $state('');
	let loading = $state(false);
	let error = $state('');
	let requestVersion = 0;

	async function loadProof() {
		const version = ++requestVersion;
		proofUrl = '';
		error = '';
		loading = true;
		try {
			const url = await getTransferProofUrl(payout);
			if (version === requestVersion) proofUrl = url;
		} catch {
			if (version !== requestVersion) return;
			error = 'Bukti transfer tidak dapat dimuat. Silakan coba lagi.';
			loading = false;
		}
	}

	function openProof() {
		dialog.showModal();
		void loadProof();
	}

	function resetProof() {
		requestVersion++;
		proofUrl = '';
		error = '';
		loading = false;
	}

	onDestroy(resetProof);
</script>

<button
	type="button"
	onclick={openProof}
	aria-haspopup="dialog"
	class="mt-3 cursor-pointer rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-700 transition hover:border-violet-300 hover:bg-violet-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600"
>
	Lihat bukti transfer
</button>

<dialog
	bind:this={dialog}
	onclose={resetProof}
	onclick={(event) => event.target === event.currentTarget && dialog.close()}
	aria-labelledby={`${id}-title`}
	class="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-2xl border border-gray-200 bg-white p-0 text-gray-900 shadow-xl backdrop:bg-gray-950/50"
>
	<div class="p-5 sm:p-6">
		<h2 id={`${id}-title`} class="text-lg font-bold">Bukti transfer</h2>
		<p class="mt-2 text-sm leading-6 text-gray-600">
			{rupiah(payout.amount)} ke {payout.bank_name}
			{payout.account_number}, atas nama {payout.account_name}.
		</p>
		{#if payout.paid_at}
			<p class="mt-1 text-xs text-gray-500">Dibayar {shortDate(payout.paid_at)}</p>
		{/if}
		{#if payout.transfer_reference}
			<p class="mt-1 text-xs break-words text-gray-500">Referensi: {payout.transfer_reference}</p>
		{/if}

		{#if loading}
			<p role="status" class="mt-5 text-sm text-gray-500">Memuat bukti transfer…</p>
		{/if}
		{#if error}
			<p role="alert" class="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
		{:else if proofUrl}
			<img
				src={proofUrl}
				alt="Bukti transfer pencairan affiliate"
				onload={() => (loading = false)}
				onerror={() => {
					loading = false;
					error = 'Bukti transfer tidak dapat dimuat. Silakan coba lagi.';
				}}
				class:hidden={loading}
				class="mx-auto mt-5 max-h-[60dvh] max-w-full rounded-xl object-contain"
			/>
		{/if}

		<div class="mt-6 flex justify-end gap-3">
			{#if error}
				<button
					type="button"
					onclick={loadProof}
					class="cursor-pointer rounded-xl bg-violet-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600"
					>Coba lagi</button
				>
			{/if}
			<button
				type="button"
				onclick={() => dialog.close()}
				class="cursor-pointer rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600"
				>Tutup</button
			>
		</div>
	</div>
</dialog>
