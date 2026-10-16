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
	class="ws-button ws-button--small mt-3 cursor-pointer px-3 py-2 text-xs transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600"
>
	Lihat bukti transfer
</button>

<dialog
	bind:this={dialog}
	onclose={resetProof}
	onclick={(event) => event.target === event.currentTarget && dialog.close()}
	aria-labelledby={`${id}-title`}
	class="ws-dialog m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-xl overflow-y-auto p-0 text-[#191919] backdrop:bg-gray-950/50"
>
	<div class="p-5 sm:p-6">
		<h2 id={`${id}-title`} class="text-lg font-extrabold">Bukti transfer</h2>
		<p class="mt-2 text-sm leading-6 text-[#5c554e]">
			{rupiah(payout.amount)} ke {payout.bank_name}
			{payout.account_number}, atas nama {payout.account_name}.
		</p>
		{#if payout.paid_at}
			<p class="mt-1 text-xs text-[#5c554e]">Dibayar {shortDate(payout.paid_at)}</p>
		{/if}
		{#if payout.transfer_reference}
			<p class="mt-1 text-xs break-words text-[#5c554e]">Referensi: {payout.transfer_reference}</p>
		{/if}

		{#if loading}
			<p role="status" class="mt-5 text-sm text-[#5c554e]">Memuat bukti transfer…</p>
		{/if}
		{#if error}
			<p role="alert" class="ws-alert ws-alert--error mt-5 px-4 py-3 text-sm text-red-700">
				{error}
			</p>
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
				class="mx-auto mt-5 max-h-[60dvh] max-w-full border-2 border-[#191919] object-contain"
			/>
		{/if}

		<div class="mt-6 flex justify-end gap-3">
			{#if error}
				<button
					type="button"
					onclick={loadProof}
					class="ws-button ws-button--primary cursor-pointer px-4 py-2.5 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600"
					>Coba lagi</button
				>
			{/if}
			<button
				type="button"
				onclick={() => dialog.close()}
				class="ws-button cursor-pointer px-4 py-2.5 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600"
				>Tutup</button
			>
		</div>
	</div>
</dialog>
