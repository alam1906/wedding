<script lang="ts">
	import { invalidate } from '$app/navigation';
	import { affiliateError, saveAffiliateBank } from '../api/affiliate.js';
	import type { Affiliate } from '../model/affiliate.js';
	import { getToastContext } from '#lib/features/toast/index.js';
	let { affiliate }: { affiliate: Affiliate | null } = $props();
	let busy = $state(false);
	let error = $state('');
	const toast = getToastContext();
	async function save(event: SubmitEvent) {
		event.preventDefault();
		if (busy || !(event.currentTarget instanceof HTMLFormElement)) return;
		const values = new FormData(event.currentTarget);
		busy = true;
		error = '';
		try {
			await saveAffiliateBank({
				bank_name: String(values.get('bank_name') || ''),
				account_number: String(values.get('account_number') || ''),
				account_name: String(values.get('account_name') || '')
			});
			await invalidate('wedez:affiliate');
			toast.success('Rekening pencairan disimpan.');
		} catch (cause) {
			error = affiliateError(cause);
		} finally {
			busy = false;
		}
	}
	const fieldClass =
		'mt-2 block w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm focus:border-violet-600 focus:ring-violet-600';
</script>

<svelte:head
	><title>Rekening Affiliate - Wedez</title><meta name="robots" content="noindex" /></svelte:head
>
<h2 class="text-2xl font-bold tracking-tight">Rekening pencairan</h2>
<p class="mt-2 text-sm text-gray-500">
	Pastikan rekening dan nama penerima sudah benar sebelum mengajukan pencairan.
</p>
{#if affiliate}
	<form
		onsubmit={save}
		class="mt-8 max-w-xl space-y-5 rounded-2xl border border-gray-200 bg-white p-6"
	>
		<label class="block text-sm font-medium" for="bank-name"
			>Nama bank<input
				id="bank-name"
				name="bank_name"
				value={affiliate.bank_name}
				required
				maxlength="80"
				placeholder="Contoh: BCA"
				class={fieldClass}
				disabled={busy}
			/></label
		>
		<label class="block text-sm font-medium" for="account-number"
			>Nomor rekening<input
				id="account-number"
				name="account_number"
				value={affiliate.account_number}
				required
				pattern={'[0-9]{5,40}'}
				inputmode="numeric"
				maxlength="40"
				class={fieldClass}
				disabled={busy}
			/></label
		>
		<label class="block text-sm font-medium" for="account-name"
			>Nama pemilik rekening<input
				id="account-name"
				name="account_name"
				value={affiliate.account_name}
				required
				maxlength="120"
				autocomplete="name"
				class={fieldClass}
				disabled={busy}
			/></label
		>
		<p class="text-xs leading-5 text-gray-500">
			Perubahan rekening berlaku untuk pengajuan berikutnya. Rekening pada pengajuan yang sudah
			dibuat tetap sama.
		</p>
		{#if error}<p role="alert" class="text-sm text-red-600">{error}</p>{/if}
		<button
			type="submit"
			disabled={busy}
			class="cursor-pointer rounded-xl bg-linear-to-r from-[#9400ff] to-[#7200e8] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
			>{busy ? 'Menyimpan...' : 'Simpan rekening'}</button
		>
	</form>
{:else}
	<p class="mt-8 text-sm text-gray-600">
		Daftar affiliate terlebih dahulu melalui <a
			href="/affiliate/dashboard"
			class="font-semibold text-violet-700 underline">halaman ringkasan</a
		>.
	</p>
{/if}
