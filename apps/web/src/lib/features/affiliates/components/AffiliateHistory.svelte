<script lang="ts">
	import { onMount } from 'svelte';
	import { invalidate } from '$app/navigation';
	import {
		affiliateError,
		getCommissions,
		getPayouts,
		requestAffiliatePayout
	} from '../api/affiliate.js';
	import {
		rupiah,
		shortDate,
		statusLabels,
		type AffiliateOverview,
		type Commission,
		type Payout
	} from '../model/affiliate.js';
	import { getToastContext } from '#lib/features/toast/index.js';
	let { kind, overview }: { kind: 'commissions' | 'payouts'; overview: AffiliateOverview } =
		$props();
	let records = $state<(Commission | Payout)[]>([]);
	let currentPage = $state(1);
	let totalPages = $state(1);
	let loading = $state(true);
	let busy = $state(false);
	let error = $state('');
	let confirmation = $state(false);
	const toast = getToastContext();
	const isPayout = $derived(kind === 'payouts');
	const bankComplete = $derived(
		Boolean(
			overview.affiliate?.bank_name &&
			overview.affiliate.account_number &&
			overview.affiliate.account_name
		)
	);
	const canWithdraw = $derived(
		overview.affiliate?.status === 'active' &&
			bankComplete &&
			overview.totals.available >= overview.minimum_payout &&
			overview.totals.reserved === 0
	);
	async function load(target = currentPage) {
		loading = true;
		error = '';
		try {
			const result = kind === 'payouts' ? await getPayouts(target) : await getCommissions(target);
			records = result.items;
			currentPage = result.page;
			totalPages = Math.max(1, result.totalPages);
		} catch (cause) {
			error = affiliateError(cause);
		} finally {
			loading = false;
		}
	}
	async function withdraw() {
		if (busy || !canWithdraw) return;
		busy = true;
		error = '';
		try {
			await requestAffiliatePayout();
			confirmation = false;
			await invalidate('wedez:affiliate');
			await load(1);
			toast.success('Pengajuan pencairan berhasil dikirim.');
		} catch (cause) {
			error = affiliateError(cause);
		} finally {
			busy = false;
		}
	}
	onMount(() => {
		void load(1);
	});
</script>

<svelte:head
	><title>{isPayout ? 'Pencairan' : 'Komisi'} Affiliate - Wedez</title><meta
		name="robots"
		content="noindex"
	/></svelte:head
>
<h2 class="text-2xl font-bold tracking-tight">
	{isPayout ? 'Pencairan komisi' : 'Riwayat komisi'}
</h2>
<p class="mt-2 text-sm text-gray-500">
	{isPayout
		? 'Ajukan pencairan dan pantau status transfermu.'
		: 'Komisi dicatat setelah pembayaran pengantin terverifikasi berhasil.'}
