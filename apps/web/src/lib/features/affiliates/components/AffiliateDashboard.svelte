<script lang="ts">
	import { invalidate } from '$app/navigation';
	import { affiliateError, enrollAffiliate } from '../api/affiliate.js';
	import { rupiah, statusLabels, type AffiliateOverview } from '../model/affiliate.js';
	import { getToastContext } from '#lib/features/toast/index.js';

	let { overview }: { overview: AffiliateOverview } = $props();
	let busy = $state(false);
	let error = $state('');
	const toast = getToastContext();
	const payoutProgress = $derived(
		Math.min(100, Math.floor((overview.totals.available / overview.minimum_payout) * 100))
	);
	const payoutRemaining = $derived(
		Math.max(0, overview.minimum_payout - overview.totals.available)
	);
	const metrics = $derived([
		{ label: 'Saldo tersedia', value: rupiah(overview.totals.available), badge: 'Siap' },
		{ label: 'Dalam pencairan', value: rupiah(overview.totals.reserved), badge: 'Diproses' },
		{ label: 'Sudah dicairkan', value: rupiah(overview.totals.paid), badge: 'Dibayar' },
		{ label: 'Pembayaran berhasil', value: String(overview.totals.conversions), badge: 'Total' }
	]);

	async function enroll() {
		if (busy) return;
		busy = true;
		error = '';
		try {
			await enrollAffiliate();
			await invalidate('wedez:affiliate');
			toast.success('Pendaftaran affiliate diajukan.');
		} catch (cause) {
			error = affiliateError(cause);
		} finally {
			busy = false;
		}
	}

	async function copyCode() {
		if (!overview.affiliate) return;
		try {
			await navigator.clipboard.writeText(overview.affiliate.code);
			toast.success('Kode kupon disalin.');
		} catch {
			toast.error('Kode gagal disalin. Silakan salin kode secara manual.');
		}
	}
</script>

<svelte:head>
	<title>Dashboard Affiliate - Wedez</title>
	<meta name="robots" content="noindex" />
</svelte:head>

