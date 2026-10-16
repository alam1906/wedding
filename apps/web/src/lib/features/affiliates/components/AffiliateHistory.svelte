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
	import RefreshIcon from './RefreshIcon.svelte';
	import TransferProofPreview from './TransferProofPreview.svelte';
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
<h2 class="text-2xl font-extrabold tracking-tight">
	{isPayout ? 'Pencairan komisi' : 'Riwayat komisi'}
</h2>
<p class="mt-2 text-sm text-[#5c554e]">
	{isPayout
		? 'Ajukan pencairan dan pantau status transfermu.'
		: 'Komisi dicatat setelah pembayaran pengantin terverifikasi berhasil.'}
</p>
{#if isPayout && overview.affiliate}
	<section class="ws-panel mt-6 p-6">
		<p class="text-sm text-[#5c554e]">Saldo tersedia</p>
		<p class="mt-2 text-3xl font-bold">{rupiah(overview.totals.available)}</p>
		<p class="mt-3 text-sm text-[#5c554e]">
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
			<div class="mt-5 border-2 border-[#191919] bg-[#e2d2ff] p-4 text-sm">
				<p>
					Ajukan {rupiah(overview.totals.available)} ke {overview.affiliate.bank_name}
					{overview.affiliate.account_number} atas nama {overview.affiliate.account_name}?
				</p>
				<div class="mt-4 flex gap-3">
					<button
						type="button"
						disabled={busy}
						onclick={withdraw}
						class="ws-button ws-button--primary cursor-pointer px-4 py-2.5 disabled:opacity-50"
						>{busy ? 'Mengajukan...' : 'Konfirmasi pencairan'}</button
					><button
						type="button"
						disabled={busy}
						onclick={() => (confirmation = false)}
						class="ws-button cursor-pointer px-4 py-2.5">Batal</button
					>
				</div>
			</div>
		{:else}
			<button
				type="button"
				disabled={!canWithdraw || busy}
				onclick={() => (confirmation = true)}
				class="ws-button ws-button--primary mt-5 cursor-pointer px-5 py-3 text-sm disabled:cursor-not-allowed"
				>Ajukan pencairan</button
			>
		{/if}
	</section>
{/if}
<section class="ws-panel mt-6 overflow-hidden">
	<div class="flex items-center justify-between border-b border-[#191919] px-5 py-4">
		<h2 class="font-semibold">{isPayout ? 'Riwayat pencairan' : 'Komisi masuk'}</h2>
		<button
			type="button"
			disabled={loading || busy}
			onclick={() => {
				void load();
				void invalidate('wedez:affiliate');
			}}
			aria-label={isPayout ? 'Segarkan riwayat pencairan' : 'Segarkan riwayat komisi'}
			class="ws-button ws-button--icon group grid size-10 shrink-0 cursor-pointer place-items-center transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 disabled:pointer-events-none disabled:opacity-50"
		>
			<RefreshIcon />
		</button>
	</div>
	{#if error}<p role="alert" class="px-5 py-4 text-sm text-red-600">{error}</p>{/if}
	{#if loading}<p role="status" class="px-5 py-10 text-sm text-[#5c554e]">Memuat riwayat...</p>
	{:else if !records.length}<p class="px-5 py-10 text-sm text-[#5c554e]">
			{isPayout
				? 'Belum ada pengajuan pencairan.'
				: 'Belum ada komisi. Bagikan kode kuponmu setelah keanggotaan aktif.'}
		</p>
	{:else}
		<div class="overflow-x-auto">
			<table class="ws-table w-full text-left text-sm">
				<thead class="border-b-2 border-[#191919] bg-[#e2d2ff] text-sm tracking-normal normal-case">
					<tr class="divide-x-2 divide-[#191919]">
						<th scope="col" class="px-5 py-3.5 font-bold whitespace-nowrap">Tanggal</th>
						<th scope="col" class="px-5 py-3.5 font-bold whitespace-nowrap">Nominal</th>
						<th scope="col" class="px-5 py-3.5 font-bold whitespace-nowrap">Status</th>
						<th scope="col" class="px-5 py-3.5 font-bold whitespace-nowrap">Keterangan</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-[#191919]/15"
					>{#each records as record (record.id)}<tr class="divide-x divide-[#191919]/15">
							<td class="px-5 py-4 whitespace-nowrap">{shortDate(record.created)}</td><td
								class="px-5 py-4 font-semibold whitespace-nowrap">{rupiah(record.amount)}</td
							><td class="px-5 py-4 whitespace-nowrap"
								><span data-status={record.status} class="ws-badge px-3 py-1 text-xs font-medium"
									>{statusLabels[record.status]}</span
								></td
							>
							<td class="min-w-48 px-5 py-4 text-[#5c554e]"
								>{#if 'bank_name' in record}<p>{record.bank_name} · {record.account_number}</p>
									<p class="mt-1 text-xs">
										{record.transfer_reference || record.note || 'Menunggu proses admin'}
									</p>
									{#if record.transfer_proof}
										<TransferProofPreview payout={record} />
									{/if}
								{:else}{record.void_reason ||
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
			class="flex items-center justify-between border-t border-[#191919] px-5 py-4 text-sm"
		>
			<button
				type="button"
				disabled={loading || currentPage === 1}
				onclick={() => load(currentPage - 1)}
				class="ws-link cursor-pointer font-medium text-violet-700 disabled:text-gray-300"
				>Sebelumnya</button
			><span class="text-[#5c554e]">{currentPage} / {totalPages}</span><button
				type="button"
				disabled={loading || currentPage >= totalPages}
				onclick={() => load(currentPage + 1)}
				class="ws-link cursor-pointer font-medium text-violet-700 disabled:text-gray-300"
				>Berikutnya</button
			>
		</div>{/if}
</section>