</p>
{#if isPayout && overview.affiliate}
	<section class="mt-6 rounded-2xl border border-gray-200 bg-white p-6">
		<p class="text-sm text-gray-500">Saldo tersedia</p>
		<p class="mt-2 text-3xl font-bold">{rupiah(overview.totals.available)}</p>
		<p class="mt-3 text-sm text-gray-500">
			Minimum pencairan {rupiah(overview.minimum_payout)}. Seluruh saldo tersedia akan diajukan.
		</p>
		{#if !bankComplete}<p class="mt-3 text-sm">
				<a href="/affiliate/settings" class="font-semibold text-violet-700 underline"
					>Lengkapi rekening pencairan</a
				> terlebih dahulu.
			</p>{/if}
		{#if overview.totals.reserved > 0}<p class="mt-3 text-sm text-amber-800">
				Ada pengajuan pencairan yang belum selesai.
			</p>{/if}
		{#if overview.affiliate.status !== 'active'}<p class="mt-3 text-sm text-amber-800">
				Keanggotaan affiliate harus aktif untuk mengajukan pencairan.
			</p>{/if}
		{#if confirmation && canWithdraw}
			<div class="mt-5 rounded-xl bg-violet-50 p-4 text-sm">
				<p>
					Ajukan {rupiah(overview.totals.available)} ke {overview.affiliate.bank_name}
					{overview.affiliate.account_number} atas nama {overview.affiliate.account_name}?
				</p>
				<div class="mt-4 flex gap-3">
					<button
						type="button"
						disabled={busy}
						onclick={withdraw}
						class="cursor-pointer rounded-lg bg-linear-to-r from-[#9400ff] to-[#7200e8] px-4 py-2.5 font-semibold text-white disabled:opacity-50"
						>{busy ? 'Mengajukan...' : 'Konfirmasi pencairan'}</button
					><button
						type="button"
						disabled={busy}
						onclick={() => (confirmation = false)}
						class="cursor-pointer rounded-lg px-4 py-2.5 font-medium text-gray-600">Batal</button
					>
				</div>
			</div>
		{:else}
			<button
				type="button"
				disabled={!canWithdraw || busy}
				onclick={() => (confirmation = true)}
				class="mt-5 cursor-pointer rounded-xl bg-linear-to-r from-[#9400ff] to-[#7200e8] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-gray-200 disabled:bg-none disabled:text-gray-500"
				>Ajukan pencairan</button
			>
		{/if}
	</section>
{/if}
<section class="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white">
	<div class="flex items-center justify-between border-b border-gray-100 px-5 py-4">
		<h2 class="font-semibold">{isPayout ? 'Riwayat pencairan' : 'Komisi masuk'}</h2>
		<button
			type="button"
			disabled={loading || busy}
			onclick={() => {
				void load();
				void invalidate('wedez:affiliate');
			}}
			class="cursor-pointer text-sm font-semibold text-violet-700 disabled:opacity-50"
			>Muat ulang</button
		>
	</div>
	{#if error}<p role="alert" class="px-5 py-4 text-sm text-red-600">{error}</p>{/if}
	{#if loading}<p role="status" class="px-5 py-10 text-sm text-gray-500">Memuat riwayat...</p>
	{:else if !records.length}<p class="px-5 py-10 text-sm text-gray-500">
			{isPayout
				? 'Belum ada pengajuan pencairan.'
				: 'Belum ada komisi. Bagikan kode kuponmu setelah keanggotaan aktif.'}
		</p>
	{:else}
		<div class="overflow-x-auto">
			<table class="w-full text-left text-sm">
				<thead class="bg-gray-50 text-xs text-gray-500"
					><tr
						><th class="px-5 py-3 font-medium">Tanggal</th><th class="px-5 py-3 font-medium"
							>Nominal</th
						><th class="px-5 py-3 font-medium">Status</th><th class="px-5 py-3 font-medium"
							>Keterangan</th
						></tr
					></thead
				>
				<tbody class="divide-y divide-gray-100"
					>{#each records as record (record.id)}<tr>
							<td class="px-5 py-4 whitespace-nowrap">{shortDate(record.created)}</td><td
								class="px-5 py-4 font-semibold whitespace-nowrap">{rupiah(record.amount)}</td
							><td class="px-5 py-4 whitespace-nowrap"
								><span class="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium"
									>{statusLabels[record.status]}</span
								></td
							>
							<td class="min-w-48 px-5 py-4 text-gray-500"
								>{#if 'bank_name' in record}<p>{record.bank_name} · {record.account_number}</p>
									<p class="mt-1 text-xs">
										{record.transfer_reference || record.note || 'Menunggu proses admin'}
									</p>{:else}{record.void_reason ||
										(record.paid_at
											? `Dibayar ${shortDate(record.paid_at)}`
											: `Komisi #${record.id.slice(-6).toUpperCase()}`)}{/if}</td
							>
						</tr>{/each}</tbody
				>
			</table>
		</div>
	{/if}
	{#if totalPages > 1}<div
			class="flex items-center justify-between border-t border-gray-100 px-5 py-4 text-sm"
		>
			<button
				type="button"
				disabled={loading || currentPage === 1}
				onclick={() => load(currentPage - 1)}
				class="cursor-pointer font-medium text-violet-700 disabled:text-gray-300">Sebelumnya</button
			><span class="text-gray-500">{currentPage} / {totalPages}</span><button
				type="button"
				disabled={loading || currentPage >= totalPages}
				onclick={() => load(currentPage + 1)}
				class="cursor-pointer font-medium text-violet-700 disabled:text-gray-300">Berikutnya</button
			>
		</div>{/if}
</section>