{#if overview.affiliate && overview.affiliate.status !== 'active'}
	<div role="status" class="ws-inset mb-5 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-900">
		<p class="font-semibold">{statusLabels[overview.affiliate.status]}</p>
		<p>
			{overview.affiliate.status === 'pending'
				? 'Admin sedang meninjau pendaftaranmu. Kupon belum dapat digunakan.'
				: overview.affiliate.status === 'rejected'
					? 'Pendaftaran belum disetujui. Hubungi pengelola Wedez untuk informasi lebih lanjut.'
					: 'Kupon dan pengajuan pencairan dinonaktifkan sementara. Riwayat komisimu tetap tersimpan.'}
		</p>
	</div>
{/if}

<div class="ws-highlights grid w-full min-w-0 gap-5 lg:grid-cols-2">
	<article class="ws-panel flex min-w-0 items-center p-5">
		<div class="flex w-full min-w-0 items-center justify-between gap-4">
			<div class="flex min-w-0 items-center gap-3">
				<span class="ws-icon grid size-10 shrink-0 place-items-center">
					<svg
						aria-hidden="true"
						class="size-5"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="1.8"
					>
						<rect x="3" y="5" width="18" height="14" rx="2"></rect>
						<path d="M7 10h10M7 14h5"></path>
					</svg>
				</span>
				<div class="min-w-0">
					<p class="text-sm font-medium text-[#5c554e]">Kode kupon</p>
					<p class="mt-1 truncate font-mono text-xl font-bold tracking-wider text-[#191919]">
						{overview.affiliate?.code || 'Belum tersedia'}
					</p>
				</div>
			</div>
			{#if overview.affiliate}
				<button
					type="button"
					onclick={copyCode}
					disabled={overview.affiliate.status !== 'active'}
					aria-label="Salin kode kupon"
					title="Salin kode kupon"
					class="ws-button ws-button--icon grid size-10 shrink-0 cursor-pointer place-items-center transition disabled:cursor-not-allowed disabled:opacity-40"
				>
					<svg
						aria-hidden="true"
						class="size-4.5"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="1.8"
					>
						<rect x="8" y="8" width="12" height="12" rx="2"></rect>
						<path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"></path>
					</svg>
				</button>
			{/if}
		</div>
	</article>

	<article class="ws-panel flex min-w-0 items-center p-5">
		<div>
			<p class="text-sm font-medium text-[#5c554e]">Status affiliate</p>
			<p class="mt-2 text-xl font-bold text-[#191919]">
				{overview.affiliate ? statusLabels[overview.affiliate.status] : 'Belum mendaftar'}
			</p>
		</div>
	</article>
</div>

{#if !overview.affiliate}
	<section class="ws-panel mt-5 p-6 sm:p-8">
		<h2 class="text-lg font-extrabold text-[#191919]">Gabung program affiliate Wedez</h2>
		<p class="mt-3 max-w-2xl text-sm leading-7 text-[#5c554e]">
			Bagikan kode kupon 6 karakter. Pengantin mendapat diskon {overview.discount_percent}%, dan
			kamu mendapat komisi {overview.commission_percent}% dari harga setelah diskon untuk setiap
			pembayaran berhasil. Pencairan mulai {rupiah(overview.minimum_payout)}.
		</p>
		<p class="mt-3 text-sm text-[#5c554e]">
			Pendaftaran akan ditinjau oleh admin. Kode dapat digunakan setelah disetujui.
		</p>
		{#if error}<p role="alert" class="mt-4 text-sm text-red-600">{error}</p>{/if}
		<button
			type="button"
			onclick={enroll}
			disabled={busy}
			class="ws-button ws-button--primary mt-6 cursor-pointer px-5 py-3 text-sm disabled:opacity-50"
			>{busy ? 'Mengajukan...' : 'Ajukan pendaftaran affiliate'}</button
		>
	</section>
{:else}
	<section class="ws-panel mt-5 p-6">
		<div class="flex flex-wrap items-start justify-between gap-4">
			<div>
				<h2 class="text-sm font-medium text-[#5c554e]">Menuju batas pencairan</h2>
				<p class="mt-2 text-2xl font-bold text-[#191919]">
					{payoutRemaining === 0 ? 'Siap diajukan' : `${payoutProgress}% tercapai`}
				</p>
				<p class="mt-2 text-sm text-[#5c554e]">
					{payoutRemaining === 0
						? `Saldo tersedia sudah mencapai minimum ${rupiah(overview.minimum_payout)}.`
						: `${rupiah(payoutRemaining)} lagi untuk mencapai minimum ${rupiah(overview.minimum_payout)}.`}
				</p>
			</div>
			<a href="/affiliate/payouts" class="ws-button px-5 py-3 text-sm transition">Lihat pencairan</a
			>
		</div>
		<div
			role="progressbar"
			aria-label="Kemajuan menuju batas pencairan"
			aria-valuemin="0"
			aria-valuemax="100"
			aria-valuenow={payoutProgress}
			class="ws-progress mt-5 h-3 overflow-hidden bg-[#fffaf1]"
		>
			<div class="h-full bg-[#ff96ca]" style:width={`${payoutProgress}%`}></div>
		</div>
	</section>

	<section class="ws-panel mt-5 p-5">
		<h2 class="font-extrabold text-[#191919]">Ringkasan affiliate</h2>
		<div class="ws-metrics mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
			{#each metrics as metric (metric.label)}
				<div class="ws-inset min-w-0 p-4">
					<p class="text-sm font-medium text-[#5c554e]">{metric.label}</p>
					<div class="mt-3 flex flex-wrap items-end justify-between gap-2">
						<p class="text-2xl font-bold text-[#191919]">{metric.value}</p>
						<span class="ws-badge px-3 py-1 text-xs font-semibold">{metric.badge}</span>
					</div>
				</div>
			{/each}
		</div>
	</section>
{/if}
