<script lang="ts">
	import { onMount } from 'svelte';
	import { landingPlans } from '#lib/features/landing/model/landing-content.js';
	import { getPaymentQuote } from '#lib/features/payments/api/payment.js';
	import PaymentIcon from '#lib/features/payments/components/PaymentIcon.svelte';
	import { getCurrentWedding } from '#lib/features/weddings/api/wedding.js';
	import type { WeddingPlanTier } from '#lib/features/weddings/index.js';

	let tier = $state<WeddingPlanTier | null>(null);
	let price = $state<number | null>(null);
	let loading = $state(true);
	let feedback = $state('');
	const rupiah = new Intl.NumberFormat('id-ID', {
		style: 'currency',
		currency: 'IDR',
		maximumFractionDigits: 0
	});
	const featureLabels = ['Pilihan tema', 'Jumlah tamu', 'Watermark Wedez'];
	const featureValues = [
		['Tema terbatas', 'Tamu terbatas', 'Ditampilkan'],
		['Semua tema premium', 'Tanpa batas', 'Tidak ditampilkan']
	];

	onMount(() => {
		let active = true;
		void Promise.allSettled([getCurrentWedding(), getPaymentQuote('')]).then(
			([weddingResult, quoteResult]) => {
				if (!active) return;
				if (weddingResult.status === 'fulfilled') tier = weddingResult.value.plan_tier;
				if (quoteResult.status === 'fulfilled') price = quoteResult.value.original_amount;
				if (weddingResult.status === 'rejected') {
					feedback = 'Status paket belum dapat dimuat. Silakan muat ulang halaman.';
				} else if (quoteResult.status === 'rejected') {
					feedback = 'Harga Pro belum dapat dimuat. Harga terbaru tersedia di halaman pembayaran.';
				}
				loading = false;
			}
		);
		return () => {
			active = false;
		};
	});
</script>

<svelte:head>
	<title>Upgrade — Wedez</title>
	<meta name="description" content="Bandingkan paket Free dan Pro untuk undangan pernikahanmu." />
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<section class="px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
	<div class="w-full">
		<div class="mb-8">
			<p class="ws-eyebrow mb-3">Paket undangan</p>
			<h1 class="text-3xl font-black tracking-tight sm:text-4xl">Free atau Pro?</h1>
			<p class="mt-3 text-sm leading-6 text-[#5c554e] sm:text-base">
				Bandingkan fiturnya dan pilih yang sesuai kebutuhanmu.
			</p>
		</div>

		{#if feedback}
			<p role="status" class="mb-6 border-2 border-[#191919] bg-[#e5fa94] px-4 py-3 text-sm">
				{feedback}
			</p>
		{/if}

		<div class="grid gap-6 md:grid-cols-2">
			{#each landingPlans as plan, index (plan.name)}
				{@const current = tier === plan.name.toLowerCase()}
				<article class="ws-panel flex min-w-0 flex-col" aria-labelledby={`plan-${plan.name}`}>
					<div class="border-b-2 border-[#191919] p-6 sm:p-8" class:bg-[#e2d2ff]={plan.featured}>
						<div class="flex min-h-8 items-center justify-between gap-3">
							<h2 id={`plan-${plan.name}`} class="text-2xl font-extrabold">{plan.name}</h2>
							{#if current}
								<span class="border border-[#191919] bg-[#e5fa94] px-3 py-1 text-xs font-bold">
									Paket aktif
								</span>
							{:else if plan.featured}
								<svg
									aria-hidden="true"
									class="size-7"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="1.8"
									stroke-linecap="round"
									stroke-linejoin="round"
								>
									<path d="m3 6 4.5 4L12 3l4.5 7L21 6l-2 11H5L3 6ZM5 21h14" />
								</svg>
							{/if}
						</div>
						<p class="mt-6 text-3xl font-black tracking-tight sm:text-4xl" aria-live="polite">
							{!plan.featured
								? 'Rp0'
								: price !== null
									? rupiah.format(price)
									: loading
										? 'Memuat…'
										: 'Lihat harga'}
						</p>
						<p class="mt-2 text-sm text-[#5c554e]">
							{plan.featured
								? 'Sekali bayar · akses selamanya'
								: 'Gratis untuk mulai membuat undangan'}
						</p>
					</div>

					<dl class="flex-1 divide-y divide-[#191919]/15 px-6 sm:px-8">
						{#each featureLabels as label, featureIndex (label)}
							<div class="py-5">
								<dt class="text-xs font-medium text-[#5c554e]">{label}</dt>
								<dd class="mt-2 flex items-center gap-2 text-sm font-bold">
									{#if plan.featured}
										<span
											class="grid size-5 shrink-0 place-items-center border border-[#191919] bg-[#e5fa94]"
										>
											<PaymentIcon name="check" size={14} />
										</span>
									{/if}
									{featureValues[index][featureIndex]}
								</dd>
							</div>
						{/each}
					</dl>

					<div class="px-6 pt-3 pb-6 sm:px-8 sm:pb-8">
						{#if current}
							<div
								role="status"
								class="flex min-h-11 items-center justify-center gap-2 border-2 border-[#191919] bg-[#fffaf1] px-4 py-3 text-sm font-bold"
							>
								<PaymentIcon name="check" size={18} /> Paketmu saat ini
							</div>
						{:else if plan.featured}
							{#if loading || tier === null}
								<button type="button" class="ws-button ws-button--primary w-full" disabled>
									{loading ? 'Memuat paket…' : 'Status paket belum tersedia'}
								</button>
							{:else}
								<a href="/payment" class="ws-button ws-button--primary w-full">
									Upgrade ke Pro <PaymentIcon name="arrow" size={18} />
								</a>
							{/if}
						{:else}
							<a href="/user/dashboard" class="ws-button w-full">Kembali ke dashboard</a>
						{/if}
					</div>
				</article>
			{/each}
		</div>
		<p class="mt-7 text-center text-xs leading-5 text-[#5c554e]">
			Kode kupon dan metode pembayaran dapat dipilih di halaman pembayaran.
		</p>
	</div>
</section>
