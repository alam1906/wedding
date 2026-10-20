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
</script>

<svelte:head
	><title>Rekening Affiliate - Wedez</title><meta name="robots" content="noindex" /></svelte:head
>
<h2 class="text-2xl font-extrabold tracking-tight">Rekening pencairan</h2>
<p class="mt-2 text-sm text-[#5c554e]">
	Pastikan rekening dan nama penerima sudah benar sebelum mengajukan pencairan.
</p>
{#if affiliate}
	<form
		onsubmit={save}
		class="mt-8 w-full space-y-5 border-2 border-[#191919] bg-white p-6 shadow-[7px_7px_0_#191919] sm:p-8"
	>
		<div>
			<label class="form-label mb-2 block" for="bank-name">Nama bank</label>
			<input
				id="bank-name"
				name="bank_name"
				value={affiliate.bank_name}
				required
				maxlength="80"
				placeholder="Contoh: BCA"
				class="form-control"
				disabled={busy}
			/>
		</div>
		<div>
			<label class="form-label mb-2 block" for="account-number">Nomor rekening</label>
			<input
				id="account-number"
				name="account_number"
				value={affiliate.account_number}
				required
				pattern={'[0-9]{5,40}'}
				inputmode="numeric"
				maxlength="40"
				class="form-control"
				disabled={busy}
			/>
		</div>
		<div>
			<label class="form-label mb-2 block" for="account-name">Nama pemilik rekening</label>
			<input
				id="account-name"
				name="account_name"
				value={affiliate.account_name}
				required
				maxlength="120"
				autocomplete="name"
				class="form-control"
				disabled={busy}
			/>
		</div>
		<p class="text-xs leading-5 text-[#5c554e]">
			Perubahan rekening berlaku untuk pengajuan berikutnya. Rekening pada pengajuan yang sudah
			dibuat tetap sama.
		</p>
		{#if error}
			<p
				role="alert"
				class="border-2 border-[#191919] bg-[#fff1f2] px-4 py-3 text-sm leading-7 text-rose-800"
			>
				{error}
			</p>
		{/if}
		<button
			type="submit"
			disabled={busy}
			aria-busy={busy}
			class="inline-flex min-h-12 w-full cursor-pointer items-center justify-center border-2 border-[#191919] bg-[#ff96ca] px-[18px] py-3 text-sm leading-normal font-extrabold text-[#191919] shadow-[4px_4px_0_#191919] transition-[translate,box-shadow] duration-150 disabled:cursor-not-allowed disabled:opacity-55 motion-safe:enabled:hover:translate-x-0.5 motion-safe:enabled:hover:translate-y-0.5 motion-safe:enabled:hover:shadow-[2px_2px_0_#191919]"
			>{busy ? 'Menyimpan...' : 'Simpan rekening'}</button
		>
	</form>
{:else}
	<p class="mt-8 text-sm text-[#5c554e]">
		Daftar affiliate terlebih dahulu melalui <a
			href="/affiliate/dashboard"
			class="font-semibold text-violet-700 underline">halaman ringkasan</a
		>.
	</p>
{/if}
